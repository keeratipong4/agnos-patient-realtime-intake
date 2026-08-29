"use client";

import type { RealtimeChannel } from "@supabase/supabase-js";
import { useEffect, useRef, useState } from "react";

import {
  getFormPatchPayload,
  getFormSnapshotPayload,
  getFormSubmittedPayload,
  getStatusChangedPayload,
  REALTIME_EVENT,
  type BroadcastEnvelope,
  type SnapshotRequestPayload,
} from "@/lib/realtime-events";
import { getSessionChannelName } from "@/lib/session";
import {
  getSupabaseBrowserClient,
  hasSupabaseBrowserConfig,
  REALTIME_CONFIG_ERROR,
} from "@/lib/supabase";
import type {
  ConnectionStatus,
  PatientFormData,
  PatientPresence,
  PatientStatus,
} from "@/types";

export type StaffSyncResult = {
  connectionStatus: ConnectionStatus;
  patientStatus: PatientStatus;
  formData: Partial<PatientFormData>;
  lastChangedField: keyof PatientFormData | null;
  lastActivityAt: string | null;
  submittedAt: string | null;
  syncError: string | null;
};

function isFreshEvent(
  eventSessionId: string,
  targetSessionId: string,
  eventRevision: number,
  latestRevision: number,
): boolean {
  return (
    eventSessionId === targetSessionId &&
    eventRevision > latestRevision
  );
}

export function useStaffSync(sessionId: string): StaffSyncResult {
  const isConfigured = hasSupabaseBrowserConfig();

  const [sessionState, setSessionState] = useState({
    sessionId,
    connectionStatus: (isConfigured ? "connecting" : "disconnected") as ConnectionStatus,
    patientStatus: "inactive" as PatientStatus,
    formData: {} as Partial<PatientFormData>,
    lastChangedField: null as keyof PatientFormData | null,
    lastActivityAt: null as string | null,
    submittedAt: null as string | null,
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
  const formData = isCurrentSession ? sessionState.formData : {};
  const lastChangedField = isCurrentSession
    ? sessionState.lastChangedField
    : null;
  const lastActivityAt = isCurrentSession ? sessionState.lastActivityAt : null;
  const submittedAt = isCurrentSession ? sessionState.submittedAt : null;
  const syncError = isCurrentSession
    ? sessionState.syncError
    : isConfigured
      ? null
      : REALTIME_CONFIG_ERROR;

  const latestRevisionRef = useRef<number>(-1);
  const pendingRequestIdRef = useRef<string | null>(null);
  const patientStatusRef = useRef<PatientStatus>("inactive");

  useEffect(() => {
    latestRevisionRef.current = -1;
    pendingRequestIdRef.current = null;
    patientStatusRef.current = "inactive";

    const client = getSupabaseBrowserClient();
    if (!client) {
      return;
    }

    let cancelled = false;
    const channel = client.channel(getSessionChannelName(sessionId), {
      config: {
        broadcast: { ack: true, self: false },
      },
    });

    const updatePresenceStatus = (realtimeChannel: RealtimeChannel) => {
      const state = realtimeChannel.presenceState<PatientPresence>();
      const hasPatient = Object.values(state)
        .flat()
        .some((presence) => presence.role === "patient");

      if (!hasPatient && patientStatusRef.current !== "submitted") {
        patientStatusRef.current = "inactive";
      }

      setSessionState((prev) => ({
        ...prev,
        sessionId,
        connectionStatus: hasPatient ? "connected" : "disconnected",
        patientStatus:
          !hasPatient && prev.patientStatus !== "submitted"
            ? "inactive"
            : prev.patientStatus,
      }));
    };

    channel
      .on("presence", { event: "sync" }, () => {
        updatePresenceStatus(channel);
      })
      .on("presence", { event: "join" }, () => {
        updatePresenceStatus(channel);
      })
      .on("presence", { event: "leave" }, () => {
        updatePresenceStatus(channel);
      })
      .on("broadcast", { event: REALTIME_EVENT.formPatch }, (message) => {
        const patch = getFormPatchPayload(message as BroadcastEnvelope);

        if (
          !patch ||
          !isFreshEvent(
            patch.sessionId,
            sessionId,
            patch.revision,
            latestRevisionRef.current,
          )
        ) {
          return;
        }

        if (patientStatusRef.current === "submitted") {
          return;
        }

        latestRevisionRef.current = patch.revision;
        setSessionState((prev) => ({
          ...prev,
          sessionId,
          formData: {
            ...prev.formData,
            ...patch.patch,
          },
          lastChangedField: patch.changedField,
          lastActivityAt: patch.sentAt,
        }));
      })
      .on("broadcast", { event: REALTIME_EVENT.formSnapshot }, (message) => {
        const snapshot = getFormSnapshotPayload(message as BroadcastEnvelope);

        if (
          !snapshot ||
          snapshot.requestId !== pendingRequestIdRef.current ||
          !isFreshEvent(
            snapshot.sessionId,
            sessionId,
            snapshot.revision,
            latestRevisionRef.current,
          )
        ) {
          return;
        }

        if (
          patientStatusRef.current === "submitted" &&
          snapshot.patientStatus !== "submitted"
        ) {
          return;
        }

        latestRevisionRef.current = snapshot.revision;
        pendingRequestIdRef.current = null;
        patientStatusRef.current = snapshot.patientStatus;
        setSessionState((prev) => ({
          ...prev,
          sessionId,
          formData: snapshot.formData,
          patientStatus: snapshot.patientStatus,
        }));
      })
      .on("broadcast", { event: REALTIME_EVENT.statusChanged }, (message) => {
        const payload = getStatusChangedPayload(message as BroadcastEnvelope);

        if (
          !payload ||
          !isFreshEvent(
            payload.sessionId,
            sessionId,
            payload.revision,
            latestRevisionRef.current,
          )
        ) {
          return;
        }

        if (patientStatusRef.current === "submitted") {
          return;
        }

        latestRevisionRef.current = payload.revision;
        patientStatusRef.current = payload.patientStatus;
        setSessionState((prev) => ({
          ...prev,
          sessionId,
          patientStatus: payload.patientStatus,
          lastActivityAt: payload.lastActivityAt,
        }));
      })
      .on("broadcast", { event: REALTIME_EVENT.formSubmitted }, (message) => {
        const payload = getFormSubmittedPayload(message as BroadcastEnvelope);

        if (
          !payload ||
          !isFreshEvent(
            payload.sessionId,
            sessionId,
            payload.revision,
            latestRevisionRef.current,
          )
        ) {
          return;
        }

        latestRevisionRef.current = payload.revision;
        patientStatusRef.current = "submitted";
        setSessionState((prev) => ({
          ...prev,
          sessionId,
          patientStatus: "submitted",
          formData: payload.formData,
          submittedAt: payload.submittedAt,
        }));
      });

    channel.subscribe(async (status) => {
      if (cancelled) {
        return;
      }

      if (status === "SUBSCRIBED") {
        updatePresenceStatus(channel);

        const requestId = crypto.randomUUID();
        pendingRequestIdRef.current = requestId;
        const request: SnapshotRequestPayload = {
          sessionId,
          requestId,
          requestedAt: new Date().toISOString(),
        };
        const result = await channel.send({
          type: "broadcast",
          event: REALTIME_EVENT.snapshotRequest,
          payload: request,
        });

        if (!cancelled && result !== "ok") {
          setSessionState((prev) => ({
            ...prev,
            syncError: "The current Patient snapshot could not be requested.",
          }));
        } else if (!cancelled) {
          setSessionState((prev) => ({
            ...prev,
            syncError: null,
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
      pendingRequestIdRef.current = null;
      void client.removeChannel(channel);
    };
  }, [isConfigured, sessionId]);

  return {
    connectionStatus,
    patientStatus,
    formData,
    lastChangedField,
    lastActivityAt,
    submittedAt,
    syncError,
  };
}
