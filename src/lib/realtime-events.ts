import type {
  EmergencyContact,
  Gender,
  PatientFormData,
  PatientFormFieldPath,
  PatientStatus,
} from "@/types";

export const REALTIME_EVENT = {
  fieldFocused: "FIELD_FOCUSED",
  formPatch: "FORM_PATCH",
  snapshotRequest: "SNAPSHOT_REQUEST",
  formSnapshot: "FORM_SNAPSHOT",
  statusChanged: "STATUS_CHANGED",
  formSubmitted: "FORM_SUBMITTED",
} as const;

export const PATIENT_FORM_FIELDS: ReadonlyArray<keyof PatientFormData> = [
  "firstName",
  "middleName",
  "lastName",
  "dateOfBirth",
  "gender",
  "phoneNumber",
  "email",
  "address",
  "preferredLanguage",
  "nationality",
  "emergencyContact",
  "religion",
];

export const PATIENT_FORM_FIELD_PATHS: ReadonlyArray<PatientFormFieldPath> = [
  "firstName",
  "middleName",
  "lastName",
  "dateOfBirth",
  "gender",
  "phoneNumber",
  "email",
  "address",
  "preferredLanguage",
  "nationality",
  "emergencyContact.name",
  "emergencyContact.relationship",
  "religion",
];

const VALID_GENDERS: ReadonlySet<string> = new Set([
  "male",
  "female",
  "other",
  "prefer_not_to_say",
]);

export type FormPatchPayload = {
  sessionId: string;
  patch: Partial<PatientFormData>;
  changedField: keyof PatientFormData;
  focusedField?: PatientFormFieldPath | null;
  patientStatus?: Exclude<PatientStatus, "submitted">;
  revision: number;
  sentAt: string;
};

export type FieldFocusedPayload = {
  sessionId: string;
  focusedField: PatientFormFieldPath;
  patientStatus: "actively_filling";
  lastActivityAt: string;
  revision: number;
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
  focusedField?: PatientFormFieldPath | null;
  patientStatus: PatientStatus;
  revision: number;
  sentAt: string;
};

export type StatusChangedPayload = {
  sessionId: string;
  focusedField?: PatientFormFieldPath | null;
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
  [REALTIME_EVENT.fieldFocused]: FieldFocusedPayload;
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
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isValidRevision(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isSafeInteger(value) &&
    value >= 0
  );
}

function isPatientStatus(value: unknown): value is PatientStatus {
  return (
    typeof value === "string" &&
    (value === "actively_filling" ||
      value === "inactive" ||
      value === "submitted")
  );
}

function isPatientLifecycleStatus(
  value: unknown,
): value is Exclude<PatientStatus, "submitted"> {
  return value === "actively_filling" || value === "inactive";
}

function isValidChangedField(value: unknown): value is keyof PatientFormData {
  return (
    typeof value === "string" &&
    PATIENT_FORM_FIELDS.includes(value as keyof PatientFormData)
  );
}

export function isPatientFormFieldPath(
  value: unknown,
): value is PatientFormFieldPath {
  return (
    typeof value === "string" &&
    PATIENT_FORM_FIELD_PATHS.includes(value as PatientFormFieldPath)
  );
}

function isValidGender(value: unknown): value is Gender {
  return typeof value === "string" && VALID_GENDERS.has(value);
}

function isValidEmergencyContact(
  value: unknown,
): value is EmergencyContact | undefined {
  if (value === undefined) {
    return true;
  }
  if (!isObject(value)) {
    return false;
  }
  const keys = Object.keys(value);
  for (const key of keys) {
    if (key !== "name" && key !== "relationship") {
      return false;
    }
    const val = value[key];
    if (val !== undefined && typeof val !== "string") {
      return false;
    }
  }
  return true;
}

function isValidFieldValue<K extends keyof PatientFormData>(
  field: K,
  value: unknown,
): boolean {
  if (value === undefined) {
    return true;
  }
  switch (field) {
    case "firstName":
    case "middleName":
    case "lastName":
    case "dateOfBirth":
    case "phoneNumber":
    case "email":
    case "address":
    case "preferredLanguage":
    case "nationality":
    case "religion":
      return typeof value === "string";
    case "gender":
      return isValidGender(value);
    case "emergencyContact":
      return isValidEmergencyContact(value);
    default:
      return false;
  }
}

export function isPartialPatientFormData(
  value: unknown,
): value is Partial<PatientFormData> {
  if (!isObject(value)) {
    return false;
  }
  const keys = Object.keys(value);
  for (const key of keys) {
    if (!PATIENT_FORM_FIELDS.includes(key as keyof PatientFormData)) {
      return false;
    }
    if (
      !isValidFieldValue(
        key as keyof PatientFormData,
        (value as Record<string, unknown>)[key],
      )
    ) {
      return false;
    }
  }
  return true;
}

export function isFullPatientFormData(
  value: unknown,
): value is PatientFormData {
  if (!isObject(value)) {
    return false;
  }
  const requiredFields: Array<keyof PatientFormData> = [
    "firstName",
    "lastName",
    "dateOfBirth",
    "gender",
    "phoneNumber",
    "email",
    "address",
    "preferredLanguage",
    "nationality",
  ];
  for (const field of requiredFields) {
    const val = (value as Record<string, unknown>)[field];
    if (val === undefined || typeof val !== "string" || val.length === 0) {
      if (field === "gender" && isValidGender(val)) {
        continue;
      }
      return false;
    }
  }
  return isPartialPatientFormData(value);
}

export function getFormPatchPayload(
  message: BroadcastEnvelope,
): FormPatchPayload | null {
  const payload = message.payload;

  if (
    !isObject(payload) ||
    typeof payload.sessionId !== "string" ||
    payload.sessionId.length === 0 ||
    !isValidChangedField(payload.changedField) ||
    !isObject(payload.patch) ||
    !(payload.changedField in payload.patch) ||
    !isPartialPatientFormData(payload.patch) ||
    (payload.focusedField !== undefined &&
      payload.focusedField !== null &&
      !isPatientFormFieldPath(payload.focusedField)) ||
    (payload.patientStatus !== undefined &&
      !isPatientLifecycleStatus(payload.patientStatus)) ||
    !isValidRevision(payload.revision) ||
    typeof payload.sentAt !== "string"
  ) {
    return null;
  }

  return payload as FormPatchPayload;
}

export function getFieldFocusedPayload(
  message: BroadcastEnvelope,
): FieldFocusedPayload | null {
  const payload = message.payload;

  if (
    !isObject(payload) ||
    typeof payload.sessionId !== "string" ||
    payload.sessionId.length === 0 ||
    !isPatientFormFieldPath(payload.focusedField) ||
    payload.patientStatus !== "actively_filling" ||
    typeof payload.lastActivityAt !== "string" ||
    !isValidRevision(payload.revision)
  ) {
    return null;
  }

  return payload as FieldFocusedPayload;
}

export function getSnapshotRequestPayload(
  message: BroadcastEnvelope,
): SnapshotRequestPayload | null {
  const payload = message.payload;

  if (
    !isObject(payload) ||
    typeof payload.sessionId !== "string" ||
    payload.sessionId.length === 0 ||
    typeof payload.requestId !== "string" ||
    payload.requestId.length === 0 ||
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
    payload.sessionId.length === 0 ||
    typeof payload.requestId !== "string" ||
    payload.requestId.length === 0 ||
    !isObject(payload.formData) ||
    !isPartialPatientFormData(payload.formData) ||
    (payload.focusedField !== undefined &&
      payload.focusedField !== null &&
      !isPatientFormFieldPath(payload.focusedField)) ||
    !isPatientStatus(payload.patientStatus) ||
    !isValidRevision(payload.revision) ||
    typeof payload.sentAt !== "string"
  ) {
    return null;
  }

  return payload as FormSnapshotPayload;
}

export function getStatusChangedPayload(
  message: BroadcastEnvelope,
): StatusChangedPayload | null {
  const payload = message.payload;

  if (
    !isObject(payload) ||
    typeof payload.sessionId !== "string" ||
    payload.sessionId.length === 0 ||
    !isPatientStatus(payload.patientStatus) ||
    (payload.focusedField !== undefined &&
      payload.focusedField !== null &&
      !isPatientFormFieldPath(payload.focusedField)) ||
    typeof payload.lastActivityAt !== "string" ||
    !isValidRevision(payload.revision)
  ) {
    return null;
  }

  return payload as StatusChangedPayload;
}

export function getFormSubmittedPayload(
  message: BroadcastEnvelope,
): FormSubmittedPayload | null {
  const payload = message.payload;

  if (
    !isObject(payload) ||
    typeof payload.sessionId !== "string" ||
    payload.sessionId.length === 0 ||
    !isObject(payload.formData) ||
    !isFullPatientFormData(payload.formData) ||
    payload.patientStatus !== "submitted" ||
    typeof payload.submittedAt !== "string" ||
    !isValidRevision(payload.revision)
  ) {
    return null;
  }

  return payload as FormSubmittedPayload;
}
