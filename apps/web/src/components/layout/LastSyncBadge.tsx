"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

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

export function LastSyncBadge({ className }: LastSyncBadgeProps) {
  const [lastSync, setLastSync] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const fetchLastSync = async () => {
      try {
        const res = await fetch("/api/sync-status", { cache: "no-store" });
        const data = (await res.json()) as { lastSync?: string | null };
        if (active) setLastSync(data.lastSync ?? null);
      } catch {
        if (active) setLastSync(null);
      }
    };

    fetchLastSync();
    const timer = setInterval(fetchLastSync, 60000);

    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full border border-fb-border/60 bg-fb-surface/70 px-3 py-1 text-xs text-fb-text-secondary ${
        className ?? ""
      }`}
      aria-live="polite"
      title={
        lastSync
          ? `Ultima sincronizacao: ${formatLastSync(lastSync)}`
          : "Ultima sincronizacao indisponivel"
      }
    >
      <Clock className="size-3.5 text-fb-text-muted" aria-hidden="true" />
      <span className="whitespace-nowrap tabular-nums">
        Atualizado {lastSync ? formatLastSync(lastSync) : "-"}
      </span>
    </div>
  );
}

LastSyncBadge.displayName = "LastSyncBadge";
