"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ChevronRight,
  Star,
  Bell,
  ArrowUpRight,
  Calendar,
  Shield,
  ExternalLink,
  BarChart3,
  Database,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Minus,
  Target,
} from "lucide-react";
import {
  ShotBarChart,
  LineEvolutionChart,
} from "@/components/charts/ShotBarChart";
import type {
  PlayerDetail,
  ShotHistoryPoint,
  LineEvolutionPoint,
  MatchHistoryRow,
  ExternalLinkItem,
} from "@/data/types";
import type { WindowStats } from "@/lib/etl/transformers";

const LINK_ICONS: Record<string, typeof BarChart3> = {
  BarChart3,
  Database,
  DollarSign,
};

/* ============================================================================
   PROPS
   ============================================================================ */
interface PlayerDetailViewProps {
  player: PlayerDetail;
  shotHistory: ShotHistoryPoint[];
  lineEvolution: LineEvolutionPoint[];
  matchHistory: MatchHistoryRow[];
  externalLinks: ExternalLinkItem[];
  last5Stats?: WindowStats;
  last10Stats?: WindowStats;
}

/* ============================================================================
   LINE HIT INDICATOR COMPONENT
   ============================================================================ */
function LineHitBadge({
  label,
  hits,
  total,
  percent,
}: {
  label: string;
  hits: number;
  total: number;
  percent: number;
}) {
  const color =
    percent >= 70
      ? "text-fb-accent-green bg-fb-accent-green/10 border-fb-accent-green/20"
      : percent >= 40
        ? "text-fb-accent-gold bg-fb-accent-gold/10 border-fb-accent-gold/20"
        : "text-fb-accent-red bg-fb-accent-red/10 border-fb-accent-red/20";

  return (
    <div className={`rounded-lg p-3 border ${color}`}>
      <p className="text-[10px] uppercase tracking-wider font-medium opacity-80 mb-1">
        {label}
      </p>
      <p className="text-lg font-bold">
        {hits}/{total}
      </p>
      <div className="w-full h-1 rounded-full bg-white/10 mt-1.5">
        <div
          className="h-full rounded-full bg-current transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

/* ============================================================================
   WINDOW STATS SECTION COMPONENT
   ============================================================================ */
function WindowStatsSection({
  title,
  stats,
}: {
  title: string;
  stats: WindowStats;
}) {
  return (
    <div className="bg-fb-card rounded-xl p-5 border border-fb-border">
      <h3 className="text-base font-bold text-fb-text mb-4 flex items-center gap-2">
        <Target className="size-4 text-fb-primary" />
        {title}
      </h3>

      {/* Key metrics */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-fb-surface-darker rounded-lg p-3 text-center">
          <p className="text-[10px] text-fb-text-muted uppercase tracking-wider">
            Méd. Chutes
          </p>
          <p className="text-lg font-bold text-fb-text">
            {stats.avgShots.toFixed(1)}
          </p>
        </div>
        <div className="bg-fb-surface-darker rounded-lg p-3 text-center">
          <p className="text-[10px] text-fb-text-muted uppercase tracking-wider">
            Méd. Min
          </p>
          <p className="text-lg font-bold text-fb-text">
            {stats.avgMinutes}&apos;
          </p>
        </div>
        <div className="bg-fb-surface-darker rounded-lg p-3 text-center">
          <p className="text-[10px] text-fb-text-muted uppercase tracking-wider">
            CV
          </p>
          <p
            className={`text-lg font-bold ${
              stats.cv != null && stats.cv <= 0.3
                ? "text-fb-accent-green"
                : stats.cv != null && stats.cv <= 0.5
                  ? "text-fb-accent-gold"
                  : "text-fb-accent-red"
            }`}
          >
            {stats.cv != null ? stats.cv.toFixed(2) : "N/A"}
          </p>
        </div>
      </div>

      {/* Line hit indicators */}
      <p className="text-[10px] text-fb-text-muted uppercase tracking-wider font-medium mb-2">
        Indicadores de Linha
      </p>
      <div className="grid grid-cols-3 gap-2">
        <LineHitBadge
          label="Over 0.5"
          hits={stats.over05.hits}
          total={stats.over05.total}
          percent={stats.over05.percent}
        />
        <LineHitBadge
          label="Over 1.5"
          hits={stats.over15.hits}
          total={stats.over15.total}
          percent={stats.over15.percent}
        />
        <LineHitBadge
          label="Over 2.5"
          hits={stats.over25.hits}
          total={stats.over25.total}
          percent={stats.over25.percent}
        />
      </div>
    </div>
  );
}

/* ============================================================================
   CLIENT COMPONENT
   ============================================================================ */
export function PlayerDetailView({
  player,
  shotHistory,
  lineEvolution,
  matchHistory,
  externalLinks,
  last5Stats,
  last10Stats,
}: PlayerDetailViewProps) {
  const [chartMode, setChartMode] = useState<"total" | "alvo">("total");

  // Safe access on trends — avoids crash when trends is empty
  const trend0 = player.trends[0] ?? {
    value: "—",
    direction: "neutral" as const,
  };
  const trend1 = player.trends[1] ?? {
    value: "—",
    direction: "neutral" as const,
  };
  const trend2 = player.trends[2] ?? {
    value: "—",
    direction: "neutral" as const,
  };
  const trend3 = player.trends[3] ?? {
    value: "—",
    direction: "neutral" as const,
  };

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
    <div className="p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-sm text-fb-text-muted mb-6">
        <Link
          href="/dashboard"
          className="hover:text-fb-primary transition-colors"
        >
          Início
        </Link>
        <ChevronRight className="size-3.5" />
        {player.nextMatch?.competition && (
          <>
            <span className="hover:text-fb-primary cursor-pointer transition-colors">
              {player.nextMatch.competition}
            </span>
            <ChevronRight className="size-3.5" />
          </>
        )}
        <span className="text-fb-text font-medium">{player.name}</span>
      </div>

      {/* Player hero card */}
      <div className="bg-fb-card rounded-xl p-6 border border-fb-border mb-8">
        <div className="flex flex-col lg:flex-row gap-8 items-start lg:items-center justify-between">
          {/* Left: avatar + info */}
          <div className="flex gap-5 items-center">
            <div className="relative shrink-0">
              <div className="size-28 md:size-32 rounded-full overflow-hidden border-4 border-fb-surface-darker bg-fb-surface">
                <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-fb-text-muted">
                  {player.name.charAt(0)}
                </div>
              </div>
              <div className="absolute -bottom-1 -right-1 bg-fb-card rounded-full p-1.5 border border-fb-border shadow-sm">
                <Shield className="size-5 text-fb-primary" />
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
                    <span>{player.team}</span>
                  </>
                )}
              </div>

              <div className="flex items-center gap-3">
                <button className="bg-fb-primary text-fb-primary-content font-bold py-2 px-5 rounded-lg text-sm transition-colors flex items-center gap-2 hover:brightness-110">
                  <Star className="size-4" />
                  Seguir Jogador
                </button>
                <button className="bg-fb-surface-darker hover:brightness-110 text-fb-text font-medium py-2 px-4 rounded-lg text-sm transition-colors border border-fb-border flex items-center gap-2">
                  <Bell className="size-4" />
                  Alertas
                </button>
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

      {/* Main grid: 2/3 left + 1/3 right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Left column */}
        <div className="lg:col-span-2 flex flex-col gap-6 lg:gap-8">
          {/* Shots per game chart */}
          <div className="bg-fb-card rounded-xl p-6 border border-fb-border">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-fb-text">
                {chartMode === "alvo"
                  ? "Chutes no Alvo (Últimos 10)"
                  : "Chutes por Jogo (Últimos 10)"}
              </h2>
              <div className="flex bg-fb-surface-darker rounded-lg p-1">
                <button
                  onClick={() => setChartMode("total")}
                  className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                    chartMode === "total"
                      ? "bg-fb-card text-fb-text shadow-sm"
                      : "text-fb-text-muted hover:text-fb-text"
                  }`}
                >
                  Total de Chutes
                </button>
                <button
                  onClick={() => setChartMode("alvo")}
                  className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                    chartMode === "alvo"
                      ? "bg-fb-card text-fb-text shadow-sm"
                      : "text-fb-text-muted hover:text-fb-text"
                  }`}
                >
                  No Alvo
                </button>
              </div>
            </div>

            <ShotBarChart
              data={shotHistory}
              maxHeight={256}
              dataKey={chartMode === "alvo" ? "sot" : "shots"}
            />

            <p className="text-center mt-4 text-xs text-fb-text-muted font-medium">
              Últimas 10 Partidas (Cronológico)
            </p>
          </div>

          {/* Match history table */}
          <div className="bg-fb-card rounded-xl border border-fb-border overflow-hidden">
            <div className="px-6 py-5 border-b border-fb-border flex justify-between items-center">
              <h2 className="text-lg font-bold text-fb-text">
                Histórico de Partidas
              </h2>
              <button className="text-sm text-fb-primary hover:text-fb-primary/80 font-medium flex items-center gap-1">
                Ver Registro Completo
                <ArrowUpRight className="size-3.5" />
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-fb-text-secondary">
                <thead className="bg-fb-surface-darker text-xs uppercase font-semibold text-fb-text-muted">
                  <tr>
                    <th className="px-6 py-4">Data</th>
                    <th className="px-6 py-4">Oponente</th>
                    <th className="px-6 py-4">Resultado</th>
                    <th className="px-6 py-4 text-center">Minutos Jogados</th>
                    <th className="px-6 py-4 text-center">Chutes Realizados</th>
                    <th className="px-6 py-4 text-center">No Alvo</th>
                    <th className="px-6 py-4 text-right">xG</th>
                    <th className="px-6 py-4 text-center">Linha 1.5</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-fb-border/50">
                  {matchHistory.map((row) => (
                    <tr
                      key={`${row.date}-${row.opponent}`}
                      className="hover:bg-fb-surface-darker/50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-fb-text">
                        {row.date}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div
                            className={`size-6 rounded-full flex items-center justify-center text-[10px] font-bold ${row.badgeBg} ${row.badgeText}`}
                          >
                            {row.opponent.charAt(0)}
                          </div>
                          <span className="text-fb-text">{row.opponent}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`font-bold ${
                            row.result.startsWith("V")
                              ? "text-green-500"
                              : row.result.startsWith("D")
                                ? "text-red-500"
                                : "text-fb-text-muted"
                          }`}
                        >
                          {row.result.charAt(0)}
                        </span>{" "}
                        {row.result.slice(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {row.minutes}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-fb-text font-bold">
                        {row.shots}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {row.sot}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        {row.xg}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${
                            row.over
                              ? "bg-green-500/10 text-green-500 border border-green-500/20"
                              : "bg-red-500/10 text-red-500 border border-red-500/20"
                          }`}
                        >
                          {row.over ? "OVER" : "UNDER"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-6 lg:gap-8">
          {/* L5 / L10 Stats */}
          {last5Stats && (
            <WindowStatsSection title="Últimas 5 Partidas" stats={last5Stats} />
          )}
          {last10Stats && (
            <WindowStatsSection
              title="Últimas 10 Partidas"
              stats={last10Stats}
            />
          )}

          {/* Line evolution chart */}
          <div className="bg-fb-card rounded-xl p-6 border border-fb-border">
            <div className="mb-4">
              <h3 className="text-lg font-bold text-fb-text mb-1">
                Evolução da Linha e Cotação
              </h3>
              <p className="text-sm text-fb-text-secondary">
                Histórico de Fechamento — Mais de 1.5 Chutes
              </p>
            </div>

            <LineEvolutionChart data={lineEvolution} height={192} />

            <div className="flex justify-between text-xs text-fb-text-muted mt-2">
              <span>{lineEvolution[0]?.label}</span>
              <span>{lineEvolution[lineEvolution.length - 1]?.label}</span>
            </div>

            {player.currentOdds != null && player.currentOdds > 0 && (
              <div className="mt-4 flex items-center justify-between text-sm">
                <span className="text-fb-text-secondary">Cotação Atual:</span>
                <span className="font-bold text-fb-text">
                  {player.currentOdds.toFixed(2)}
                </span>
              </div>
            )}
          </div>

          {/* Next match card */}
          {player.nextMatch && (
            <div className="bg-gradient-to-br from-fb-surface to-fb-surface-darker rounded-xl p-6 border border-fb-border">
              <h3 className="text-fb-text font-bold mb-4 flex items-center gap-2">
                <Calendar className="size-5 text-fb-primary" />
                Próxima Partida
              </h3>
              <div className="flex items-center justify-between mb-4">
                <div className="flex flex-col items-center gap-1">
                  <Shield className="size-10 text-fb-primary" />
                  <span className="text-xs font-bold text-fb-text">
                    {player.teamShort}
                  </span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-xs text-fb-text-muted uppercase font-semibold">
                    VS
                  </span>
                  <span className="text-sm font-bold text-fb-text mt-1">
                    {player.nextMatch.date}
                  </span>
                  <span className="text-xs text-fb-text-muted">
                    {player.nextMatch.time}
                  </span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <div className="size-10 rounded-full bg-fb-surface flex items-center justify-center text-xs font-bold text-fb-text border border-fb-border">
                    {player.nextMatch.opponentShort}
                  </div>
                  <span className="text-xs font-bold text-fb-text">
                    {player.nextMatch.opponentShort}
                  </span>
                </div>
              </div>
              <Link
                href="/dashboard"
                className="block w-full bg-fb-primary text-fb-primary-content font-bold py-2.5 rounded-lg text-sm hover:brightness-110 transition-all text-center"
              >
                Analisar Confronto
              </Link>
            </div>
          )}

          {/* External links */}
          <div className="bg-fb-card rounded-xl p-6 border border-fb-border">
            <h3 className="text-lg font-bold text-fb-text mb-4">
              Fontes Externas
            </h3>
            <div className="flex flex-col gap-3">
              {externalLinks.map((link) => {
                const LinkIcon = LINK_ICONS[link.iconName] || BarChart3;
                return (
                  <a
                    key={link.label}
                    href={link.href}
                    className="flex items-center justify-between p-3 rounded-lg bg-fb-surface-darker hover:brightness-110 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`size-8 rounded flex items-center justify-center ${link.bg} ${link.color}`}
                      >
                        <LinkIcon className="size-4" />
                      </span>
                      <span className="text-sm font-medium text-fb-text-secondary group-hover:text-fb-primary transition-colors">
                        {link.label}
                      </span>
                    </div>
                    <ExternalLink className="size-4 text-fb-text-muted" />
                  </a>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
