import { act } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { SupabaseClient } from "@supabase/supabase-js";

import { usePatientSync } from "./use-patient-sync";
import {
  REALTIME_EVENT,
  type FormSnapshotPayload,
  type SnapshotRequestPayload,
} from "@/lib/realtime-events";
import * as supabaseModule from "@/lib/supabase";
import { createValidFullFormData } from "@/test-utils/fixtures";
import { MockRealtimeChannel, MockSupabaseClient } from "@/test-utils/mock-realtime";
import { renderHook } from "@/test-utils/render-hook";

describe("usePatientSync hook and protocol behavior", () => {
  const sessionId = "00000000-0000-4000-8000-000000000001";
  let mockClient: MockSupabaseClient;
  let mockChannel: MockRealtimeChannel;

  beforeEach(() => {
    vi.useFakeTimers();
    mockClient = new MockSupabaseClient();
    vi.spyOn(supabaseModule, "hasSupabaseBrowserConfig").mockReturnValue(true);
    vi.spyOn(supabaseModule, "getSupabaseBrowserClient").mockImplementation(() => {
      mockChannel = mockClient.channel(`patient-session-${sessionId}`);
      return mockClient as unknown as SupabaseClient;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("subscribes to the session channel and tracks patient presence", async () => {
    const { result } = await renderHook(() => usePatientSync(sessionId));

    expect(result.current.connectionStatus).toBe("connecting");

    await act(async () => {
      mockChannel.triggerSubscribe("SUBSCRIBED");
    });

    expect(result.current.connectionStatus).toBe("connected");
    expect(mockChannel.trackedPresence).toEqual({
      role: "patient",
      connectedAt: expect.any(String),
    });
  });

  it("handles unconfigured Supabase gracefully with error state", async () => {
    vi.spyOn(supabaseModule, "hasSupabaseBrowserConfig").mockReturnValue(false);
    vi.spyOn(supabaseModule, "getSupabaseBrowserClient").mockReturnValue(null);

    const { result } = await renderHook(() => usePatientSync(sessionId));

    expect(result.current.connectionStatus).toBe("disconnected");
    expect(result.current.syncError).toBe(supabaseModule.REALTIME_CONFIG_ERROR);
  });

  it("broadcasts debounced FORM_PATCH events with incrementing revisions", async () => {
    const { result } = await renderHook(() =>
      usePatientSync(sessionId, { debounceMs: 300 }),
    );

    await act(async () => {
      mockChannel.triggerSubscribe("SUBSCRIBED");
    });

    act(() => {
      result.current.patchField("firstName", "สมชาย");
    });

    expect(result.current.formData.firstName).toBe("สมชาย");
    const patchEventsBefore = mockChannel.sentMessages.filter(
      (m) => m.event === REALTIME_EVENT.formPatch,
    );
    expect(patchEventsBefore.length).toBe(0);

    await act(async () => {
      vi.advanceTimersByTime(300);
    });

    const patchEventsAfter = mockChannel.sentMessages.filter(
      (m) => m.event === REALTIME_EVENT.formPatch,
    );
    expect(patchEventsAfter.length).toBe(1);
    expect(patchEventsAfter[0].payload).toMatchObject({
      sessionId,
      patch: { firstName: "สมชาย" },
      changedField: "firstName",
      revision: 1,
    });

    act(() => {
      result.current.patchField("lastName", "ใจดี");
    });

    await act(async () => {
      vi.advanceTimersByTime(300);
    });

    const patchEventsSecond = mockChannel.sentMessages.filter(
      (m) => m.event === REALTIME_EVENT.formPatch,
    );
    expect(patchEventsSecond.length).toBe(2);
    expect(patchEventsSecond[1].payload).toMatchObject({
      sessionId,
      patch: { lastName: "ใจดี" },
      changedField: "lastName",
      revision: 2,
    });
  });

  it("broadcasts STATUS_CHANGED only on actual lifecycle transitions", async () => {
    const { result } = await renderHook(() => usePatientSync(sessionId));

    await act(async () => {
      mockChannel.triggerSubscribe("SUBSCRIBED");
    });

    act(() => {
      result.current.updatePatientStatus("actively_filling");
    });

    expect(result.current.patientStatus).toBe("actively_filling");

    const statusEvents1 = mockChannel.sentMessages.filter(
      (m) => m.event === REALTIME_EVENT.statusChanged,
    );
    expect(statusEvents1.length).toBe(1);
    expect(statusEvents1[0].payload).toMatchObject({
      sessionId,
      patientStatus: "actively_filling",
      revision: 1,
    });

    act(() => {
      result.current.updatePatientStatus("actively_filling");
    });

    const statusEvents2 = mockChannel.sentMessages.filter(
      (m) => m.event === REALTIME_EVENT.statusChanged,
    );
    expect(statusEvents2.length).toBe(1);

    act(() => {
      result.current.updatePatientStatus("inactive");
    });

    expect(result.current.patientStatus).toBe("inactive");

    const statusEvents3 = mockChannel.sentMessages.filter(
      (m) => m.event === REALTIME_EVENT.statusChanged,
    );
    expect(statusEvents3.length).toBe(2);
    expect(statusEvents3[1].payload).toMatchObject({
      sessionId,
      patientStatus: "inactive",
      revision: 2,
    });
  });

  it("responds to SNAPSHOT_REQUEST with current form data and status in FORM_SNAPSHOT", async () => {
    const { result } = await renderHook(() => usePatientSync(sessionId));

    await act(async () => {
      mockChannel.triggerSubscribe("SUBSCRIBED");
    });

    act(() => {
      result.current.patchField("firstName", "สมชาย");
      result.current.updatePatientStatus("actively_filling");
    });

    const request: SnapshotRequestPayload = {
      sessionId,
      requestId: "req-staff-001",
      requestedAt: new Date().toISOString(),
    };

    await act(async () => {
      mockChannel.triggerBroadcast(REALTIME_EVENT.snapshotRequest, request);
    });

    const snapshotMessages = mockChannel.sentMessages.filter(
      (m) => m.event === REALTIME_EVENT.formSnapshot,
    );
    expect(snapshotMessages.length).toBe(1);
    const snapshotPayload = snapshotMessages[0].payload as FormSnapshotPayload;
    expect(snapshotPayload).toMatchObject({
      sessionId,
      requestId: "req-staff-001",
      formData: { firstName: "สมชาย" },
      patientStatus: "actively_filling",
      revision: expect.any(Number),
    });
  });

  it("ignores SNAPSHOT_REQUEST for a different session", async () => {
    await renderHook(() => usePatientSync(sessionId));

    await act(async () => {
      mockChannel.triggerSubscribe("SUBSCRIBED");
    });

    const differentSessionRequest: SnapshotRequestPayload = {
      sessionId: "00000000-0000-4000-8000-000000000099",
      requestId: "req-other-001",
      requestedAt: new Date().toISOString(),
    };

    await act(async () => {
      mockChannel.triggerBroadcast(
        REALTIME_EVENT.snapshotRequest,
        differentSessionRequest,
      );
    });

    const snapshotMessages = mockChannel.sentMessages.filter(
      (m) => m.event === REALTIME_EVENT.formSnapshot,
    );
    expect(snapshotMessages.length).toBe(0);
  });

  it("cancels pending debounce work and broadcasts FORM_SUBMITTED on submit", async () => {
    const { result } = await renderHook(() =>
      usePatientSync(sessionId, { debounceMs: 300 }),
    );

    await act(async () => {
      mockChannel.triggerSubscribe("SUBSCRIBED");
    });

    const fullData = createValidFullFormData();

    act(() => {
      result.current.patchField("firstName", "กานต์");
    });

    await act(async () => {
      await result.current.submitForm(fullData);
    });

    expect(result.current.patientStatus).toBe("submitted");

    await act(async () => {
      vi.advanceTimersByTime(500);
    });

    const patchEvents = mockChannel.sentMessages.filter(
      (m) => m.event === REALTIME_EVENT.formPatch,
    );
    expect(patchEvents.length).toBe(0);

    const submitEvents = mockChannel.sentMessages.filter(
      (m) => m.event === REALTIME_EVENT.formSubmitted,
    );
    expect(submitEvents.length).toBe(1);
    expect(submitEvents[0].payload).toMatchObject({
      sessionId,
      formData: fullData,
      patientStatus: "submitted",
      revision: expect.any(Number),
    });

    act(() => {
      result.current.updatePatientStatus("inactive");
    });

    expect(result.current.patientStatus).toBe("submitted");
  });

  it("locks final submitted state against post-submit patch mutations", async () => {
    const { result } = await renderHook(() => usePatientSync(sessionId));

    await act(async () => {
      mockChannel.triggerSubscribe("SUBSCRIBED");
    });

    const fullData = createValidFullFormData();
    await act(async () => {
      await result.current.submitForm(fullData);
    });

    // Attempt to patch after submit
    act(() => {
      result.current.patchField("firstName", "แอบแก้");
    });

    // Form data must remain unchanged
    expect(result.current.formData.firstName).toBe("สมชาย");

    // Snapshot request after submit must respond with submitted data and status
    const request: SnapshotRequestPayload = {
      sessionId,
      requestId: "req-post-submit",
      requestedAt: new Date().toISOString(),
    };

    await act(async () => {
      mockChannel.triggerBroadcast(REALTIME_EVENT.snapshotRequest, request);
    });

    const snapshots = mockChannel.sentMessages.filter(
      (m) => m.event === REALTIME_EVENT.formSnapshot,
    );
    const latestSnapshot = snapshots[snapshots.length - 1]
      .payload as FormSnapshotPayload;
    expect(latestSnapshot.formData.firstName).toBe("สมชาย");
    expect(latestSnapshot.patientStatus).toBe("submitted");
  });

  it("resets state, timers, and refs cleanly when sessionId changes without remount", async () => {
    const currentSession = sessionId;
    const { result, rerender } = await renderHook(
      (props: { id: string }) => usePatientSync(props.id),
      { initialProps: { id: currentSession } },
    );

    await act(async () => {
      mockChannel.triggerSubscribe("SUBSCRIBED");
    });

    act(() => {
      result.current.patchField("firstName", "session1 data");
      result.current.updatePatientStatus("actively_filling");
    });

    expect(result.current.formData.firstName).toBe("session1 data");
    expect(result.current.patientStatus).toBe("actively_filling");

    // Switch to session 2
    const session2 = "00000000-0000-4000-8000-000000000002";
    let mockChannel2!: MockRealtimeChannel;
    vi.spyOn(supabaseModule, "getSupabaseBrowserClient").mockImplementation(() => {
      mockChannel2 = mockClient.channel(`patient-session-${session2}`);
      return mockClient as unknown as SupabaseClient;
    });

    await rerender({ id: session2 });

    expect(result.current.formData).toEqual({});
    expect(result.current.patientStatus).toBe("inactive");

    await act(async () => {
      mockChannel2.triggerSubscribe("SUBSCRIBED");
    });

    // Verify debounce timer from session 1 did NOT broadcast to session 2
    await act(async () => {
      vi.advanceTimersByTime(500);
    });

    const s2Patches = mockChannel2.sentMessages.filter(
      (m) => m.event === REALTIME_EVENT.formPatch,
    );
    expect(s2Patches.length).toBe(0);
  });

  it("maintains stable channel connection and presence when options change on rerenders", async () => {
    const { result, rerender } = await renderHook(
      () => {
        // Simulates passing a fresh inline object on every render
        return usePatientSync(sessionId, { initialFormData: { firstName: "" } });
      },
    );

    await act(async () => {
      mockChannel.triggerSubscribe("SUBSCRIBED");
    });

    expect(result.current.connectionStatus).toBe("connected");
    expect(mockChannel.isUntracked).toBe(false);

    // Type field and trigger rerenders
    act(() => {
      result.current.patchField("firstName", "สมชาย");
    });

    await rerender();

    // The channel MUST NOT be untracked or removed on rerender
    expect(mockChannel.isUntracked).toBe(false);
    expect(mockClient.removedChannels.length).toBe(0);
    expect(result.current.connectionStatus).toBe("connected");
  });

  it("cleans up channel and untracks presence on unmount", async () => {
    const { unmount } = await renderHook(() => usePatientSync(sessionId));

    await act(async () => {
      mockChannel.triggerSubscribe("SUBSCRIBED");
    });

    await unmount();

    expect(mockChannel.isUntracked).toBe(true);
    expect(mockClient.removedChannels).toContain(mockChannel);
  });
});
