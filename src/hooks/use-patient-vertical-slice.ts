"use client";

import { usePatientSync } from "./use-patient-sync";
import type { ConnectionStatus } from "@/types";

const INITIAL_FORM_DATA = { firstName: "" };

type PatientVerticalSlice = {
  connectionStatus: ConnectionStatus;
  firstName: string;
  syncError: string | null;
  updateFirstName: (value: string) => void;
};

export function usePatientVerticalSlice(
  sessionId: string,
): PatientVerticalSlice {
  const { connectionStatus, formData, syncError, patchField } = usePatientSync(
    sessionId,
    {
      initialFormData: INITIAL_FORM_DATA,
    },
  );

  return {
    connectionStatus,
    firstName: formData.firstName ?? "",
    syncError,
    updateFirstName: (value: string) => patchField("firstName", value),
  };
}
