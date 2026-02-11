"use client";

import {
  Star,
  Bell,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import { SafeImage } from "@/components/ui/SafeImage";
import type { PlayerDetail } from "@/data/types";

interface PlayerHeroCardProps {
  player: PlayerDetail;
}

export function PlayerHeroCard({ player }: PlayerHeroCardProps) {
  // Safe access on trends (guard when trends array is undefined/null)
  const trends = player.trends ?? [];
  const fallbackTrend = { value: "—", direction: "neutral" as const };
  const trend0 = trends[0] ?? fallbackTrend;
  const trend1 = trends[1] ?? fallbackTrend;
  const trend2 = trends[2] ?? fallbackTrend;
  const trend3 = trends[3] ?? fallbackTrend;

  const stats = [
    {
      label: "Média Chutes/90",
      value: player.avgShots.toFixed(1),
      trend: trend0,
    },
    { label: "No Alvo", value: player.onTarget.toFixed(1), trend: trend1 },
    { label: "Conv. Gols", value: player.convRate, trend: trend2 },
    { label: "Minutos", value: player.avgMinutes, trend: trend3 },
  ];

  return (
    <div className="bg-fb-card rounded-xl p-6 border border-fb-border mb-8">
      <div className="flex flex-col lg:flex-row gap-8 items-start lg:items-center justify-between">
        {/* Left: avatar + info */}
        <div className="flex gap-5 items-center">
          <div className="relative shrink-0">
            <div className="size-28 md:size-32 rounded-full overflow-hidden border-4 border-fb-surface-darker bg-fb-surface">
              <SafeImage
                src={player.avatarUrl}
                alt={player.name}
                width={128}
                height={128}
                className="size-full object-cover"
                fallbackType="player"
                fallbackText={player.name}
                fallbackClassName="w-full h-full flex items-center justify-center text-4xl font-bold text-fb-text-muted"
              />
            </div>
            <div className="absolute -bottom-1 -right-1 bg-fb-card rounded-full p-1.5 border border-fb-border shadow-sm overflow-hidden">
              <SafeImage
                src={player.teamBadgeUrl}
                alt={player.team}
                width={20}
                height={20}
                className="size-5 object-contain"
                fallbackType="team"
                fallbackClassName="size-5 text-fb-primary"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl md:text-3xl font-bold text-fb-text">
                {player.name}
              </h1>
              <span className="bg-fb-primary/10 text-fb-primary border border-fb-primary/20 text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wider flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-fb-primary animate-pulse" />
                {player.status}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-fb-text-secondary text-sm mb-3">
              <span>{player.position}</span>
              {player.team && player.team !== "—" && (
                <>
                  <span className="w-1 h-1 bg-fb-text-muted rounded-full" />
                  <div className="flex items-center gap-1.5">
                    {player.teamBadgeUrl && (
                      <SafeImage
                        src={player.teamBadgeUrl}
                        alt={player.team}
                        width={16}
                        height={16}
                        className="size-4 object-contain"
                        fallbackType="team"
                      />
                    )}
                    <span>{player.team}</span>
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 bg-fb-surface-darker text-fb-text-muted text-xs font-medium py-1.5 px-3 rounded-lg border border-fb-border">
                <Star className="size-3.5" />
                Seguir Jogador
                <span className="bg-fb-primary/15 text-fb-primary text-[10px] font-bold px-1.5 py-0.5 rounded">Em breve</span>
              </span>
              <span className="inline-flex items-center gap-1.5 bg-fb-surface-darker text-fb-text-muted text-xs font-medium py-1.5 px-3 rounded-lg border border-fb-border">
                <Bell className="size-3.5" />
                Alertas
                <span className="bg-fb-primary/15 text-fb-primary text-[10px] font-bold px-1.5 py-0.5 rounded">Em breve</span>
              </span>
            </div>
          </div>
        </div>

        {/* Right: stat boxes */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full lg:w-auto">
          {stats.map((s) => (
            <div
              key={s.label}
              className="bg-fb-surface-darker p-4 rounded-lg flex flex-col justify-between"
            >
              <span className="text-xs font-medium text-fb-text-muted uppercase tracking-wider">
                {s.label}
              </span>
              <div className="flex items-end gap-2 mt-1">
                <span className="text-2xl font-bold text-fb-text">
                  {s.value}
                </span>
                <span
                  className={`text-xs font-medium mb-1 flex items-center ${
                    s.trend.direction === "up"
                      ? "text-fb-primary"
                      : s.trend.direction === "down"
                        ? "text-red-500"
                        : "text-fb-text-muted"
                  }`}
                >
                  {s.trend.direction === "up" ? (
                    <TrendingUp className="size-3 mr-0.5" />
                  ) : s.trend.direction === "down" ? (
                    <TrendingDown className="size-3 mr-0.5" />
                  ) : (
                    <Minus className="size-3 mr-0.5" />
                  )}
                  {s.trend.value}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
