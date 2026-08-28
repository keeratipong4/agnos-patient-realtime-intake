"use client";

import { useCallback, useEffect, useRef } from "react";

import type { PatientLifecycleStatus } from "@/hooks/use-patient-sync";

export const PATIENT_IDLE_TIMEOUT_MS = 5_000;

type UseIdleTrackerOptions = {
  disabled?: boolean;
  idleMs?: number;
  onStatusChange: (status: PatientLifecycleStatus) => void;
};

export function useIdleTracker({
  disabled = false,
  idleMs = PATIENT_IDLE_TIMEOUT_MS,
  onStatusChange,
}: UseIdleTrackerOptions) {
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearIdleTimer = useCallback(() => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
  }, []);

  const markInactive = useCallback(() => {
    clearIdleTimer();

    if (!disabled) {
      onStatusChange("inactive");
    }
  }, [clearIdleTimer, disabled, onStatusChange]);

  const recordActivity = useCallback(() => {
    if (disabled) {
      return;
    }

    clearIdleTimer();
    onStatusChange("actively_filling");
    idleTimerRef.current = setTimeout(markInactive, idleMs);
  }, [clearIdleTimer, disabled, idleMs, markInactive, onStatusChange]);

  useEffect(() => {
    if (disabled) {
      clearIdleTimer();
      return;
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        markInactive();
      }
    };

    window.addEventListener("blur", markInactive);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearIdleTimer();
      window.removeEventListener("blur", markInactive);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [clearIdleTimer, disabled, markInactive]);

  return { recordActivity };
}
