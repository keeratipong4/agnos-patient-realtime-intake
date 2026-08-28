import { act } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { SupabaseClient } from "@supabase/supabase-js";

import { useStaffSync } from "./use-staff-sync";
import {
  REALTIME_EVENT,
  type FormPatchPayload,
  type FormSnapshotPayload,
  type FormSubmittedPayload,
  type SnapshotRequestPayload,
  type StatusChangedPayload,
} from "@/lib/realtime-events";
import * as supabaseModule from "@/lib/supabase";
import { createValidFullFormData } from "@/test-utils/fixtures";
import { MockRealtimeChannel, MockSupabaseClient } from "@/test-utils/mock-realtime";
import { renderHook } from "@/test-utils/render-hook";

describe("useStaffSync hook and recovery behavior", () => {
  const sessionId = "00000000-0000-4000-8000-000000000001";
  let mockClient: MockSupabaseClient;
  let mockChannel: MockRealtimeChannel;

  beforeEach(() => {
    mockClient = new MockSupabaseClient();
    vi.spyOn(supabaseModule, "hasSupabaseBrowserConfig").mockReturnValue(true);
    vi.spyOn(supabaseModule, "getSupabaseBrowserClient").mockImplementation(() => {
      mockChannel = mockClient.channel(`patient-session-${sessionId}`);
      return mockClient as unknown as SupabaseClient;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("subscribes and immediately sends SNAPSHOT_REQUEST on channel connect", async () => {
    const { result } = await renderHook(() => useStaffSync(sessionId));

    expect(result.current.connectionStatus).toBe("connecting");

    await act(async () => {
      mockChannel.triggerSubscribe("SUBSCRIBED");
    });

    const requestMessages = mockChannel.sentMessages.filter(
      (m) => m.event === REALTIME_EVENT.snapshotRequest,
    );
    expect(requestMessages.length).toBe(1);
    const payload = requestMessages[0].payload as SnapshotRequestPayload;
    expect(payload.sessionId).toBe(sessionId);
    expect(payload.requestId).toBeDefined();
  });

  it("applies FORM_SNAPSHOT when received for the pending request ID", async () => {
    const { result } = await renderHook(() => useStaffSync(sessionId));

    await act(async () => {
      mockChannel.triggerSubscribe("SUBSCRIBED");
    });

    const requestPayload = mockChannel.sentMessages.find(
      (m) => m.event === REALTIME_EVENT.snapshotRequest,
    )?.payload as SnapshotRequestPayload;

    const snapshotPayload: FormSnapshotPayload = {
      sessionId,
      requestId: requestPayload.requestId,
      formData: { firstName: "สมชาย", email: "somchai@example.com" },
      patientStatus: "actively_filling",
      revision: 3,
      sentAt: new Date().toISOString(),
    };

    await act(async () => {
      mockChannel.triggerBroadcast(REALTIME_EVENT.formSnapshot, snapshotPayload);
    });

    expect(result.current.formData.firstName).toBe("สมชาย");
    expect(result.current.formData.email).toBe("somchai@example.com");
    expect(result.current.patientStatus).toBe("actively_filling");
  });

  it("rejects FORM_SNAPSHOT with an unexpected requestId", async () => {
    const { result } = await renderHook(() => useStaffSync(sessionId));

    await act(async () => {
      mockChannel.triggerSubscribe("SUBSCRIBED");
    });

    const snapshotPayload: FormSnapshotPayload = {
      sessionId,
      requestId: "wrong-request-id-999",
      formData: { firstName: "สมชาย" },
      patientStatus: "actively_filling",
      revision: 1,
      sentAt: new Date().toISOString(),
    };

    await act(async () => {
      mockChannel.triggerBroadcast(REALTIME_EVENT.formSnapshot, snapshotPayload);
    });

    expect(result.current.formData.firstName).toBeUndefined();
  });

  it("applies incremental FORM_PATCH and tracks lastChangedField", async () => {
    const { result } = await renderHook(() => useStaffSync(sessionId));

    await act(async () => {
      mockChannel.triggerSubscribe("SUBSCRIBED");
    });

    const patchPayload: FormPatchPayload = {
      sessionId,
      patch: { address: "456 ถนนพหลโยธิน" },
      changedField: "address",
      revision: 1,
      sentAt: new Date().toISOString(),
    };

    await act(async () => {
      mockChannel.triggerBroadcast(REALTIME_EVENT.formPatch, patchPayload);
    });

    expect(result.current.formData.address).toBe("456 ถนนพหลโยธิน");
    expect(result.current.lastChangedField).toBe("address");
  });

  it("ignores events with revisions older than or equal to the latest applied revision", async () => {
    const { result } = await renderHook(() => useStaffSync(sessionId));

    await act(async () => {
      mockChannel.triggerSubscribe("SUBSCRIBED");
    });

    // Receive revision 5
    const patch5: FormPatchPayload = {
      sessionId,
      patch: { firstName: "ใหม่ล่าสุด" },
      changedField: "firstName",
      revision: 5,
      sentAt: new Date().toISOString(),
    };

    await act(async () => {
      mockChannel.triggerBroadcast(REALTIME_EVENT.formPatch, patch5);
    });

    expect(result.current.formData.firstName).toBe("ใหม่ล่าสุด");

    // Equal revision 5 arrives
    const patchEqual: FormPatchPayload = {
      sessionId,
      patch: { firstName: "ค่าซ้ำ" },
      changedField: "firstName",
      revision: 5,
      sentAt: new Date().toISOString(),
    };

    await act(async () => {
      mockChannel.triggerBroadcast(REALTIME_EVENT.formPatch, patchEqual);
    });

    expect(result.current.formData.firstName).toBe("ใหม่ล่าสุด");

    // Stale revision 3 arrives
    const patch3: FormPatchPayload = {
      sessionId,
      patch: { firstName: "เก่ากว่า" },
      changedField: "firstName",
      revision: 3,
      sentAt: new Date().toISOString(),
    };

    await act(async () => {
      mockChannel.triggerBroadcast(REALTIME_EVENT.formPatch, patch3);
    });

    expect(result.current.formData.firstName).toBe("ใหม่ล่าสุด");
  });

  it("applies STATUS_CHANGED lifecycle transitions and lastActivityAt", async () => {
    const { result } = await renderHook(() => useStaffSync(sessionId));

    await act(async () => {
      mockChannel.triggerSubscribe("SUBSCRIBED");
    });

    const statusPayload: StatusChangedPayload = {
      sessionId,
      patientStatus: "inactive",
      lastActivityAt: "2026-08-28T12:05:00.000Z",
      revision: 2,
    };

    await act(async () => {
      mockChannel.triggerBroadcast(REALTIME_EVENT.statusChanged, statusPayload);
    });

    expect(result.current.patientStatus).toBe("inactive");
    expect(result.current.lastActivityAt).toBe("2026-08-28T12:05:00.000Z");
  });

  it("applies FORM_SUBMITTED and locks patientStatus to submitted", async () => {
    const { result } = await renderHook(() => useStaffSync(sessionId));

    await act(async () => {
      mockChannel.triggerSubscribe("SUBSCRIBED");
    });

    const fullData = createValidFullFormData();
    const submitPayload: FormSubmittedPayload = {
      sessionId,
      formData: fullData,
      patientStatus: "submitted",
      submittedAt: "2026-08-28T12:10:00.000Z",
      revision: 10,
    };

    await act(async () => {
      mockChannel.triggerBroadcast(REALTIME_EVENT.formSubmitted, submitPayload);
    });

    expect(result.current.patientStatus).toBe("submitted");
    expect(result.current.submittedAt).toBe("2026-08-28T12:10:00.000Z");
    expect(result.current.formData).toEqual(fullData);

    // Stale status change cannot revert submitted
    const statusPayload: StatusChangedPayload = {
      sessionId,
      patientStatus: "actively_filling",
      lastActivityAt: "2026-08-28T12:11:00.000Z",
      revision: 11,
    };

    await act(async () => {
      mockChannel.triggerBroadcast(REALTIME_EVENT.statusChanged, statusPayload);
    });

    expect(result.current.patientStatus).toBe("submitted");

    // Post-submit patch cannot mutate submitted data
    const patchPayload: FormPatchPayload = {
      sessionId,
      patch: { firstName: "แอบแก้" },
      changedField: "firstName",
      revision: 12,
      sentAt: "2026-08-28T12:12:00.000Z",
    };

    await act(async () => {
      mockChannel.triggerBroadcast(REALTIME_EVENT.formPatch, patchPayload);
    });

    expect(result.current.formData.firstName).toBe("สมชาย");
  });

  it("does NOT downgrade submitted status when receiving a snapshot with non-submitted status", async () => {
    const { result } = await renderHook(() => useStaffSync(sessionId));

    await act(async () => {
      mockChannel.triggerSubscribe("SUBSCRIBED");
    });

    const requestPayload = mockChannel.sentMessages.find(
      (m) => m.event === REALTIME_EVENT.snapshotRequest,
    )?.payload as SnapshotRequestPayload;

    // Submit the form
    const fullData = createValidFullFormData();
    await act(async () => {
      mockChannel.triggerBroadcast(REALTIME_EVENT.formSubmitted, {
        sessionId,
        formData: fullData,
        patientStatus: "submitted",
        submittedAt: new Date().toISOString(),
        revision: 5,
      });
    });

    expect(result.current.patientStatus).toBe("submitted");

    // Snapshot arrives with inactive status (e.g. from delayed response)
    const snapshotPayload: FormSnapshotPayload = {
      sessionId,
      requestId: requestPayload.requestId,
      formData: { firstName: "draft" },
      patientStatus: "inactive",
      revision: 6,
      sentAt: new Date().toISOString(),
    };

    await act(async () => {
      mockChannel.triggerBroadcast(REALTIME_EVENT.formSnapshot, snapshotPayload);
    });

    // Guard: patientStatus must remain "submitted" and data must not be overwritten
    expect(result.current.patientStatus).toBe("submitted");
    expect(result.current.formData).toEqual(fullData);
  });

  it("updates connectionStatus on presence events and sets inactive when patient leaves before submission", async () => {
    const { result } = await renderHook(() => useStaffSync(sessionId));

    await act(async () => {
      mockChannel.triggerSubscribe("SUBSCRIBED");
    });

    await act(async () => {
      mockChannel.triggerPresence("join", {
        patient1: [{ role: "patient", connectedAt: new Date().toISOString() }],
      });
    });

    expect(result.current.connectionStatus).toBe("connected");

    await act(async () => {
      mockChannel.triggerPresence("leave", {});
    });

    expect(result.current.connectionStatus).toBe("disconnected");
    expect(result.current.patientStatus).toBe("inactive");
  });

  it("does NOT overwrite submitted status when patient leaves after submission", async () => {
    const { result } = await renderHook(() => useStaffSync(sessionId));

    await act(async () => {
      mockChannel.triggerSubscribe("SUBSCRIBED");
      mockChannel.triggerPresence("join", {
        patient1: [{ role: "patient", connectedAt: new Date().toISOString() }],
      });
    });

    const fullData = createValidFullFormData();
    await act(async () => {
      mockChannel.triggerBroadcast(REALTIME_EVENT.formSubmitted, {
        sessionId,
        formData: fullData,
        patientStatus: "submitted",
        submittedAt: new Date().toISOString(),
        revision: 5,
      });
    });

    expect(result.current.patientStatus).toBe("submitted");

    await act(async () => {
      mockChannel.triggerPresence("leave", {});
    });

    expect(result.current.connectionStatus).toBe("disconnected");
    expect(result.current.patientStatus).toBe("submitted");
    expect(result.current.formData).toEqual(fullData);
  });

  it("resets state, timestamps, and revision tracking when sessionId changes without remount", async () => {
    const currentSession = sessionId;
    const { result, rerender } = await renderHook(
      (props: { id: string }) => useStaffSync(props.id),
      { initialProps: { id: currentSession } },
    );

    await act(async () => {
      mockChannel.triggerSubscribe("SUBSCRIBED");
    });

    // Populate session 1 state
    const patchPayload: FormPatchPayload = {
      sessionId,
      patch: { firstName: "session1" },
      changedField: "firstName",
      revision: 10,
      sentAt: new Date().toISOString(),
    };

    await act(async () => {
      mockChannel.triggerBroadcast(REALTIME_EVENT.formPatch, patchPayload);
    });

    expect(result.current.formData.firstName).toBe("session1");

    // Switch to session 2
    const session2 = "00000000-0000-4000-8000-000000000002";
    let mockChannel2!: MockRealtimeChannel;
    vi.spyOn(supabaseModule, "getSupabaseBrowserClient").mockImplementation(() => {
      mockChannel2 = mockClient.channel(`patient-session-${session2}`);
      return mockClient as unknown as SupabaseClient;
    });

    await rerender({ id: session2 });

    // Session 2 state must be reset
    expect(result.current.formData).toEqual({});
    expect(result.current.patientStatus).toBe("inactive");
    expect(result.current.lastChangedField).toBeNull();

    await act(async () => {
      mockChannel2.triggerSubscribe("SUBSCRIBED");
    });

    // Session 2 event with revision 1 should be accepted (not blocked by session 1's revision 10)
    const patchS2: FormPatchPayload = {
      sessionId: session2,
      patch: { firstName: "session2" },
      changedField: "firstName",
      revision: 1,
      sentAt: new Date().toISOString(),
    };

    await act(async () => {
      mockChannel2.triggerBroadcast(REALTIME_EVENT.formPatch, patchS2);
    });

    expect(result.current.formData.firstName).toBe("session2");
  });

  it("ignores events from a different session ID", async () => {
    const { result } = await renderHook(() => useStaffSync(sessionId));

    await act(async () => {
      mockChannel.triggerSubscribe("SUBSCRIBED");
    });

    const otherSessionPatch: FormPatchPayload = {
      sessionId: "00000000-0000-4000-8000-000000000099",
      patch: { firstName: "ผู้ใช้อื่น" },
      changedField: "firstName",
      revision: 1,
      sentAt: new Date().toISOString(),
    };

    await act(async () => {
      mockChannel.triggerBroadcast(REALTIME_EVENT.formPatch, otherSessionPatch);
    });

    expect(result.current.formData.firstName).toBeUndefined();
  });

  it("updates correctly when Patient refreshes and sends new patches with newer revisions", async () => {
    const { result } = await renderHook(() => useStaffSync(sessionId));

    await act(async () => {
      mockChannel.triggerSubscribe("SUBSCRIBED");
    });

    // 1. Patient types before refresh
    const initialPatch: FormPatchPayload = {
      sessionId,
      patch: { firstName: "ข้อความเดิม" },
      changedField: "firstName",
      revision: 1787910000000,
      sentAt: new Date().toISOString(),
    };

    await act(async () => {
      mockChannel.triggerBroadcast(REALTIME_EVENT.formPatch, initialPatch);
    });

    expect(result.current.formData.firstName).toBe("ข้อความเดิม");

    // 2. Patient refreshes page (timestamp increases) and types new message
    const postRefreshPatch: FormPatchPayload = {
      sessionId,
      patch: { firstName: "ข้อความใหม่หลังรีเฟรช" },
      changedField: "firstName",
      revision: 1787910005000,
      sentAt: new Date().toISOString(),
    };

    await act(async () => {
      mockChannel.triggerBroadcast(REALTIME_EVENT.formPatch, postRefreshPatch);
    });

    expect(result.current.formData.firstName).toBe("ข้อความใหม่หลังรีเฟรช");
  });
});
