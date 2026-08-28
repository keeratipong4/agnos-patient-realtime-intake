import type { ConnectionStatus } from "@/types";

const STATUS_STYLES: Record<ConnectionStatus, string> = {
  connecting: "border-slate-200 bg-slate-100 text-slate-700",
  connected: "border-emerald-200 bg-emerald-50 text-emerald-800",
  disconnected: "border-amber-200 bg-amber-50 text-amber-800",
};

const STATUS_LABELS: Record<ConnectionStatus, string> = {
  connecting: "Connecting",
  connected: "Connected",
  disconnected: "Disconnected",
};

export function StatusBadge({ status }: { status: ConnectionStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-semibold ${STATUS_STYLES[status]}`}
    >
      <span
        aria-hidden="true"
        className={`h-2 w-2 rounded-full ${
          status === "connected"
            ? "bg-emerald-500"
            : status === "connecting"
              ? "bg-slate-400"
              : "bg-amber-500"
        }`}
      />
      {STATUS_LABELS[status]}
    </span>
  );
}
