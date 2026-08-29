import { describe, expect, it } from "vitest";

import {
  getFieldFocusedPayload,
  getFormPatchPayload,
  getFormSnapshotPayload,
  getFormSubmittedPayload,
  getSnapshotRequestPayload,
  getStatusChangedPayload,
  REALTIME_EVENT,
  type FieldFocusedPayload,
  type FormPatchPayload,
  type FormSnapshotPayload,
  type FormSubmittedPayload,
  type SnapshotRequestPayload,
  type StatusChangedPayload,
} from "./realtime-events";
import { createValidFullFormData } from "@/test-utils/fixtures";

describe("realtime-events contracts and parsers", () => {
  describe("REALTIME_EVENT constants", () => {
    it("defines the expected event names matching the architecture spec", () => {
      expect(REALTIME_EVENT).toEqual({
        fieldFocused: "FIELD_FOCUSED",
        formPatch: "FORM_PATCH",
        snapshotRequest: "SNAPSHOT_REQUEST",
        formSnapshot: "FORM_SNAPSHOT",
        statusChanged: "STATUS_CHANGED",
        formSubmitted: "FORM_SUBMITTED",
      });
    });
  });

  describe("getFieldFocusedPayload", () => {
    it("accepts a field focus lifecycle event", () => {
      const payload: FieldFocusedPayload = {
        sessionId: "00000000-0000-4000-8000-000000000001",
        focusedField: "emergencyContact.relationship",
        patientStatus: "actively_filling",
        lastActivityAt: "2026-08-29T08:00:00.000Z",
        revision: 4,
      };

      expect(getFieldFocusedPayload({ payload })).toEqual(payload);
    });

    it("rejects unknown fields and non-active lifecycle states", () => {
      const basePayload = {
        sessionId: "00000000-0000-4000-8000-000000000001",
        focusedField: "unknownField",
        patientStatus: "actively_filling",
        lastActivityAt: "2026-08-29T08:00:00.000Z",
        revision: 4,
      };

      expect(getFieldFocusedPayload({ payload: basePayload })).toBeNull();
      expect(
        getFieldFocusedPayload({
          payload: {
            ...basePayload,
            focusedField: "firstName",
            patientStatus: "inactive",
          },
        }),
      ).toBeNull();
    });
  });

  describe("getFormPatchPayload", () => {
    it("accepts a valid patch for firstName", () => {
      const payload: FormPatchPayload = {
        sessionId: "00000000-0000-4000-8000-000000000001",
        patch: { firstName: "กานต์" },
        changedField: "firstName",
        focusedField: "lastName",
        patientStatus: "actively_filling",
        revision: 1,
        sentAt: "2026-08-28T12:00:00.000Z",
      };

      expect(getFormPatchPayload({ payload })).toEqual(payload);
    });

    it("accepts a valid patch for any patient form field", () => {
      const payload: FormPatchPayload = {
        sessionId: "00000000-0000-4000-8000-000000000001",
        patch: { email: "somchai@example.com" },
        changedField: "email",
        revision: 5,
        sentAt: "2026-08-28T12:00:00.000Z",
      };

      expect(getFormPatchPayload({ payload })).toEqual(payload);
    });

    it("accepts a valid nested emergencyContact patch", () => {
      const payload: FormPatchPayload = {
        sessionId: "00000000-0000-4000-8000-000000000001",
        patch: {
          emergencyContact: {
            name: "สมหญิง ใจดี",
            relationship: "spouse",
          },
        },
        changedField: "emergencyContact",
        revision: 2,
        sentAt: "2026-08-28T12:00:00.000Z",
      };

      expect(getFormPatchPayload({ payload })).toEqual(payload);
    });

    it("rejects when changedField is missing from patch object", () => {
      const payload = {
        sessionId: "00000000-0000-4000-8000-000000000001",
        patch: { email: "test@example.com" },
        changedField: "firstName",
        revision: 1,
        sentAt: "2026-08-28T12:00:00.000Z",
      };

      expect(getFormPatchPayload({ payload })).toBeNull();
    });

    it("rejects invalid field value types in patch", () => {
      const payload = {
        sessionId: "00000000-0000-4000-8000-000000000001",
        patch: { firstName: 12345 },
        changedField: "firstName",
        revision: 1,
        sentAt: "2026-08-28T12:00:00.000Z",
      };

      expect(getFormPatchPayload({ payload })).toBeNull();
    });

    it("rejects invalid gender in patch", () => {
      const payload = {
        sessionId: "00000000-0000-4000-8000-000000000001",
        patch: { gender: "alien" },
        changedField: "gender",
        revision: 1,
        sentAt: "2026-08-28T12:00:00.000Z",
      };

      expect(getFormPatchPayload({ payload })).toBeNull();
    });

    it("rejects invalid emergencyContact structure in patch", () => {
      const payload = {
        sessionId: "00000000-0000-4000-8000-000000000001",
        patch: { emergencyContact: { name: 123, invalidKey: true } },
        changedField: "emergencyContact",
        revision: 1,
        sentAt: "2026-08-28T12:00:00.000Z",
      };

      expect(getFormPatchPayload({ payload })).toBeNull();
    });

    it("rejects an invalid changedField", () => {
      const payload = {
        sessionId: "00000000-0000-4000-8000-000000000001",
        patch: { unknownField: "test" },
        changedField: "unknownField",
        revision: 1,
        sentAt: "2026-08-28T12:00:00.000Z",
      };

      expect(getFormPatchPayload({ payload })).toBeNull();
    });

    it("rejects submitted lifecycle metadata on a draft patch", () => {
      expect(
        getFormPatchPayload({
          payload: {
            sessionId: "00000000-0000-4000-8000-000000000001",
            patch: { firstName: "กานต์" },
            changedField: "firstName",
            focusedField: "firstName",
            patientStatus: "submitted",
            revision: 1,
            sentAt: "2026-08-28T12:00:00.000Z",
          },
        }),
      ).toBeNull();
    });

    it("rejects unknown keys in patch object", () => {
      const payload = {
        sessionId: "00000000-0000-4000-8000-000000000001",
        patch: { firstName: "กานต์", hackerField: "injected" },
        changedField: "firstName",
        revision: 1,
        sentAt: "2026-08-28T12:00:00.000Z",
      };

      expect(getFormPatchPayload({ payload })).toBeNull();
    });

    it("rejects invalid revision numbers (negative, float, non-number)", () => {
      const base = {
        sessionId: "00000000-0000-4000-8000-000000000001",
        patch: { firstName: "กานต์" },
        changedField: "firstName",
        sentAt: "2026-08-28T12:00:00.000Z",
      };

      expect(getFormPatchPayload({ payload: { ...base, revision: -1 } })).toBeNull();
      expect(getFormPatchPayload({ payload: { ...base, revision: 1.5 } })).toBeNull();
      expect(getFormPatchPayload({ payload: { ...base, revision: "1" } })).toBeNull();
    });

    it("rejects non-object envelopes or missing session IDs", () => {
      expect(getFormPatchPayload({})).toBeNull();
      expect(getFormPatchPayload({ payload: null })).toBeNull();
      expect(getFormPatchPayload({ payload: "string" })).toBeNull();
      expect(
        getFormPatchPayload({
          payload: {
            sessionId: "",
            patch: { firstName: "กานต์" },
            changedField: "firstName",
            revision: 1,
            sentAt: "2026-08-28T12:00:00.000Z",
          },
        }),
      ).toBeNull();
    });
  });

  describe("getSnapshotRequestPayload", () => {
    it("accepts a valid snapshot request", () => {
      const payload: SnapshotRequestPayload = {
        sessionId: "00000000-0000-4000-8000-000000000001",
        requestId: "req-123",
        requestedAt: "2026-08-28T12:00:00.000Z",
      };

      expect(getSnapshotRequestPayload({ payload })).toEqual(payload);
    });

    it("rejects an invalid snapshot request payload", () => {
      expect(getSnapshotRequestPayload({ payload: { sessionId: "s1" } })).toBeNull();
      expect(getSnapshotRequestPayload({ payload: null })).toBeNull();
      expect(
        getSnapshotRequestPayload({
          payload: {
            sessionId: "s1",
            requestId: "",
            requestedAt: "2026-08-28T12:00:00.000Z",
          },
        }),
      ).toBeNull();
    });
  });

  describe("getFormSnapshotPayload", () => {
    it("accepts a valid form snapshot with complete data and status", () => {
      const payload: FormSnapshotPayload = {
        sessionId: "00000000-0000-4000-8000-000000000001",
        requestId: "req-123",
        formData: createValidFullFormData(),
        patientStatus: "actively_filling",
        revision: 4,
        sentAt: "2026-08-28T12:00:00.000Z",
      };

      expect(getFormSnapshotPayload({ payload })).toEqual(payload);
    });

    it("accepts a valid form snapshot with partial data", () => {
      const payload: FormSnapshotPayload = {
        sessionId: "00000000-0000-4000-8000-000000000001",
        requestId: "req-123",
        formData: { firstName: "สมชาย", email: "test@example.com" },
        patientStatus: "inactive",
        revision: 2,
        sentAt: "2026-08-28T12:00:00.000Z",
      };

      expect(getFormSnapshotPayload({ payload })).toEqual(payload);
    });

    it("rejects unknown field keys in formData", () => {
      const payload = {
        sessionId: "00000000-0000-4000-8000-000000000001",
        requestId: "req-123",
        formData: { firstName: "สมชาย", unknownProp: 123 },
        patientStatus: "inactive",
        revision: 2,
        sentAt: "2026-08-28T12:00:00.000Z",
      };

      expect(getFormSnapshotPayload({ payload })).toBeNull();
    });

    it("rejects invalid field types in formData", () => {
      const payload = {
        sessionId: "00000000-0000-4000-8000-000000000001",
        requestId: "req-123",
        formData: { firstName: 12345 },
        patientStatus: "inactive",
        revision: 2,
        sentAt: "2026-08-28T12:00:00.000Z",
      };

      expect(getFormSnapshotPayload({ payload })).toBeNull();
    });

    it("rejects an unknown patientStatus", () => {
      const payload = {
        sessionId: "00000000-0000-4000-8000-000000000001",
        requestId: "req-123",
        formData: {},
        patientStatus: "unknown_status",
        revision: 1,
        sentAt: "2026-08-28T12:00:00.000Z",
      };

      expect(getFormSnapshotPayload({ payload })).toBeNull();
    });
  });

  describe("getStatusChangedPayload", () => {
    it("accepts valid status change payloads", () => {
      const statuses = ["actively_filling", "inactive", "submitted"] as const;

      for (const patientStatus of statuses) {
        const payload: StatusChangedPayload = {
          sessionId: "00000000-0000-4000-8000-000000000001",
          patientStatus,
          lastActivityAt: "2026-08-28T12:00:00.000Z",
          revision: 3,
        };

        expect(getStatusChangedPayload({ payload })).toEqual(payload);
      }
    });

    it("rejects invalid status change payloads", () => {
      expect(
        getStatusChangedPayload({
          payload: {
            sessionId: "s1",
            patientStatus: "online",
            lastActivityAt: "2026-08-28T12:00:00.000Z",
            revision: 1,
          },
        }),
      ).toBeNull();
    });
  });

  describe("getFormSubmittedPayload", () => {
    it("accepts a valid form submitted payload with full form data", () => {
      const payload: FormSubmittedPayload = {
        sessionId: "00000000-0000-4000-8000-000000000001",
        formData: createValidFullFormData(),
        patientStatus: "submitted",
        submittedAt: "2026-08-28T12:00:00.000Z",
        revision: 10,
      };

      expect(getFormSubmittedPayload({ payload })).toEqual(payload);
    });

    it("rejects form submitted payload when formData is empty or missing required fields", () => {
      const payload = {
        sessionId: "00000000-0000-4000-8000-000000000001",
        formData: {},
        patientStatus: "submitted",
        submittedAt: "2026-08-28T12:00:00.000Z",
        revision: 10,
      };

      expect(getFormSubmittedPayload({ payload })).toBeNull();
    });

    it("rejects form submitted payload when patientStatus is not submitted", () => {
      const payload = {
        sessionId: "00000000-0000-4000-8000-000000000001",
        formData: createValidFullFormData(),
        patientStatus: "actively_filling",
        submittedAt: "2026-08-28T12:00:00.000Z",
        revision: 10,
      };

      expect(getFormSubmittedPayload({ payload })).toBeNull();
    });
  });
});
