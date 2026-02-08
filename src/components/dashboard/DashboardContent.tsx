"use client";

import { useState, useMemo, useCallback } from "react";
import { SlidersHorizontal } from "lucide-react";
import {
  FilterSidebar,
  MobileFilterSheet,
} from "@/components/filters/FilterSidebar";
import type { FilterState } from "@/components/filters/FilterSidebar";
import { MatchBanner } from "@/components/match/MatchBanner";
import { PlayerCard } from "@/components/player/PlayerCard";
import type { PlayerCardData } from "@/data/types";

/* ============================================================================
   PROPS
   ============================================================================ */
interface DashboardContentProps {
  players: PlayerCardData[];
  nextMatch: {
    homeTeam: string;
    awayTeam: string;
    competition: string;
    matchDate: string;
  } | null;
}

/* ============================================================================
   FILTER LOGIC
   ============================================================================ */
function applyFilters(
  players: PlayerCardData[],
  filters: FilterState,
): PlayerCardData[] {
  return players.filter((p) => {
    // Position filter
    if (filters.position !== "all") {
      const posMap: Record<string, string[]> = {
        forward: ["Atacante", "Forward", "F", "FW", "Ponta", "Centroavante"],
        midfielder: ["Meia", "Midfielder", "M", "MF", "Meio-campo"],
        defender: ["Zagueiro", "Defender", "D", "DF", "Lateral"],
      };
      const accepted = posMap[filters.position] ?? [];
      if (!accepted.some((a) => p.position.toLowerCase().includes(a.toLowerCase()))) {
        return false;
      }
    }

    // Odds range filter
    if (p.odds > 0 && (p.odds < filters.oddsMin || p.odds > filters.oddsMax)) {
      return false;
    }

    // CV threshold filter
    if (p.cv !== null && p.cv > filters.cvThreshold) {
      return false;
    }

    // Show only value filter (high or good status)
    if (filters.showOnlyValue && p.status !== "high" && p.status !== "good") {
      return false;
    }

    return true;
  });
}

/* ============================================================================
   COMPONENT
   ============================================================================ */
export function DashboardContent({
  players,
  nextMatch,
}: DashboardContentProps) {
  const [filters, setFilters] = useState<FilterState | null>(null);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const handleFilterChange = useCallback((f: FilterState) => {
    setFilters(f);
  }, []);

  const filteredPlayers = useMemo(() => {
    if (!filters) return players;
    return applyFilters(players, filters);
  }, [players, filters]);

  return (
    <div className="flex h-[calc(100vh-57px)]">
      {/* Sidebar — desktop only */}
      <div className="hidden md:block">
        <FilterSidebar onFilterChange={handleFilterChange} />
      </div>

      {/* Mobile filter sheet */}
      <MobileFilterSheet
        open={mobileFiltersOpen}
        onClose={() => setMobileFiltersOpen(false)}
        onFilterChange={handleFilterChange}
      />

      {/* Main content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6">
        {/* Match banner */}
        {nextMatch && (
          <MatchBanner
            homeTeam={nextMatch.homeTeam}
            awayTeam={nextMatch.awayTeam}
            competition={nextMatch.competition}
            matchDate={nextMatch.matchDate}
          />
        )}

        {/* Section header */}
        <div className="flex items-center justify-between mt-6 mb-4">
          <div>
            <h2 className="text-fb-text text-lg font-bold">
              Mercado de Finalizações
            </h2>
            <p className="text-fb-text-muted text-xs mt-0.5">
              {filteredPlayers.length} de {players.length} jogadores
              {filters &&
                filteredPlayers.length !== players.length &&
                " (filtrado)"}
            </p>
          </div>
          {/* Mobile filter trigger */}
          <button
            onClick={() => setMobileFiltersOpen(true)}
            className="md:hidden flex items-center gap-2 px-3 py-2 bg-fb-surface rounded-lg text-fb-text-secondary text-xs font-medium hover:bg-fb-surface-highlight transition-colors"
          >
            <SlidersHorizontal className="size-4" />
            Filtros
          </button>
        </div>

        {/* Player cards grid */}
        {filteredPlayers.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredPlayers.map((player) => (
              <PlayerCard key={player.id} {...player} playerId={player.id} />
            ))}
          </div>
        ) : players.length > 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="size-16 rounded-full bg-fb-surface flex items-center justify-center mb-4">
              <SlidersHorizontal className="size-8 text-fb-text-muted" />
            </div>
            <h3 className="text-fb-text font-semibold text-lg mb-2">
              Nenhum resultado
            </h3>
            <p className="text-fb-text-muted text-sm max-w-md">
              Nenhum jogador corresponde aos filtros atuais. Tente ajustar os
              critérios de busca.
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="size-16 rounded-full bg-fb-surface flex items-center justify-center mb-4">
              <SlidersHorizontal className="size-8 text-fb-text-muted" />
            </div>
            <h3 className="text-fb-text font-semibold text-lg mb-2">
              Nenhum jogador rastreado
            </h3>
            <p className="text-fb-text-muted text-sm max-w-md">
              Adicione jogadores ao sistema para começar a visualizar análises
              de finalizações em tempo real.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
