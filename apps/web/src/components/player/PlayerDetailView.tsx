"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  ChevronRight,
  Calendar,
  Shield,
  ExternalLink,
  BarChart3,
  Database,
  DollarSign,
  Target,
} from "lucide-react";
import { calcCV } from "@finalizabot/shared/calc";
import { PlayerHeroCard } from "./PlayerHeroCard";
import { MatchHistoryTable } from "./MatchHistoryTable";

const ShotBarChart = dynamic(
  () =>
    import("@/components/charts/ShotBarChart").then((m) => ({
      default: m.ShotBarChart,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="h-64 bg-fb-surface rounded-xl animate-pulse" />
    ),
  },
);

const LineEvolutionChart = dynamic(
  () =>
    import("@/components/charts/ShotBarChart").then((m) => ({
      default: m.LineEvolutionChart,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="h-48 bg-fb-surface rounded-xl animate-pulse" />
    ),
  },
);
import { formatLine, buildLineIndicator } from "@/lib/helpers";
import type {
  PlayerDetail,
  ShotHistoryPoint,
  LineEvolutionPoint,
  MatchHistoryRow,
  ExternalLinkItem,
} from "@/data/types";
import type { LineHitIndicator, WindowStats } from "@/lib/etl/transformers";

const LINK_ICONS: Record<string, typeof BarChart3> = {
  BarChart3,
  Database,
  DollarSign,
  ExternalLink,
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
  defaultLine?: number;
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
  lineLabel,
  lineIndicator,
  dynamicCV,
  formattedLine,
}: {
  title: string;
  stats: WindowStats;
  lineLabel?: string;
  lineIndicator?: LineHitIndicator;
  dynamicCV?: number | null;
  formattedLine?: string;
}) {
  const midLabel = lineLabel ?? "Over 1.5";
  const midIndicator = lineIndicator ??
    stats?.over15 ?? {
      hits: 0,
      total: 0,
      percent: 0,
    };
  const cvValue = dynamicCV !== undefined ? dynamicCV : stats.cv;

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
            {stats.avgShots != null ? stats.avgShots.toFixed(1) : "—"}
          </p>
        </div>
        <div className="bg-fb-surface-darker rounded-lg p-3 text-center">
          <p className="text-[10px] text-fb-text-muted uppercase tracking-wider">
            Méd. Min
          </p>
          <p className="text-lg font-bold text-fb-text">
            {stats.avgMinutes != null ? `${stats.avgMinutes}'` : "—"}
          </p>
        </div>
        <div className="bg-fb-surface-darker rounded-lg p-3 text-center">
          <p className="text-[10px] text-fb-text-muted uppercase tracking-wider">
            CV
          </p>
          <p
            className={`text-lg font-bold ${
              cvValue != null && cvValue <= 0.3
                ? "text-fb-accent-green"
                : cvValue != null && cvValue <= 0.5
                  ? "text-fb-accent-gold"
                  : "text-fb-accent-red"
            }`}
            title={
              formattedLine
                ? `CV calculado apenas com jogos que bateram ${formattedLine}+`
                : undefined
            }
          >
            {cvValue != null ? cvValue.toFixed(2) : "—"}
          </p>
          {formattedLine && (
            <p className="text-[8px] text-fb-text-muted mt-0.5">
              (jogos ≥{formattedLine})
            </p>
          )}
        </div>
      </div>

      {/* Line hit indicators */}
      <p className="text-[10px] text-fb-text-muted uppercase tracking-wider font-medium mb-2">
        Indicadores de Linha
      </p>
      <div className="grid grid-cols-3 gap-2">
        <LineHitBadge
          label="Over 0.5"
          hits={stats?.over05?.hits ?? 0}
          total={stats?.over05?.total ?? 0}
          percent={stats?.over05?.percent ?? 0}
        />
        <LineHitBadge
          label={midLabel}
          hits={midIndicator?.hits ?? 0}
          total={midIndicator?.total ?? 0}
          percent={midIndicator?.percent ?? 0}
        />
        <LineHitBadge
          label="Over 2.5"
          hits={stats?.over25?.hits ?? 0}
          total={stats?.over25?.total ?? 0}
          percent={stats?.over25?.percent ?? 0}
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
  defaultLine,
}: PlayerDetailViewProps) {
  const [chartMode, setChartMode] = useState<"total" | "alvo">("total");
  const [line, setLine] = useState<number>(
    defaultLine ?? shotHistory[0]?.line ?? 1.5,
  );

  const formattedLine = useMemo(() => formatLine(line), [line]);
  const lineLabel = `Over ${formattedLine}`;
  const derivedMatchHistory = useMemo(
    () => matchHistory.map((row) => ({ ...row, over: row.shots >= line })),
    [matchHistory, line],
  );
  const derivedShotHistory = useMemo(
    () => shotHistory.map((point) => ({ ...point, line })),
    [shotHistory, line],
  );
  const shotValues = useMemo(
    () => shotHistory.map((point) => point.shots),
    [shotHistory],
  );
  const last5LineIndicator = useMemo(
    () => buildLineIndicator(shotValues.slice(-5), line),
    [shotValues, line],
  );
  const last10LineIndicator = useMemo(
    () => buildLineIndicator(shotValues.slice(-10), line),
    [shotValues, line],
  );

  const dynamicCVL5 = useMemo(() => {
    if (!shotValues || shotValues.length < 5) return null;
    const last5 = shotValues.slice(-5);
    const above = last5.filter((s) => s >= line);
    return above.length >= 2 ? calcCV(above) : null;
  }, [shotValues, line]);

  const dynamicCVL10 = useMemo(() => {
    if (!shotValues || shotValues.length < 10) return null;
    const last10 = shotValues.slice(-10);
    const above = last10.filter((s) => s >= line);
    return above.length >= 2 ? calcCV(above) : null;
  }, [shotValues, line]);

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

      <PlayerHeroCard player={player} />

      {/* Linha padrão selector */}
      <div className="bg-fb-card rounded-xl p-4 border border-fb-border mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="text-sm font-semibold text-fb-text">
            Linha padrão:
          </div>
          <div className="flex items-center gap-1 bg-fb-surface-darker rounded-lg p-1">
            {[0.5, 1.5, 2.5].map((value) => (
              <button
                key={value}
                onClick={() => setLine(value)}
                className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                  line === value
                    ? "bg-fb-card text-fb-text shadow-sm"
                    : "text-fb-text-muted hover:text-fb-text"
                }`}
              >
                Over {formatLine(value)}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-xs text-fb-text-muted">Custom:</span>
            <input
              type="number"
              min={0}
              step={0.5}
              value={line}
              onChange={(e) => {
                const next = Number(e.target.value);
                if (!Number.isNaN(next)) setLine(next);
              }}
              className="w-20 bg-fb-surface-darker border border-fb-border rounded-md px-2 py-1 text-xs text-fb-text"
            />
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
                  ? "Finalizações no Alvo (Últimos 10)"
                  : "Finalizações/Chutes por Jogo (Últimos 10)"}
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
                  Finalizações/Chutes
                </button>
                <button
                  onClick={() => setChartMode("alvo")}
                  className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                    chartMode === "alvo"
                      ? "bg-fb-card text-fb-text shadow-sm"
                      : "text-fb-text-muted hover:text-fb-text"
                  }`}
                >
                  No Alvo (Chutes ao gol)
                </button>
              </div>
            </div>

            <ShotBarChart
              data={derivedShotHistory}
              maxHeight={256}
              dataKey={chartMode === "alvo" ? "sot" : "shots"}
            />

            <p className="text-center mt-4 text-xs text-fb-text-muted font-medium">
              Últimas 10 Partidas (Cronológico)
            </p>
          </div>

          <MatchHistoryTable
            matchHistory={derivedMatchHistory}
            lineLabel={formattedLine}
          />
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-6 lg:gap-8">
          {/* L5 / L10 Stats */}
          {last5Stats && (
            <WindowStatsSection
              title="Últimas 5 Partidas"
              stats={last5Stats}
              lineLabel={lineLabel}
              lineIndicator={last5LineIndicator}
              dynamicCV={dynamicCVL5}
              formattedLine={formattedLine}
            />
          )}
          {last10Stats && (
            <WindowStatsSection
              title="Últimas 10 Partidas"
              stats={last10Stats}
              lineLabel={lineLabel}
              lineIndicator={last10LineIndicator}
              dynamicCV={dynamicCVL10}
              formattedLine={formattedLine}
            />
          )}

          {/* Assistências - Em breve */}
          <div className="bg-fb-card rounded-xl p-6 border border-fb-border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-fb-text">Assistências</h3>
              <span className="px-2.5 py-1 text-xs font-semibold bg-yellow-500/20 text-yellow-500 rounded-md">
                Em breve
              </span>
            </div>
            <div className="flex items-center justify-center py-8">
              <p className="text-3xl font-bold text-fb-text-muted">—</p>
            </div>
            <p className="text-xs text-fb-text-muted text-center">
              Dados de assistências em desenvolvimento
            </p>
          </div>

          {!last5Stats && !last10Stats && (
            <div className="bg-fb-card rounded-xl p-6 border border-fb-border text-center">
              <Target className="size-8 text-fb-text-muted mx-auto mb-3" />
              <h3 className="text-base font-bold text-fb-text mb-1">
                Dados estatísticos indisponíveis
              </h3>
              <p className="text-sm text-fb-text-muted">
                Não há dados suficientes para gerar estatísticas por janela.
                Execute o sync para atualizar.
              </p>
            </div>
          )}

          {/* Line evolution chart */}
          <div className="bg-fb-card rounded-xl p-6 border border-fb-border">
            <div className="mb-4">
              <h3 className="text-lg font-bold text-fb-text mb-1">
                Evolução da Linha e Cotação
              </h3>
              <p className="text-sm text-fb-text-secondary">
                Histórico de Fechamento — Mais de {formattedLine} Chutes
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
            <div className="bg-linear-to-br from-fb-surface to-fb-surface-darker rounded-xl p-6 border border-fb-border">
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
                    target="_blank"
                    rel="noopener noreferrer"
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
