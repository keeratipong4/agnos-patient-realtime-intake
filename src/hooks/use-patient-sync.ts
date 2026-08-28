"use client";

import type { RealtimeChannel } from "@supabase/supabase-js";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  getSnapshotRequestPayload,
  REALTIME_EVENT,
  type BroadcastEnvelope,
  type FormPatchPayload,
  type FormSnapshotPayload,
  type FormSubmittedPayload,
  type StatusChangedPayload,
} from "@/lib/realtime-events";
import { getSessionChannelName } from "@/lib/session";
import {
  getSupabaseBrowserClient,
  hasSupabaseBrowserConfig,
  REALTIME_CONFIG_ERROR,
} from "@/lib/supabase";
import type { ConnectionStatus, PatientFormData, PatientStatus } from "@/types";

const DEFAULT_PATCH_DEBOUNCE_MS = 300;

export type PatientLifecycleStatus = "actively_filling" | "inactive";

export type UsePatientSyncOptions = {
  initialFormData?: Partial<PatientFormData>;
  debounceMs?: number;
};

export type PatientSyncResult = {
  connectionStatus: ConnectionStatus;
  patientStatus: PatientStatus;
  formData: Partial<PatientFormData>;
  syncError: string | null;
  patchField: <K extends keyof PatientFormData>(
    field: K,
    value: PatientFormData[K],
  ) => void;
  updatePatientStatus: (status: PatientLifecycleStatus) => void;
  submitForm: (finalData: PatientFormData) => Promise<boolean>;
};

export function usePatientSync(
  sessionId: string,
  options?: UsePatientSyncOptions,
): PatientSyncResult {
  const isConfigured = hasSupabaseBrowserConfig();

  const [sessionState, setSessionState] = useState({
    sessionId,
    connectionStatus: (isConfigured ? "connecting" : "disconnected") as ConnectionStatus,
    patientStatus: "inactive" as PatientStatus,
    formData: options?.initialFormData ?? ({} as Partial<PatientFormData>),
    syncError: (isConfigured ? null : REALTIME_CONFIG_ERROR) as string | null,
  });

  const isCurrentSession = sessionState.sessionId === sessionId;
  const connectionStatus = isCurrentSession
    ? sessionState.connectionStatus
    : isConfigured
      ? "connecting"
      : "disconnected";
  const patientStatus = isCurrentSession
    ? sessionState.patientStatus
    : "inactive";
  const formData = isCurrentSession
    ? sessionState.formData
    : (options?.initialFormData ?? {});
  const syncError = isCurrentSession
    ? sessionState.syncError
    : isConfigured
      ? null
      : REALTIME_CONFIG_ERROR;

  const channelRef = useRef<RealtimeChannel | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingPatchRef = useRef<Partial<PatientFormData>>({});
  const lastChangedFieldRef = useRef<keyof PatientFormData | null>(null);

  const initialFormDataRef = useRef(options?.initialFormData);
  const formDataRef = useRef<Partial<PatientFormData>>(
    options?.initialFormData ?? {},
  );
  const patientStatusRef = useRef<PatientStatus>("inactive");
  const revisionRef = useRef<number>(0);

  const debounceMs = options?.debounceMs ?? DEFAULT_PATCH_DEBOUNCE_MS;

  // Keep options ref updated without triggering channel re-subscriptions
  useEffect(() => {
    initialFormDataRef.current = options?.initialFormData;
  }, [options?.initialFormData]);

  useEffect(() => {
    formDataRef.current = initialFormDataRef.current ?? {};
    patientStatusRef.current = "inactive";
    revisionRef.current = 0;
    pendingPatchRef.current = {};
    lastChangedFieldRef.current = null;

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }

    const client = getSupabaseBrowserClient();
    if (!client) {
      return;
    }

    let cancelled = false;
    const channel = client.channel(getSessionChannelName(sessionId), {
      config: {
        broadcast: { ack: true, self: false },
        presence: { key: `patient-${crypto.randomUUID()}` },
      },
    });
    channelRef.current = channel;

    channel.on(
      "broadcast",
      { event: REALTIME_EVENT.snapshotRequest },
      (message) => {
        const request = getSnapshotRequestPayload(
          message as BroadcastEnvelope,
        );

        if (!request || request.sessionId !== sessionId) {
          return;
        }

        const revision = ++revisionRef.current;
        const snapshot: FormSnapshotPayload = {
          sessionId,
          requestId: request.requestId,
          formData: formDataRef.current,
          patientStatus: patientStatusRef.current,
          revision,
          sentAt: new Date().toISOString(),
        };

        void channel
          .send({
            type: "broadcast",
            event: REALTIME_EVENT.formSnapshot,
            payload: snapshot,
          })
          .then((result) => {
            if (!cancelled && result !== "ok") {
              setSessionState((prev) => ({
                ...prev,
                syncError: "The current value snapshot could not be sent.",
              }));
            }
          });
      },
    );

    channel.subscribe(async (status) => {
      if (cancelled) {
        return;
      }

      if (status === "SUBSCRIBED") {
        const trackResult = await channel.track({
          role: "patient",
          connectedAt: new Date().toISOString(),
        });

        if (cancelled) {
          return;
        }

        if (trackResult === "ok") {
          setSessionState((prev) => ({
            ...prev,
            sessionId,
            connectionStatus: "connected",
            syncError: null,
          }));
        } else {
          setSessionState((prev) => ({
            ...prev,
            sessionId,
            connectionStatus: "disconnected",
            syncError: "Patient presence could not be registered.",
          }));
        }
        return;
      }

      if (
        status === "CHANNEL_ERROR" ||
        status === "TIMED_OUT" ||
        status === "CLOSED"
      ) {
        setSessionState((prev) => ({
          ...prev,
          sessionId,
          connectionStatus: "disconnected",
        }));
      }
    });

    return () => {
      cancelled = true;

      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }

      channelRef.current = null;
      void channel.untrack().finally(() => client.removeChannel(channel));
    };
  }, [sessionId]);

  const patchField = useCallback(
    <K extends keyof PatientFormData>(field: K, value: PatientFormData[K]) => {
      if (patientStatusRef.current === "submitted") {
        return;
      }

      const nextFormData = { ...formDataRef.current, [field]: value };
      formDataRef.current = nextFormData;
      setSessionState((prev) => ({
        ...prev,
        sessionId,
        formData: nextFormData,
      }));

      pendingPatchRef.current[field] = value;
      lastChangedFieldRef.current = field;

      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      debounceRef.current = setTimeout(() => {
        const channel = channelRef.current;
        const changedField = lastChangedFieldRef.current;

        if (
          !channel ||
          !changedField ||
          patientStatusRef.current === "submitted"
        ) {
          return;
        }

        const revision = ++revisionRef.current;
        const patch: FormPatchPayload = {
          sessionId,
          patch: { ...pendingPatchRef.current },
          changedField,
          revision,
          sentAt: new Date().toISOString(),
        };

        pendingPatchRef.current = {};
        lastChangedFieldRef.current = null;

        void channel
          .send({
            type: "broadcast",
            event: REALTIME_EVENT.formPatch,
            payload: patch,
          })
          .then((result) => {
            if (result !== "ok") {
              setSessionState((prev) => ({
                ...prev,
                syncError: "The latest field update could not be sent.",
              }));
            }
          });
      }, debounceMs);
    },
    [debounceMs, sessionId],
  );

  const updatePatientStatus = useCallback(
    (newStatus: PatientLifecycleStatus) => {
      if (patientStatusRef.current === newStatus) {
        return;
      }

      if (patientStatusRef.current === "submitted") {
        return;
      }

      patientStatusRef.current = newStatus;
      setSessionState((prev) => ({
        ...prev,
        sessionId,
        patientStatus: newStatus,
      }));

      const channel = channelRef.current;
      if (!channel) {
        return;
      }

      const revision = ++revisionRef.current;
      const statusPayload: StatusChangedPayload = {
        sessionId,
        patientStatus: newStatus,
        lastActivityAt: new Date().toISOString(),
        revision,
      };

      void channel
        .send({
          type: "broadcast",
          event: REALTIME_EVENT.statusChanged,
          payload: statusPayload,
        })
        .then((result) => {
          if (result !== "ok") {
            setSessionState((prev) => ({
              ...prev,
              syncError: "The patient status change could not be sent.",
            }));
          }
        });
    },
    [sessionId],
  );

  const submitForm = useCallback(
    async (finalData: PatientFormData): Promise<boolean> => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
      pendingPatchRef.current = {};
      lastChangedFieldRef.current = null;

      formDataRef.current = finalData;
      patientStatusRef.current = "submitted";
      setSessionState((prev) => ({
        ...prev,
        sessionId,
        formData: finalData,
        patientStatus: "submitted",
        syncError: null,
      }));

      const channel = channelRef.current;
      if (!channel) {
        return false;
      }

      const revision = ++revisionRef.current;
      const submittedPayload: FormSubmittedPayload = {
        sessionId,
        formData: finalData,
        patientStatus: "submitted",
        submittedAt: new Date().toISOString(),
        revision,
      };

      const result = await channel.send({
        type: "broadcast",
        event: REALTIME_EVENT.formSubmitted,
        payload: submittedPayload,
      });

      if (result !== "ok") {
        setSessionState((prev) => ({
          ...prev,
          syncError: "The form submission event could not be sent.",
        }));
        return false;
      }

      return true;
    },
    [sessionId],
  );

  return {
    connectionStatus,
    patientStatus,
    formData,
    syncError,
    patchField,
    updatePatientStatus,
    submitForm,
  };
}
