import Link from "next/link";
import Image from "next/image";
import { TrendingUp, TrendingDown, Minus, Snowflake } from "lucide-react";
import type { ValueStatus } from "@/data/types";

/* ============================================================================
   TYPES
   ============================================================================ */

export interface PlayerCardProps {
  name: string;
  team: string;
  position: string;
  avatarUrl?: string;
  teamBadgeUrl?: string;
  line: number;
  odds: number;
  impliedProbability: number;
  avgShots: number;
  avgLabel?: string;
  last5: boolean[]; // true = hit, false = miss
  cv: number | null;
  status: ValueStatus;
  sparkline?: number[]; // recent shots array for mini chart
  playerId?: string;
}

/* ============================================================================
   HELPERS
   ============================================================================ */
function statusConfig(s: ValueStatus) {
  switch (s) {
    case "high":
      return {
        label: "Alto Valor",
        border: "border-fb-accent-green",
        bg: "bg-fb-accent-green/10",
        text: "text-fb-accent-green",
        icon: TrendingUp,
        glow: "animate-value-glow",
      };
    case "good":
      return {
        label: "Bom Valor",
        border: "border-fb-accent-green/50",
        bg: "bg-fb-accent-green/5",
        text: "text-fb-accent-green",
        icon: TrendingUp,
        glow: "",
      };
    case "neutral":
      return {
        label: "Neutro",
        border: "border-fb-border",
        bg: "bg-fb-surface",
        text: "text-fb-text-secondary",
        icon: Minus,
        glow: "",
      };
    case "low":
      return {
        label: "Baixo Valor",
        border: "border-fb-accent-red/50",
        bg: "bg-fb-accent-red/5",
        text: "text-fb-accent-red",
        icon: TrendingDown,
        glow: "",
      };
    case "cold":
      return {
        label: "Frio",
        border: "border-blue-500/40",
        bg: "bg-blue-500/5",
        text: "text-blue-400",
        icon: Snowflake,
        glow: "",
      };
  }
}

/* ============================================================================
   COMPONENT
   ============================================================================ */
export function PlayerCard({
  name,
  team,
  position,
  avatarUrl,
  teamBadgeUrl,
  line,
  odds,
  impliedProbability,
  avgShots,
  avgLabel,
  last5,
  cv,
  status,
  sparkline,
  playerId,
}: PlayerCardProps) {
  const cfg = statusConfig(status);
  const StatusIcon = cfg.icon;
  const formattedLine = line.toFixed(1);
  const formattedOdds = odds.toFixed(2);

  const card = (
    <div
      className={`group rounded-2xl border ${cfg.border} bg-fb-card/80 backdrop-blur-sm p-4 transition-all duration-300 hover:border-fb-primary/40 hover:shadow-xl hover:shadow-fb-primary/5 hover:-translate-y-0.5 ${cfg.glow}`}
    >
      {/* Header: avatar + info */}
      <div className="flex items-start gap-3 mb-3">
        <div className="size-12 rounded-full bg-gradient-to-br from-fb-primary/20 to-fb-accent-green/10 flex items-center justify-center overflow-hidden shrink-0 border border-fb-primary/15 transition-transform duration-300 group-hover:scale-105">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt={name}
              width={48}
              height={48}
              className="size-full object-cover"
            />
          ) : (
            <span className="text-fb-primary text-lg font-bold">
              {name.charAt(0)}
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-fb-text font-semibold text-sm truncate">
            {name}
          </h3>
          <div className="flex items-center gap-1 text-fb-text-muted text-xs">
            <span>{position}</span>
            <span>•</span>
            {teamBadgeUrl && (
              <Image
                src={teamBadgeUrl}
                alt={team}
                width={14}
                height={14}
                className="size-3.5 object-contain"
              />
            )}
            <span className="truncate">{team}</span>
          </div>
        </div>
        <div
          className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${cfg.bg} ${cfg.text}`}
        >
          <StatusIcon className="size-3" />
          {cfg.label}
        </div>
      </div>

      {/* Line + metrics */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="bg-fb-surface rounded-lg p-2 text-center">
          <p className="text-[10px] text-fb-text-muted uppercase tracking-wider">
            Linha
          </p>
          <p className="text-fb-text font-bold text-sm">Over {formattedLine}</p>
        </div>
        <div className="bg-fb-surface rounded-lg p-2 text-center">
          <p className="text-[10px] text-fb-text-muted uppercase tracking-wider">
            Prob. Impl.
          </p>
          <p className="text-fb-text font-bold text-sm">
            {impliedProbability}%
          </p>
        </div>
        <div className="bg-fb-surface rounded-lg p-2 text-center">
          <p className="text-[10px] text-fb-text-muted uppercase tracking-wider">
            {avgLabel ?? "Méd. Chutes"}
          </p>
          <p className="text-fb-text font-bold text-sm">
            {avgShots.toFixed(1)}
          </p>
        </div>
      </div>

      {/* Odds button */}
      <button
        aria-label={`Odds ${formattedOdds} para ${name}`}
        className="w-full py-2.5 rounded-xl bg-fb-primary/10 border border-fb-primary/15 text-fb-primary font-bold text-sm hover:bg-fb-primary/20 transition-all duration-200 mb-3 btn-press"
      >
        {formattedOdds}
      </button>

      {/* Last 5 hit/miss bars */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] text-fb-text-muted uppercase tracking-wider">
          Últimos 5
        </span>
        <div className="flex gap-1">
          {last5.map((hit, i) => (
            <div
              key={i}
              className={`h-4 w-2.5 rounded-sm transition-all ${
                hit ? "bg-fb-accent-green" : "bg-fb-accent-red/50"
              }`}
            />
          ))}
        </div>
      </div>

      {/* CV badge + sparkline */}
      <div className="flex items-center justify-between">
        {cv !== null ? (
          <div
            className={`text-xs font-medium px-2 py-0.5 rounded ${
              cv <= 0.3
                ? "bg-fb-accent-green/10 text-fb-accent-green"
                : cv <= 0.5
                  ? "bg-fb-accent-gold/10 text-fb-accent-gold"
                  : "bg-fb-accent-red/10 text-fb-accent-red"
            }`}
          >
            CV {cv.toFixed(2)}
          </div>
        ) : (
          <div className="text-xs text-fb-text-muted">CV N/A</div>
        )}

        {/* Mini sparkline */}
        {sparkline && sparkline.length > 0 && (
          <div className="flex items-end gap-[2px] h-4">
            {(() => {
              const maxSpark = Math.max(...sparkline, 1);
              return sparkline.slice(-8).map((v, i) => (
                <div
                  key={i}
                  className="w-1 rounded-full bg-fb-primary/40"
                  style={{
                    height: `${Math.max(20, (v / maxSpark) * 100)}%`,
                  }}
                />
              ));
            })()}
          </div>
        )}
      </div>
    </div>
  );

  if (playerId) {
    return <Link href={`/player/${playerId}`}>{card}</Link>;
  }

  return card;
}
