export type ConnectionStatus = "connecting" | "connected" | "disconnected";

export type PatientStatus =
  | "actively_filling"
  | "inactive"
  | "submitted";

export type Gender =
  | "male"
  | "female"
  | "other"
  | "prefer_not_to_say";

export type EmergencyContact = {
  name: string;
  relationship: string;
};

export type PatientFormData = {
  firstName: string;
  middleName?: string;
  lastName: string;
  dateOfBirth: string;
  gender: Gender;
  phoneNumber: string;
  email: string;
  address: string;
  preferredLanguage: string;
  nationality: string;
  emergencyContact?: EmergencyContact;
  religion?: string;
};

export type VerticalSliceFormData = {
  firstName: string;
};

export type PatientPresence = {
  role: "patient";
  connectedAt: string;
};
