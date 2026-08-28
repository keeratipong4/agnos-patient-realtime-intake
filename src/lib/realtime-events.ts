import type {
  PatientFormData,
  PatientStatus,
} from "@/types";

export const REALTIME_EVENT = {
  formPatch: "FORM_PATCH",
  snapshotRequest: "SNAPSHOT_REQUEST",
  formSnapshot: "FORM_SNAPSHOT",
  statusChanged: "STATUS_CHANGED",
  formSubmitted: "FORM_SUBMITTED",
} as const;

export type FormPatchPayload = {
  sessionId: string;
  patch: Partial<PatientFormData>;
  changedField: keyof PatientFormData;
  revision: number;
  sentAt: string;
};

export type SnapshotRequestPayload = {
  sessionId: string;
  requestId: string;
  requestedAt: string;
};

export type FormSnapshotPayload = {
  sessionId: string;
  requestId: string;
  formData: Partial<PatientFormData>;
  patientStatus: PatientStatus;
  revision: number;
  sentAt: string;
};

export type StatusChangedPayload = {
  sessionId: string;
  patientStatus: PatientStatus;
  lastActivityAt: string;
  revision: number;
};

export type FormSubmittedPayload = {
  sessionId: string;
  formData: PatientFormData;
  patientStatus: "submitted";
  submittedAt: string;
  revision: number;
};

export type RealtimeEventPayloadMap = {
  [REALTIME_EVENT.formPatch]: FormPatchPayload;
  [REALTIME_EVENT.snapshotRequest]: SnapshotRequestPayload;
  [REALTIME_EVENT.formSnapshot]: FormSnapshotPayload;
  [REALTIME_EVENT.statusChanged]: StatusChangedPayload;
  [REALTIME_EVENT.formSubmitted]: FormSubmittedPayload;
};

export type RealtimeEventName = keyof RealtimeEventPayloadMap;

export type BroadcastEnvelope = {
  payload?: unknown;
};

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function getFormPatchPayload(
  message: BroadcastEnvelope,
): FormPatchPayload | null {
  const payload = message.payload;

  if (
    !isObject(payload) ||
    typeof payload.sessionId !== "string" ||
    !isObject(payload.patch) ||
    (payload.patch.firstName !== undefined &&
      typeof payload.patch.firstName !== "string") ||
    payload.changedField !== "firstName" ||
    typeof payload.revision !== "number" ||
    !Number.isSafeInteger(payload.revision) ||
    payload.revision < 0 ||
    typeof payload.sentAt !== "string"
  ) {
    return null;
  }

  return payload as FormPatchPayload;
}

export function getSnapshotRequestPayload(
  message: BroadcastEnvelope,
): SnapshotRequestPayload | null {
  const payload = message.payload;

  if (
    !isObject(payload) ||
    typeof payload.sessionId !== "string" ||
    typeof payload.requestId !== "string" ||
    typeof payload.requestedAt !== "string"
  ) {
    return null;
  }

  return payload as SnapshotRequestPayload;
}

export function getFormSnapshotPayload(
  message: BroadcastEnvelope,
): FormSnapshotPayload | null {
  const payload = message.payload;

  if (
    !isObject(payload) ||
    typeof payload.sessionId !== "string" ||
    typeof payload.requestId !== "string" ||
    !isObject(payload.formData) ||
    (payload.formData.firstName !== undefined &&
      typeof payload.formData.firstName !== "string") ||
    !["actively_filling", "inactive", "submitted"].includes(
      String(payload.patientStatus),
    ) ||
    typeof payload.revision !== "number" ||
    !Number.isSafeInteger(payload.revision) ||
    payload.revision < 0 ||
    typeof payload.sentAt !== "string"
  ) {
    return null;
  }

  return payload as FormSnapshotPayload;
}
