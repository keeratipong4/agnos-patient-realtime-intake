"use client";

import { useStaffSync } from "./use-staff-sync";
import type { ConnectionStatus } from "@/types";

type StaffVerticalSlice = {
  connectionStatus: ConnectionStatus;
  firstName: string;
  syncError: string | null;
};

export function useStaffVerticalSlice(sessionId: string): StaffVerticalSlice {
  const { connectionStatus, formData, syncError } = useStaffSync(sessionId);

  return {
    connectionStatus,
    firstName: formData.firstName ?? "",
    syncError,
  };
}
