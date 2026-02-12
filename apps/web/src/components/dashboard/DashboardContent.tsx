"use client";

import { useState, useMemo } from "react";
import { Calendar, Search, Trophy, ArrowRight } from "lucide-react";
import { MatchCard } from "@/components/match/MatchCard";
import { MatchListItem } from "@/components/match/MatchListItem";
import { ViewSwitcher } from "@/components/dashboard/ViewSwitcher";
import type { MatchCardData } from "@/data/types";

/* ============================================================================
   PROPS
   ============================================================================ */
interface DashboardContentProps {
  matches: MatchCardData[];
  todayCount: number;
  tomorrowCount: number;
  /** Label shown when fallback data is displayed (no today/tomorrow matches) */
  fallbackLabel?: string;
}

/* ============================================================================
   COMPONENT
   ============================================================================ */
export function DashboardContent({
  matches,
  todayCount,
  tomorrowCount,
  fallbackLabel,
}: DashboardContentProps) {
  const [dayFilter, setDayFilter] = useState<"all" | "today" | "tomorrow">("all");
  const [compFilter, setCompFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");

  // Unique competitions for filter tabs
  const competitions = useMemo(() => {
    const comps = new Set(matches.map((m) => m.competition));
    return ["all", ...Array.from(comps)];
  }, [matches]);

  const filteredMatches = useMemo(() => {
    let result = matches;

    if (dayFilter !== "all") {
      result = result.filter((m) => m.dayKey === dayFilter);
    }

    if (compFilter !== "all") {
      result = result.filter((m) => m.competition === compFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (m) =>
          m.homeTeam.toLowerCase().includes(q) ||
          m.awayTeam.toLowerCase().includes(q) ||
          m.competition.toLowerCase().includes(q),
      );
    }

    return result;
  }, [matches, dayFilter, compFilter, searchQuery]);

  // Group matches by competition
  const groupedMatches = useMemo(() => {
    const groups = new Map<string, MatchCardData[]>();
    for (const m of filteredMatches) {
      const key = m.competition;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(m);
    }
    return groups;
  }, [filteredMatches]);

  return (
    <div className="min-h-[calc(100vh-57px)]">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
        {/* ── Header ──────────────────────────────────────────────── */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-fb-text text-xl font-bold flex items-center gap-2">
              <Calendar className="size-5 text-fb-primary" />
              {fallbackLabel ?? "Partidas Hoje e Amanhã"}
            </h1>
            <p className="text-fb-text-muted text-sm mt-1">
              {filteredMatches.length > 0
                ? `${filteredMatches.length} partida${filteredMatches.length !== 1 ? "s" : ""} encontrada${filteredMatches.length !== 1 ? "s" : ""}`
                : "Nenhuma partida encontrada"}
            </p>
          </div>

          {/* View Switcher + Search */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            <ViewSwitcher view={view} onChange={setView} />
            <div className="relative flex-1 md:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-fb-text-muted" />
              <input
                type="text"
                placeholder="Buscar time ou competição..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-fb-surface border border-fb-border/60 rounded-lg text-sm text-fb-text placeholder:text-fb-text-muted focus:outline-none focus:ring-1 focus:ring-fb-primary/50"
              />
            </div>
          </div>
        </div>

        {/* ── Competition filter tabs ─────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <button
            onClick={() => setDayFilter("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              dayFilter === "all"
                ? "bg-fb-primary text-white"
                : "bg-fb-surface text-fb-text-secondary hover:text-fb-text border border-fb-border/40"
            }`}
          >
            Todas ({matches.length})
          </button>
          <button
            onClick={() => setDayFilter("today")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              dayFilter === "today"
                ? "bg-fb-primary text-white"
                : "bg-fb-surface text-fb-text-secondary hover:text-fb-text border border-fb-border/40"
            }`}
          >
            Hoje ({todayCount})
          </button>
          <button
            onClick={() => setDayFilter("tomorrow")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              dayFilter === "tomorrow"
                ? "bg-fb-primary text-white"
                : "bg-fb-surface text-fb-text-secondary hover:text-fb-text border border-fb-border/40"
            }`}
          >
            Amanhã ({tomorrowCount})
          </button>
        </div>

        {/* ── Competition filter tabs ─────────────────────────────── */}
        {competitions.length > 2 && (
          <div className="flex items-center gap-1.5 mb-6 overflow-x-auto pb-1 scrollbar-none">
            {competitions.map((comp) => (
              <button
                key={comp}
                onClick={() => setCompFilter(comp)}
                className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  compFilter === comp
                    ? "bg-fb-primary text-white"
                    : "bg-fb-surface text-fb-text-secondary hover:text-fb-text border border-fb-border/40"
                }`}
              >
                {comp === "all" ? "Todas" : comp}
              </button>
            ))}
          </div>
        )}

        {/* ── Match cards ─────────────────────────────────────────── */}
        {filteredMatches.length > 0 ? (
          <div className="space-y-8">
            {Array.from(groupedMatches.entries()).map(([comp, compMatches]) => (
              <div key={comp}>
                {/* Competition header */}
                <div className="flex items-center gap-2 mb-3">
                  <Trophy className="size-4 text-fb-primary" />
                  <h2
                    className="text-fb-text font-semibold text-sm truncate max-w-[200px] sm:max-w-xs"
                    title={comp}
                  >
                    {comp}
                  </h2>
                  <span className="text-fb-text-muted text-xs whitespace-nowrap">
                    ({compMatches.length} partida
                    {compMatches.length !== 1 ? "s" : ""})
                  </span>
                </div>

                {/* Cards grid or list */}
                {view === "grid" ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {compMatches.map((match) => (
                      <MatchCard key={match.id} {...match} />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {compMatches.map((match) => (
                      <MatchListItem key={match.id} {...match} />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : matches.length > 0 ? (
          /* Filtered to zero */
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="size-16 rounded-full bg-fb-surface flex items-center justify-center mb-4">
              <Search className="size-8 text-fb-text-muted" />
            </div>
            <h3 className="text-fb-text font-semibold text-lg mb-2">
              Nenhum resultado
            </h3>
            <p className="text-fb-text-muted text-sm max-w-md">
              Nenhuma partida corresponde à busca. Tente outro termo.
            </p>
          </div>
        ) : (
          /* No matches at all */
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="size-20 rounded-full bg-linear-to-br from-fb-primary/10 to-fb-surface flex items-center justify-center mb-6">
              <Calendar className="size-10 text-fb-primary" />
            </div>
            <h3 className="text-fb-text font-bold text-xl mb-3">
              Nenhuma partida agendada
            </h3>
            <p className="text-fb-text-muted text-sm max-w-lg mb-6">
              O sync diário descobre automaticamente as partidas do dia e popula
              o banco de dados. Execute o sync manualmente ou aguarde a execução
              programada (3h BRT).
            </p>
            <div className="flex flex-col items-center gap-3">
              <div className="flex items-center gap-2 text-fb-text-muted text-xs">
                <ArrowRight className="size-3.5" />
                <code className="bg-fb-surface px-2 py-1 rounded text-fb-primary">
                  npm run sync
                </code>
                <span>— Sincroniza partidas de hoje</span>
              </div>
              <div className="flex items-center gap-2 text-fb-text-muted text-xs">
                <ArrowRight className="size-3.5" />
                <code className="bg-fb-surface px-2 py-1 rounded text-fb-primary">
                  npm run db:seed
                </code>
                <span>— Cria dados de exemplo</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
