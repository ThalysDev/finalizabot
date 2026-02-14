"use client";

import { useState, useEffect, useCallback } from "react";
import { SlidersHorizontal, X, RotateCcw } from "lucide-react";

/* ============================================================================
   FILTER STATE
   ============================================================================ */
export interface FilterState {
  marketType: "shots" | "sot";
  position: string;
  oddsMin: number;
  oddsMax: number;
  cvThreshold: number;
  showOnlyValue: boolean;
}

const DEFAULT_FILTERS: FilterState = {
  marketType: "shots",
  position: "all",
  oddsMin: 1.0,
  oddsMax: 5.0,
  cvThreshold: 1.0,
  showOnlyValue: false,
};

export interface FilterSidebarProps {
  className?: string;
  onFilterChange?: (filters: FilterState) => void;
  initialFilters?: FilterState;
  storageKey?: string;
}

export function FilterSidebar({
  className = "",
  onFilterChange,
  initialFilters,
  storageKey = "fb:filters:global",
}: FilterSidebarProps) {
  const init = initialFilters ?? DEFAULT_FILTERS;
  const [marketType, setMarketType] = useState<"shots" | "sot">(
    init.marketType,
  );
  const [position, setPosition] = useState(init.position);
  const [oddsRange, setOddsRange] = useState([init.oddsMin, init.oddsMax]);
  const [cvThreshold, setCvThreshold] = useState(init.cvThreshold);
  const [showOnlyValue, setShowOnlyValue] = useState(init.showOnlyValue);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(storageKey);
      if (!saved) return;

      const parsed = JSON.parse(saved) as Partial<FilterState>;
      if (parsed.marketType) setMarketType(parsed.marketType);
      if (parsed.position) setPosition(parsed.position);
      if (
        typeof parsed.oddsMin === "number" &&
        typeof parsed.oddsMax === "number"
      ) {
        setOddsRange([parsed.oddsMin, parsed.oddsMax]);
      }
      if (typeof parsed.cvThreshold === "number") {
        setCvThreshold(parsed.cvThreshold);
      }
      if (typeof parsed.showOnlyValue === "boolean") {
        setShowOnlyValue(parsed.showOnlyValue);
      }
    } catch {
      // ignore malformed storage
    }
  }, [storageKey]);

  // Emit filter changes
  const emitFilters = useCallback(() => {
    onFilterChange?.({
      marketType,
      position,
      oddsMin: oddsRange[0],
      oddsMax: oddsRange[1],
      cvThreshold,
      showOnlyValue,
    });
  }, [
    marketType,
    position,
    oddsRange,
    cvThreshold,
    showOnlyValue,
    onFilterChange,
  ]);

  useEffect(() => {
    emitFilters();
  }, [emitFilters]);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        storageKey,
        JSON.stringify({
          marketType,
          position,
          oddsMin: oddsRange[0],
          oddsMax: oddsRange[1],
          cvThreshold,
          showOnlyValue,
        }),
      );
    } catch {
      // storage may be unavailable
    }
  }, [storageKey, marketType, position, oddsRange, cvThreshold, showOnlyValue]);

  function resetFilters() {
    setMarketType(DEFAULT_FILTERS.marketType);
    setPosition(DEFAULT_FILTERS.position);
    setOddsRange([DEFAULT_FILTERS.oddsMin, DEFAULT_FILTERS.oddsMax]);
    setCvThreshold(DEFAULT_FILTERS.cvThreshold);
    setShowOnlyValue(DEFAULT_FILTERS.showOnlyValue);
    try {
      window.localStorage.removeItem(storageKey);
    } catch {
      // ignore
    }
  }

  const positions = [
    { value: "all", label: "Todas" },
    { value: "forward", label: "Atacante" },
    { value: "midfielder", label: "Meia" },
    { value: "defender", label: "Zagueiro" },
  ];

  return (
    <aside
      className={`w-64 shrink-0 bg-fb-sidebar border-r border-fb-border p-4 overflow-y-auto scrollbar-hide ${className}`}
    >
      <div className="flex items-center gap-2 mb-6">
        <SlidersHorizontal className="size-4 text-fb-primary" />
        <h3 className="text-fb-text font-semibold text-sm">Filtros Globais</h3>
      </div>

      {/* Market Type */}
      <div className="mb-5">
        <label className="text-[10px] text-fb-text-muted uppercase tracking-wider font-medium block mb-2">
          Tipo de Mercado
        </label>
        <div className="flex bg-fb-surface rounded-lg p-1">
          <button
            onClick={() => setMarketType("shots")}
            className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
              marketType === "shots"
                ? "bg-fb-primary text-fb-primary-content"
                : "text-fb-text-secondary hover:text-fb-text"
            }`}
          >
            Finalizações
          </button>
          <button
            onClick={() => setMarketType("sot")}
            className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
              marketType === "sot"
                ? "bg-fb-primary text-fb-primary-content"
                : "text-fb-text-secondary hover:text-fb-text"
            }`}
          >
            No Gol
          </button>
        </div>
      </div>

      {/* Position */}
      <div className="mb-5">
        <label className="text-[10px] text-fb-text-muted uppercase tracking-wider font-medium block mb-2">
          Posição
        </label>
        <div className="flex flex-col gap-1.5">
          {positions.map((pos) => (
            <button
              key={pos.value}
              onClick={() => setPosition(pos.value)}
              className={`text-left px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                position === pos.value
                  ? "bg-fb-primary/15 text-fb-primary"
                  : "text-fb-text-secondary hover:text-fb-text hover:bg-fb-surface"
              }`}
            >
              {pos.label}
            </button>
          ))}
        </div>
      </div>

      {/* Odds Range */}
      <div className="mb-5">
        <label className="text-[10px] text-fb-text-muted uppercase tracking-wider font-medium block mb-2">
          Faixa de Odds
        </label>
        <div className="flex items-center gap-2">
          <span className="text-fb-text text-xs font-medium">
            {oddsRange[0].toFixed(1)}
          </span>
          <input
            type="range"
            min="1.0"
            max="5.0"
            step="0.1"
            value={oddsRange[1]}
            onChange={(e) =>
              setOddsRange([oddsRange[0], parseFloat(e.target.value)])
            }
            aria-label="Odds máximas"
            className="flex-1 accent-fb-primary h-1"
          />
          <span className="text-fb-text text-xs font-medium">
            {oddsRange[1].toFixed(1)}
          </span>
        </div>
      </div>

      {/* CV Threshold */}
      <div className="mb-5">
        <label className="text-[10px] text-fb-text-muted uppercase tracking-wider font-medium block mb-2">
          Limite CV
        </label>
        <div className="flex items-center gap-2">
          <span className="text-fb-text text-xs font-medium">0.0</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={cvThreshold}
            onChange={(e) => setCvThreshold(parseFloat(e.target.value))}
            aria-label="Limite de coeficiente de variação"
            className="flex-1 accent-fb-primary h-1"
          />
          <span className="text-fb-text text-xs font-medium">
            {cvThreshold.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Toggles */}
      <div className="space-y-3 mb-5">
        <label className="text-[10px] text-fb-text-muted uppercase tracking-wider font-medium block mb-1">
          Opções
        </label>
        <ToggleSwitch
          label="Apenas com Valor"
          checked={showOnlyValue}
          onChange={setShowOnlyValue}
        />
      </div>

      {/* Reset */}
      <button
        onClick={resetFilters}
        className="w-full flex items-center justify-center gap-2 py-2 text-xs font-medium text-fb-text-muted hover:text-fb-text rounded-lg border border-fb-border/50 hover:bg-fb-surface transition-colors"
      >
        <RotateCcw className="size-3" />
        Limpar Filtros
      </button>
    </aside>
  );
}

/* ============================================================================
   TOGGLE SWITCH
   ============================================================================ */
function ToggleSwitch({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="flex items-center justify-between w-full group"
      role="switch"
      aria-checked={checked}
      aria-label={label}
    >
      <span className="text-xs text-fb-text-secondary group-hover:text-fb-text transition-colors">
        {label}
      </span>
      <div
        className={`w-8 h-4 rounded-full transition-colors relative ${
          checked ? "bg-fb-primary" : "bg-fb-surface-highlight"
        }`}
      >
        <div
          className={`absolute top-0.5 size-3 rounded-full bg-white transition-transform ${
            checked ? "translate-x-4" : "translate-x-0.5"
          }`}
        />
      </div>
    </button>
  );
}

/* ============================================================================
   MOBILE FILTER SHEET (overlay)
   ============================================================================ */
export function MobileFilterSheet({
  open,
  onClose,
  onFilterChange,
}: {
  open: boolean;
  onClose: () => void;
  onFilterChange?: (filters: FilterState) => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="absolute bottom-0 left-0 right-0 bg-fb-bg rounded-t-2xl max-h-[80vh] overflow-y-auto p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-fb-text font-semibold">Filtros</h3>
          <button
            onClick={onClose}
            className="text-fb-text-muted hover:text-fb-text"
          >
            <X className="size-5" />
          </button>
        </div>
        <FilterSidebar
          className="w-full border-none p-0"
          onFilterChange={onFilterChange}
        />
      </div>
    </div>
  );
}
