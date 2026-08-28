"use client";

import type { RealtimeChannel } from "@supabase/supabase-js";
import { useEffect, useRef, useState } from "react";

import {
  getFormPatchPayload,
  getFormSnapshotPayload,
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
import type { ConnectionStatus, PatientPresence } from "@/types";

type StaffVerticalSlice = {
  connectionStatus: ConnectionStatus;
  firstName: string;
  syncError: string | null;
};

export function useStaffVerticalSlice(sessionId: string): StaffVerticalSlice {
  const isConfigured = hasSupabaseBrowserConfig();
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>(isConfigured ? "connecting" : "disconnected");
  const [firstName, setFirstName] = useState("");
  const [syncError, setSyncError] = useState<string | null>(
    isConfigured ? null : REALTIME_CONFIG_ERROR,
  );
  const latestRevisionRef = useRef(-1);
  const pendingRequestIdRef = useRef<string | null>(null);

  useEffect(() => {
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

      setConnectionStatus(hasPatient ? "connected" : "disconnected");
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
          patch.sessionId !== sessionId ||
          patch.revision <= latestRevisionRef.current
        ) {
          return;
        }

        latestRevisionRef.current = patch.revision;
        if (patch.patch.firstName !== undefined) {
          setFirstName(patch.patch.firstName);
        }
      })
      .on(
        "broadcast",
        { event: REALTIME_EVENT.formSnapshot },
        (message) => {
          const snapshot = getFormSnapshotPayload(
            message as BroadcastEnvelope,
          );

          if (
            !snapshot ||
            snapshot.sessionId !== sessionId ||
            snapshot.requestId !== pendingRequestIdRef.current ||
            snapshot.revision <= latestRevisionRef.current
          ) {
            return;
          }

          latestRevisionRef.current = snapshot.revision;
          pendingRequestIdRef.current = null;
          setFirstName(snapshot.formData.firstName ?? "");
        },
      );

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
          setSyncError("The current Patient snapshot could not be requested.");
        } else if (!cancelled) {
          setSyncError(null);
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
      pendingRequestIdRef.current = null;
      void client.removeChannel(channel);
    };
  }, [sessionId]);

  return {
    connectionStatus,
    firstName,
    syncError,
  };
}
