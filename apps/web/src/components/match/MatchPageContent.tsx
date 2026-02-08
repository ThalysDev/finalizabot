"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  SlidersHorizontal,
  Shield,
  Users,
  TrendingUp,
  Clock,
} from "lucide-react";
import { PlayerCard } from "@/components/player/PlayerCard";
import type { PlayerCardData } from "@/data/types";

/* ============================================================================
   PROPS
   ============================================================================ */
interface MatchPageContentProps {
  match: {
    id: string;
    homeTeam: string;
    awayTeam: string;
    competition: string;
    matchDate: string;
    matchTime: string;
    status: string;
    homeScore?: number | null;
    awayScore?: number | null;
    minute?: number | null;
    isLive?: boolean;
    homeBadgeUrl?: string;
    awayBadgeUrl?: string;
  };
  players: PlayerCardData[];
}

/* ============================================================================
   COMPONENT
   ============================================================================ */
export function MatchPageContent({ match, players }: MatchPageContentProps) {
  const [posFilter, setPosFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"avgShots" | "cv" | "odds">("avgShots");
  const [metric, setMetric] = useState<"shots" | "sot">("shots");
  const lineLabel = formatLine(players[0]?.line ?? 1.5);
  const homeTeamKey = match.homeTeam.toLowerCase();
  const awayTeamKey = match.awayTeam.toLowerCase();

  const filteredPlayers = useMemo(() => {
    let result = [...players];

    // Position filter
    if (posFilter !== "all") {
      const posMap: Record<string, string[]> = {
        forward: ["Atacante", "Forward", "F", "FW", "Ponta", "Centroavante"],
        midfielder: ["Meia", "Midfielder", "M", "MF", "Meio-campo"],
        defender: ["Zagueiro", "Defender", "D", "DF", "Lateral"],
      };
      const accepted = posMap[posFilter] ?? [];
      result = result.filter((p) =>
        accepted.some((a) =>
          p.position.toLowerCase().includes(a.toLowerCase()),
        ),
      );
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === "avgShots") {
        const aVal = metric === "sot" ? (a.avgShotsOnTarget ?? 0) : a.avgShots;
        const bVal = metric === "sot" ? (b.avgShotsOnTarget ?? 0) : b.avgShots;
        return bVal - aVal;
      }
      if (sortBy === "cv") return (a.cv ?? 9) - (b.cv ?? 9); // Lower CV first
      if (sortBy === "odds") return (a.odds || 99) - (b.odds || 99); // Lower odds first
      return 0;
    });

    return result;
  }, [players, posFilter, sortBy]);

  const positionCounts = useMemo(() => {
    const counts = { all: players.length, forward: 0, midfielder: 0, defender: 0 };
    for (const p of players) {
      const pos = p.position.toLowerCase();
      if (["atacante", "forward", "ponta", "centroavante"].some((a) => pos.includes(a)))
        counts.forward++;
      else if (["meia", "midfielder", "meio"].some((a) => pos.includes(a)))
        counts.midfielder++;
      else if (["zagueiro", "defender", "lateral"].some((a) => pos.includes(a)))
        counts.defender++;
    }
    return counts;
  }, [players]);

  return (
    <div className="min-h-[calc(100vh-57px)] bg-fb-bg">
      {/* ── Header Banner ─────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-fb-surface via-fb-surface/90 to-fb-surface border-b border-fb-border/40">
        {/* Back button */}
        <div className="max-w-7xl mx-auto px-4 pt-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-fb-text-muted hover:text-fb-text text-sm transition-colors"
          >
            <ArrowLeft className="size-4" />
            Voltar ao Painel
          </Link>
        </div>

        {/* Match info */}
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            {/* Home */}
            <div className="flex items-center gap-3 flex-1">
              <div className="size-14 rounded-full bg-fb-surface-lighter flex items-center justify-center border border-fb-border/50 overflow-hidden">
                {match.homeBadgeUrl ? (
                  <img
                    src={match.homeBadgeUrl}
                    alt={match.homeTeam}
                    className="size-10 object-contain"
                  />
                ) : (
                  <Shield className="size-7 text-fb-text-muted" />
                )}
              </div>
              <div>
                <h2 className="text-fb-text font-bold text-lg">
                  {match.homeTeam}
                </h2>
                <p className="text-fb-text-muted text-xs">Casa</p>
              </div>
            </div>

            {/* Score / Time */}
            <div className="flex flex-col items-center px-6">
              {match.homeScore != null && match.awayScore != null ? (
                <div className="flex items-center gap-2 text-fb-text font-bold text-2xl">
                  <span>{match.homeScore}</span>
                  <span className="text-fb-text-muted">-</span>
                  <span>{match.awayScore}</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-fb-primary font-bold text-xl">
                  <Clock className="size-4" />
                  {match.matchTime}
                </div>
              )}
              {match.isLive && match.minute != null && (
                <div className="flex items-center gap-1 mt-1">
                  <span className="size-2 rounded-full bg-fb-accent-red animate-pulse" />
                  <span className="text-fb-accent-red text-xs font-bold">
                    {match.minute}&apos;
                  </span>
                </div>
              )}
              <p className="text-fb-text-muted text-[10px] uppercase tracking-wider mt-1">
                {match.competition}
              </p>
              <p className="text-fb-text-muted text-[10px] mt-0.5">
                {match.matchDate}
              </p>
            </div>

            {/* Away */}
            <div className="flex items-center gap-3 flex-1 justify-end">
              <div className="text-right">
                <h2 className="text-fb-text font-bold text-lg">
                  {match.awayTeam}
                </h2>
                <p className="text-fb-text-muted text-xs">Fora</p>
              </div>
              <div className="size-14 rounded-full bg-fb-surface-lighter flex items-center justify-center border border-fb-border/50 overflow-hidden">
                {match.awayBadgeUrl ? (
                  <img
                    src={match.awayBadgeUrl}
                    alt={match.awayTeam}
                    className="size-10 object-contain"
                  />
                ) : (
                  <Shield className="size-7 text-fb-text-muted" />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Content ───────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats bar */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-fb-surface rounded-lg border border-fb-border/40">
            <Users className="size-4 text-fb-primary" />
            <span className="text-fb-text text-sm font-medium">
              {filteredPlayers.length} jogadores
            </span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-fb-surface rounded-lg border border-fb-border/40">
            <TrendingUp className="size-4 text-fb-accent-green" />
            <span className="text-fb-text text-sm font-medium">
              Over {lineLabel} Chutes
            </span>
          </div>
          <div className="flex items-center gap-1 bg-fb-surface rounded-lg border border-fb-border/40 p-1 ml-auto">
            <button
              onClick={() => setMetric("shots")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                metric === "shots"
                  ? "bg-fb-primary/20 text-fb-primary"
                  : "text-fb-text-secondary hover:text-fb-text"
              }`}
            >
              Finalizações/Chutes
            </button>
            <button
              onClick={() => setMetric("sot")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                metric === "sot"
                  ? "bg-fb-primary/20 text-fb-primary"
                  : "text-fb-text-secondary hover:text-fb-text"
              }`}
            >
              No Alvo (Chutes ao gol)
            </button>
          </div>
        </div>

        {/* Filters + Sort row */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          {/* Position filter */}
          <div className="flex items-center gap-1 bg-fb-surface rounded-lg border border-fb-border/40 p-1">
            {(
              [
                { key: "all", label: "Todos" },
                { key: "forward", label: "Atacantes" },
                { key: "midfielder", label: "Meias" },
                { key: "defender", label: "Zagueiros" },
              ] as const
            ).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setPosFilter(key)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  posFilter === key
                    ? "bg-fb-primary text-white"
                    : "text-fb-text-secondary hover:text-fb-text hover:bg-fb-surface-lighter"
                }`}
              >
                {label} ({positionCounts[key]})
              </button>
            ))}
          </div>

          {/* Sort */}
          <div className="flex items-center gap-1 bg-fb-surface rounded-lg border border-fb-border/40 p-1 ml-auto">
            <SlidersHorizontal className="size-3.5 text-fb-text-muted ml-2" />
            {(
              [
                { key: "avgShots", label: "Média Chutes" },
                { key: "cv", label: "CV (menor)" },
                { key: "odds", label: "Odds" },
              ] as const
            ).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setSortBy(key)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  sortBy === key
                    ? "bg-fb-primary/20 text-fb-primary"
                    : "text-fb-text-secondary hover:text-fb-text"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Player cards grid */}
        {filteredPlayers.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredPlayers.map((player) => {
              const avgValue =
                metric === "sot"
                  ? player.avgShotsOnTarget ?? 0
                  : player.avgShots;
              const resolvedBadge =
                player.teamBadgeUrl ??
                resolveBadgeFromMatch(
                  player.team,
                  homeTeamKey,
                  awayTeamKey,
                  match.homeBadgeUrl,
                  match.awayBadgeUrl,
                );
              return (
                <PlayerCard
                  key={player.id}
                  {...player}
                  avgShots={avgValue}
                  avgLabel={
                    metric === "sot" ? "Méd. No Alvo" : "Méd. Finalizações"
                  }
                  teamBadgeUrl={resolvedBadge}
                  playerId={player.id}
                />
              );
            })}
          </div>
        ) : players.length > 0 ? (
          <EmptyFilterState />
        ) : (
          <EmptyPlayersState />
        )}
      </div>
    </div>
  );
}

function resolveBadgeFromMatch(
  team: string,
  homeKey: string,
  awayKey: string,
  homeBadgeUrl?: string,
  awayBadgeUrl?: string,
): string | undefined {
  const teamKey = team.toLowerCase();
  if (teamKey.includes(homeKey)) return homeBadgeUrl;
  if (teamKey.includes(awayKey)) return awayBadgeUrl;
  return undefined;
}

function formatLine(value: number): string {
  return Number.isInteger(value) ? value.toFixed(1) : value.toFixed(1);
}

/* ============================================================================
   EMPTY STATES
   ============================================================================ */

function EmptyFilterState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="size-16 rounded-full bg-fb-surface flex items-center justify-center mb-4">
        <SlidersHorizontal className="size-8 text-fb-text-muted" />
      </div>
      <h3 className="text-fb-text font-semibold text-lg mb-2">
        Nenhum resultado
      </h3>
      <p className="text-fb-text-muted text-sm max-w-md">
        Nenhum jogador corresponde aos filtros atuais. Tente ajustar a posição.
      </p>
    </div>
  );
}

function EmptyPlayersState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="size-16 rounded-full bg-fb-surface flex items-center justify-center mb-4">
        <Users className="size-8 text-fb-text-muted" />
      </div>
      <h3 className="text-fb-text font-semibold text-lg mb-2">
        Dados ainda não disponíveis
      </h3>
      <p className="text-fb-text-muted text-sm max-w-md">
        As escalações e análises para esta partida serão carregados quando o
        sync diário for executado. Volte mais tarde ou execute manualmente:{" "}
        <code className="text-fb-primary bg-fb-surface-lighter px-1.5 py-0.5 rounded text-xs">
          npm run sync
        </code>
      </p>
    </div>
  );
}
