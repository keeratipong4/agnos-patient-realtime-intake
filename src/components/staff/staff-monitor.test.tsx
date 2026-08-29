// @vitest-environment jsdom

import { act } from "react";
import {
  cleanup,
  render,
  screen,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { SupabaseClient } from "@supabase/supabase-js";

import {
  REALTIME_EVENT,
  type FormSnapshotPayload,
  type SnapshotRequestPayload,
} from "@/lib/realtime-events";
import * as supabaseModule from "@/lib/supabase";
import { createValidFullFormData } from "@/test-utils/fixtures";
import {
  MockRealtimeChannel,
  MockSupabaseClient,
} from "@/test-utils/mock-realtime";

import { StaffMonitor } from "./staff-monitor";

const sessionId = "00000000-0000-4000-8000-000000000001";

function getField(field: string) {
  const element = document.querySelector(`[data-field="${field}"]`);

  if (!(element instanceof HTMLElement)) {
    throw new Error(`Staff field ${field} was not rendered.`);
  }

  return element;
}

describe("StaffMonitor", () => {
  let mockClient: MockSupabaseClient;
  let mockChannel: MockRealtimeChannel;

  beforeEach(() => {
    mockClient = new MockSupabaseClient();
    vi.spyOn(supabaseModule, "hasSupabaseBrowserConfig").mockReturnValue(true);
    vi.spyOn(supabaseModule, "getSupabaseBrowserClient").mockImplementation(
      () => {
        mockChannel = mockClient.channel(`patient-session-${sessionId}`);
        return mockClient as unknown as SupabaseClient;
      },
    );
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  async function subscribe() {
    await act(async () => {
      mockChannel.triggerSubscribe("SUBSCRIBED");
    });
  }

  async function connectPatient() {
    await act(async () => {
      mockChannel.triggerPresence("join", {
        patient: [
          {
            role: "patient",
            connectedAt: "2026-08-29T08:00:00.000Z",
          },
        ],
      });
    });
  }

  function getSnapshotRequest() {
    return mockChannel.sentMessages.find(
      (message) => message.event === REALTIME_EVENT.snapshotRequest,
    )?.payload as SnapshotRequestPayload;
  }

  it("renders every Patient field in matching sections with explicit waiting values", () => {
    render(<StaffMonitor sessionId={sessionId} />);

    expect(
      screen.getByRole("heading", { name: "Personal identification" }),
    ).toBeDefined();
    expect(
      screen.getByRole("heading", { name: "Contact information" }),
    ).toBeDefined();
    expect(
      screen.getByRole("heading", { name: "Emergency contact" }),
    ).toBeDefined();

    [
      "firstName",
      "middleName",
      "lastName",
      "dateOfBirth",
      "gender",
      "nationality",
      "preferredLanguage",
      "religion",
      "phoneNumber",
      "email",
      "address",
      "emergencyContact.name",
      "emergencyContact.relationship",
    ].forEach((field) => {
      expect(getField(field)).toBeDefined();
    });

    expect(screen.getAllByText("Waiting for input")).toHaveLength(13);
    expect(screen.getByText("Connecting")).toBeDefined();
    expect(screen.getByText("Connecting to live session")).toBeDefined();
  });

  it("renders a recovered full snapshot with human-readable option values", async () => {
    render(<StaffMonitor sessionId={sessionId} />);
    await subscribe();

    const fullData = createValidFullFormData();
    const request = getSnapshotRequest();
    const snapshot: FormSnapshotPayload = {
      sessionId,
      requestId: request.requestId,
      formData: fullData,
      patientStatus: "actively_filling",
      revision: 5,
      sentAt: "2026-08-29T08:01:00.000Z",
    };

    await act(async () => {
      mockChannel.triggerBroadcast(REALTIME_EVENT.formSnapshot, snapshot);
    });

    expect(within(getField("firstName")).getByText("สมชาย")).toBeDefined();
    expect(
      within(getField("dateOfBirth")).getByText("20 May 1990"),
    ).toBeDefined();
    expect(within(getField("gender")).getByText("Male")).toBeDefined();
    expect(
      within(getField("preferredLanguage")).getByText("Thai"),
    ).toBeDefined();
    expect(
      within(getField("emergencyContact.relationship")).getByText(
        "Spouse / partner",
      ),
    ).toBeDefined();
    expect(screen.queryByText("Waiting for input")).toBeNull();
    expect(screen.getByText("Actively filling")).toBeDefined();
  });

  it("applies patches, records their activity time, and marks only the latest field with text and outline", async () => {
    render(<StaffMonitor sessionId={sessionId} />);
    await subscribe();

    await act(async () => {
      mockChannel.triggerBroadcast(REALTIME_EVENT.formPatch, {
        sessionId,
        patch: { firstName: "Suda" },
        changedField: "firstName",
        revision: 1,
        sentAt: "2026-08-29T08:02:00.000Z",
      });
    });

    expect(within(getField("firstName")).getByText("Suda")).toBeDefined();
    expect(
      within(getField("firstName")).getByText("Latest update"),
    ).toBeDefined();
    expect(getField("firstName").dataset.recentField).toBe("true");
    expect(
      document.querySelector('time[datetime="2026-08-29T08:02:00.000Z"]'),
    ).not.toBeNull();

    await act(async () => {
      mockChannel.triggerBroadcast(REALTIME_EVENT.formPatch, {
        sessionId,
        patch: { lastName: "Jaidee" },
        changedField: "lastName",
        revision: 2,
        sentAt: "2026-08-29T08:03:00.000Z",
      });
    });

    expect(
      within(getField("firstName")).queryByText("Latest update"),
    ).toBeNull();
    expect(
      within(getField("lastName")).getByText("Latest update"),
    ).toBeDefined();
    expect(getField("lastName").dataset.recentField).toBe("true");
  });

  it("moves the animated highlight on focus alone and keeps a static highlight when inactive or disconnected", async () => {
    render(<StaffMonitor sessionId={sessionId} />);
    await subscribe();
    await connectPatient();

    await act(async () => {
      mockChannel.triggerBroadcast(REALTIME_EVENT.fieldFocused, {
        sessionId,
        focusedField: "firstName",
        patientStatus: "actively_filling",
        lastActivityAt: "2026-08-29T08:03:10.000Z",
        revision: 1,
      });
    });

    expect(getField("firstName").dataset.highlightMode).toBe("active");
    expect(getField("firstName").className).toContain("active-field-pulse");
    expect(
      within(getField("firstName")).getByText("Patient working here"),
    ).toBeDefined();

    await act(async () => {
      mockChannel.triggerBroadcast(REALTIME_EVENT.fieldFocused, {
        sessionId,
        focusedField: "lastName",
        patientStatus: "actively_filling",
        lastActivityAt: "2026-08-29T08:03:20.000Z",
        revision: 2,
      });
    });

    expect(getField("firstName").dataset.highlightMode).toBe("none");
    expect(getField("lastName").dataset.highlightMode).toBe("active");

    await act(async () => {
      mockChannel.triggerBroadcast(REALTIME_EVENT.statusChanged, {
        sessionId,
        patientStatus: "inactive",
        lastActivityAt: "2026-08-29T08:03:30.000Z",
        revision: 3,
      });
    });

    expect(getField("lastName").dataset.highlightMode).toBe("static");
    expect(getField("lastName").className).not.toContain(
      "active-field-pulse",
    );
    expect(
      within(getField("lastName")).getByText("Last active field"),
    ).toBeDefined();

    await act(async () => {
      mockChannel.triggerPresence("leave", {});
    });

    expect(getField("lastName").dataset.highlightMode).toBe("static");
    expect(getField("lastName").className).not.toContain(
      "active-field-pulse",
    );
  });

  it("shows connection and lifecycle changes independently with last activity", async () => {
    render(<StaffMonitor sessionId={sessionId} />);
    await subscribe();
    await connectPatient();

    expect(screen.getByText("Connected")).toBeDefined();
    expect(screen.getByText("Inactive")).toBeDefined();

    await act(async () => {
      mockChannel.triggerBroadcast(REALTIME_EVENT.statusChanged, {
        sessionId,
        patientStatus: "actively_filling",
        lastActivityAt: "2026-08-29T08:04:00.000Z",
        revision: 1,
      });
    });

    expect(screen.getByText("Connected")).toBeDefined();
    expect(screen.getByText("Actively filling")).toBeDefined();
    expect(
      screen.getByText("Patient actively filling form"),
    ).toBeDefined();
    expect(
      document.querySelector('time[datetime="2026-08-29T08:04:00.000Z"]'),
    ).not.toBeNull();

    await act(async () => {
      mockChannel.triggerBroadcast(REALTIME_EVENT.statusChanged, {
        sessionId,
        patientStatus: "inactive",
        lastActivityAt: "2026-08-29T08:05:00.000Z",
        revision: 2,
      });
    });

    expect(screen.getByText("Connected")).toBeDefined();
    expect(screen.getByText("Inactive")).toBeDefined();
    expect(screen.getByText("Patient inactive")).toBeDefined();
  });

  it("recovers a late-joining partial snapshot without marking a field as a new patch", async () => {
    render(<StaffMonitor sessionId={sessionId} />);
    await subscribe();

    const request = getSnapshotRequest();
    await act(async () => {
      mockChannel.triggerBroadcast(REALTIME_EVENT.formSnapshot, {
        sessionId,
        requestId: request.requestId,
        formData: {
          firstName: "Anong",
          email: "anong@example.com",
        },
        patientStatus: "inactive",
        revision: 8,
        sentAt: "2026-08-29T08:06:00.000Z",
      });
    });

    expect(within(getField("firstName")).getByText("Anong")).toBeDefined();
    expect(
      within(getField("email")).getByText("anong@example.com"),
    ).toBeDefined();
    expect(
      within(getField("lastName")).getByText("Waiting for input"),
    ).toBeDefined();
    expect(screen.queryByText("Latest update")).toBeNull();
  });

  it("preserves the last draft values and changes lifecycle to inactive on disconnect", async () => {
    render(<StaffMonitor sessionId={sessionId} />);
    await subscribe();
    await connectPatient();

    await act(async () => {
      mockChannel.triggerBroadcast(REALTIME_EVENT.formPatch, {
        sessionId,
        patch: { address: "88 Demo Road, Bangkok" },
        changedField: "address",
        revision: 1,
        sentAt: "2026-08-29T08:07:00.000Z",
      });
      mockChannel.triggerBroadcast(REALTIME_EVENT.statusChanged, {
        sessionId,
        patientStatus: "actively_filling",
        lastActivityAt: "2026-08-29T08:07:00.000Z",
        revision: 2,
      });
    });

    await act(async () => {
      mockChannel.triggerPresence("leave", {});
    });

    expect(screen.getByText("Disconnected")).toBeDefined();
    expect(screen.getByText("Inactive")).toBeDefined();
    expect(screen.getByText("Patient disconnected")).toBeDefined();
    expect(
      within(getField("address")).getByText("88 Demo Road, Bangkok"),
    ).toBeDefined();
  });

  it("locks a submitted summary against disconnects and later draft events", async () => {
    render(<StaffMonitor sessionId={sessionId} />);
    await subscribe();
    await connectPatient();

    const request = getSnapshotRequest();
    const fullData = createValidFullFormData();

    await act(async () => {
      mockChannel.triggerBroadcast(REALTIME_EVENT.formSubmitted, {
        sessionId,
        formData: fullData,
        patientStatus: "submitted",
        submittedAt: "2026-08-29T08:08:00.000Z",
        revision: 10,
      });
    });

    expect(screen.getByText("Submitted")).toBeDefined();
    expect(screen.getByText("Submission received")).toBeDefined();
    expect(screen.getByLabelText("Submitted patient summary")).toBeDefined();
    expect(
      document.querySelector('time[datetime="2026-08-29T08:08:00.000Z"]'),
    ).not.toBeNull();

    await act(async () => {
      mockChannel.triggerPresence("leave", {});
      mockChannel.triggerBroadcast(REALTIME_EVENT.statusChanged, {
        sessionId,
        patientStatus: "actively_filling",
        lastActivityAt: "2026-08-29T08:09:00.000Z",
        revision: 11,
      });
      mockChannel.triggerBroadcast(REALTIME_EVENT.formPatch, {
        sessionId,
        patch: { firstName: "Overwritten draft" },
        changedField: "firstName",
        revision: 12,
        sentAt: "2026-08-29T08:10:00.000Z",
      });
      mockChannel.triggerBroadcast(REALTIME_EVENT.formSnapshot, {
        sessionId,
        requestId: request.requestId,
        formData: { firstName: "Stale snapshot" },
        patientStatus: "inactive",
        revision: 13,
        sentAt: "2026-08-29T08:11:00.000Z",
      });
      mockChannel.triggerBroadcast(REALTIME_EVENT.fieldFocused, {
        sessionId,
        focusedField: "email",
        patientStatus: "actively_filling",
        lastActivityAt: "2026-08-29T08:12:00.000Z",
        revision: 14,
      });
    });

    expect(screen.getByText("Disconnected")).toBeDefined();
    expect(screen.getByText("Submitted")).toBeDefined();
    expect(within(getField("firstName")).getByText("สมชาย")).toBeDefined();
    expect(screen.queryByText("Overwritten draft")).toBeNull();
    expect(screen.queryByText("Stale snapshot")).toBeNull();
    expect(screen.queryByText("Latest update")).toBeNull();
    expect(screen.queryByText("Patient working here")).toBeNull();
    expect(getField("email").dataset.highlightMode).toBe("none");
  });
});
