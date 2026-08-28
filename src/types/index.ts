export type ConnectionStatus = "connecting" | "connected" | "disconnected";

export type PatientStatus =
  | "actively_filling"
  | "inactive"
  | "submitted";

export type VerticalSliceFormData = {
  firstName: string;
};

export type PatientPresence = {
  role: "patient";
  connectedAt: string;
};
