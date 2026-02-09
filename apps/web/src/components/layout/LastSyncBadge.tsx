"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Clock, RefreshCw } from "lucide-react";

interface LastSyncBadgeProps {
  className?: string;
}

function formatLastSync(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  const datePart = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  }).format(date);
  const timePart = new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
  return `${datePart} ${timePart}`;
}

function formatRelativeTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const now = Date.now();
  const diffMs = now - date.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMs / 3_600_000);
  const diffDays = Math.floor(diffMs / 86_400_000);

  if (diffMin < 1) return "agora";
  if (diffMin < 60) return `há ${diffMin}min`;
  if (diffHours < 24) return `há ${diffHours}h`;
  return `há ${diffDays}d`;
}

function getSyncStatusColor(value: string | null): {
  dot: string;
  ring: string;
} {
  if (!value) return { dot: "bg-gray-500", ring: "" };
  const diffMs = Date.now() - new Date(value).getTime();
  const diffHours = diffMs / 3_600_000;
  if (diffHours < 6)
    return {
      dot: "bg-fb-accent-green animate-pulse",
      ring: "border-fb-accent-green/30",
    };
  if (diffHours < 24)
    return { dot: "bg-fb-accent-gold", ring: "border-fb-accent-gold/30" };
  return { dot: "bg-fb-accent-red", ring: "border-fb-accent-red/30" };
}

export function LastSyncBadge({ className }: LastSyncBadgeProps) {
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [relativeTime, setRelativeTime] = useState<string>("");
  const lastSyncRef = useRef<string | null>(null);

  const fetchLastSync = useCallback(async () => {
    try {
      const res = await fetch("/api/sync-status", { cache: "no-store" });
      const data = (await res.json()) as { lastSync?: string | null };
      const value = data.lastSync ?? null;
      lastSyncRef.current = value;
      setLastSync(value);
      if (value) setRelativeTime(formatRelativeTime(value));
    } catch {
      lastSyncRef.current = null;
      setLastSync(null);
    }
  }, []);

  useEffect(() => {
    fetchLastSync();
    const syncTimer = setInterval(fetchLastSync, 60_000);

    // Update relative time every 30s using ref (no re-render deps)
    const relativeTimer = setInterval(() => {
      const v = lastSyncRef.current;
      if (v) setRelativeTime(formatRelativeTime(v));
    }, 30_000);

    return () => {
      clearInterval(syncTimer);
      clearInterval(relativeTimer);
    };
  }, [fetchLastSync]);

  const { dot, ring } = getSyncStatusColor(lastSync);

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full border ${ring || "border-fb-border/60"} bg-fb-surface/70 px-3 py-1.5 text-xs text-fb-text-secondary hover:bg-fb-surface transition-colors ${
        className ?? ""
      }`}
      aria-live="polite"
      title={
        lastSync
          ? `Última sincronização: ${formatLastSync(lastSync)}`
          : "Última sincronização indisponível"
      }
    >
      <div className="relative">
        <Clock className="size-3.5 text-fb-text-muted" aria-hidden="true" />
        <span
          className={`absolute -top-0.5 -right-0.5 size-1.5 rounded-full ${dot}`}
        />
      </div>
      <span className="whitespace-nowrap tabular-nums">
        {lastSync ? (
          <>
            <span className="font-medium text-fb-text">{relativeTime}</span>
            <span className="hidden sm:inline text-fb-text-muted ml-1">
              ({formatLastSync(lastSync)})
            </span>
          </>
        ) : (
          <span className="flex items-center gap-1">
            <RefreshCw className="size-3 animate-spin" />
            Sincronizando…
          </span>
        )}
      </span>
    </div>
  );
}

LastSyncBadge.displayName = "LastSyncBadge";
