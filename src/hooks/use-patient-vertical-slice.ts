"use client";

import type { RealtimeChannel } from "@supabase/supabase-js";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  getSnapshotRequestPayload,
  REALTIME_EVENT,
  type BroadcastEnvelope,
  type FormPatchPayload,
  type FormSnapshotPayload,
} from "@/lib/realtime-events";
import { getSessionChannelName } from "@/lib/session";
import {
  getSupabaseBrowserClient,
  hasSupabaseBrowserConfig,
  REALTIME_CONFIG_ERROR,
} from "@/lib/supabase";
import type { ConnectionStatus } from "@/types";

const PATCH_DEBOUNCE_MS = 300;

type PatientVerticalSlice = {
  connectionStatus: ConnectionStatus;
  firstName: string;
  syncError: string | null;
  updateFirstName: (value: string) => void;
};

export function usePatientVerticalSlice(
  sessionId: string,
): PatientVerticalSlice {
  const isConfigured = hasSupabaseBrowserConfig();
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>(isConfigured ? "connecting" : "disconnected");
  const [firstName, setFirstName] = useState("");
  const [syncError, setSyncError] = useState<string | null>(
    isConfigured ? null : REALTIME_CONFIG_ERROR,
  );
  const channelRef = useRef<RealtimeChannel | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const firstNameRef = useRef("");
  const revisionRef = useRef(0);

  useEffect(() => {
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
          formData: { firstName: firstNameRef.current },
          patientStatus: "inactive",
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
              setSyncError("The current value snapshot could not be sent.");
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
          setConnectionStatus("connected");
          setSyncError(null);
        } else {
          setConnectionStatus("disconnected");
          setSyncError("Patient presence could not be registered.");
        }
        return;
      }

      if (
        status === "CHANNEL_ERROR" ||
        status === "TIMED_OUT" ||
        status === "CLOSED"
      ) {
        setConnectionStatus("disconnected");
      }
    });

    return () => {
      cancelled = true;

      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      channelRef.current = null;
      void channel.untrack().finally(() => client.removeChannel(channel));
    };
  }, [sessionId]);

  const updateFirstName = useCallback(
    (value: string) => {
      setFirstName(value);
      firstNameRef.current = value;

      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      debounceRef.current = setTimeout(() => {
        const channel = channelRef.current;

        if (!channel) {
          return;
        }

        const revision = ++revisionRef.current;
        const patch: FormPatchPayload = {
          sessionId,
          patch: { firstName: firstNameRef.current },
          changedField: "firstName",
          revision,
          sentAt: new Date().toISOString(),
        };

        void channel
          .send({
            type: "broadcast",
            event: REALTIME_EVENT.formPatch,
            payload: patch,
          })
          .then((result) => {
            if (result !== "ok") {
              setSyncError("The latest field update could not be sent.");
            }
          });
      }, PATCH_DEBOUNCE_MS);
    },
    [sessionId],
  );

  return {
    connectionStatus,
    firstName,
    syncError,
    updateFirstName,
  };
}
