"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import {
  Diamond,
  Radio,
  SlidersHorizontal,
  Bell,
  BellOff,
  Inbox,
  X,
} from "lucide-react";
import { AlertCard } from "@/components/alerts/AlertCard";
import type { AlertData } from "@/data/types";

/* ============================================================================
   LEAGUE LIST
   ============================================================================ */
const ALL_LEAGUES = [
  "Premier League",
  "La Liga",
  "Bundesliga",
  "Serie A",
  "Ligue 1",
  "Champions League",
];

/* ============================================================================
   PROPS
   ============================================================================ */
interface AlertsContentProps {
  alerts: AlertData[];
}

interface AlertSettingsPayload {
  minRoi: number;
  maxCv: number;
  pushEnabled: boolean;
  emailEnabled: boolean;
  silentMode: boolean;
  leagues: string[];
}

/* ============================================================================
   COMPONENT
   ============================================================================ */
export function AlertsContent({ alerts }: AlertsContentProps) {
  const saveDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [minROI, setMinROI] = useState(0);
  const [maxCV, setMaxCV] = useState(1.0);
  const [selectedLeagues, setSelectedLeagues] = useState<Set<string>>(
    new Set(ALL_LEAGUES),
  );
  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [silentMode, setSilentMode] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [serverSettingsEnabled, setServerSettingsEnabled] = useState(false);
  const [serverSettingsLoaded, setServerSettingsLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadSettings() {
      try {
        const response = await fetch("/api/user/alert-settings", {
          method: "GET",
          cache: "no-store",
          headers: { Accept: "application/json" },
        });

        if (response.status === 401 || response.status === 403) {
          if (!cancelled) setServerSettingsEnabled(false);
          return;
        }

        if (!response.ok) {
          if (!cancelled) setServerSettingsEnabled(false);
          return;
        }

        const payload =
          (await response.json()) as Partial<AlertSettingsPayload>;
        if (cancelled) return;

        if (typeof payload.minRoi === "number") setMinROI(payload.minRoi);
        if (typeof payload.maxCv === "number") setMaxCV(payload.maxCv);
        if (typeof payload.pushEnabled === "boolean") {
          setPushEnabled(payload.pushEnabled);
        }
        if (typeof payload.emailEnabled === "boolean") {
          setEmailEnabled(payload.emailEnabled);
        }
        if (typeof payload.silentMode === "boolean") {
          setSilentMode(payload.silentMode);
        }
        if (Array.isArray(payload.leagues)) {
          const safeLeagues = payload.leagues.filter((league) =>
            ALL_LEAGUES.includes(league),
          );
          setSelectedLeagues(
            safeLeagues.length > 0
              ? new Set(safeLeagues)
              : new Set(ALL_LEAGUES),
          );
        }

        setServerSettingsEnabled(true);
      } catch {
        if (!cancelled) setServerSettingsEnabled(false);
      } finally {
        if (!cancelled) setServerSettingsLoaded(true);
      }
    }

    loadSettings();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!serverSettingsEnabled || !serverSettingsLoaded) return;

    if (saveDebounceRef.current) {
      clearTimeout(saveDebounceRef.current);
    }

    const payload: AlertSettingsPayload = {
      minRoi: minROI,
      maxCv: maxCV,
      pushEnabled,
      emailEnabled,
      silentMode,
      leagues: Array.from(selectedLeagues),
    };

    saveDebounceRef.current = setTimeout(() => {
      void fetch("/api/user/alert-settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });
    }, 600);

    return () => {
      if (saveDebounceRef.current) {
        clearTimeout(saveDebounceRef.current);
      }
    };
  }, [
    minROI,
    maxCV,
    pushEnabled,
    emailEnabled,
    silentMode,
    selectedLeagues,
    serverSettingsEnabled,
    serverSettingsLoaded,
  ]);

  function toggleLeague(league: string) {
    setSelectedLeagues((prev) => {
      const next = new Set(prev);
      if (next.has(league)) {
        next.delete(league);
      } else {
        next.add(league);
      }
      return next;
    });
  }

  const filteredAlerts = useMemo(() => {
    return alerts.filter((a) => {
      if (a.evPercent < minROI) return false;
      // CV-based confidence filter: maxCV controls threshold
      // Lower maxCV = stricter filter (only high confidence)
      if (maxCV < 1.0) {
        if (a.confidence === "low" && maxCV < 0.7) return false;
        if (a.confidence === "medium" && maxCV < 0.5) return false;
        if (a.confidence === "high" && maxCV < 0.3) return false;
      }
      // League filter
      if (a.competition && selectedLeagues.size < ALL_LEAGUES.length) {
        if (!selectedLeagues.has(a.competition)) return false;
      }
      return true;
    });
  }, [alerts, minROI, maxCV, selectedLeagues]);

  const sidebar = (
    <>
      <div className="flex items-center gap-3 mb-6">
        <div className="size-8 rounded-lg bg-fb-primary/20 flex items-center justify-center text-fb-primary">
          <Diamond className="size-5" />
        </div>
        <h3 className="text-fb-text font-bold text-sm">Alertas de Valor</h3>
      </div>

      {/* ROI */}
      <div className="mb-5">
        <label className="text-[10px] text-fb-text-muted uppercase tracking-wider font-medium block mb-2">
          EV Mínimo: {minROI}%
        </label>
        <div className="flex items-center gap-2">
          <span className="text-fb-text text-xs">0%</span>
          <input
            type="range"
            min="0"
            max="30"
            step="1"
            value={minROI}
            onChange={(e) => setMinROI(Number(e.target.value))}
            aria-label="EV mínimo"
            className="flex-1 accent-fb-primary h-1"
          />
          <span className="text-fb-text text-xs">30%</span>
        </div>
      </div>

      {/* CV */}
      <div className="mb-5">
        <label className="text-[10px] text-fb-text-muted uppercase tracking-wider font-medium block mb-2">
          CV Máximo: {maxCV.toFixed(2)}
        </label>
        <div className="flex items-center gap-2">
          <span className="text-fb-text text-xs">0.0</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={maxCV}
            onChange={(e) => setMaxCV(Number(e.target.value))}
            aria-label="CV máximo"
            className="flex-1 accent-fb-primary h-1"
          />
          <span className="text-fb-text text-xs">1.0</span>
        </div>
      </div>

      {/* Leagues */}
      <div className="mb-5">
        <label className="text-[10px] text-fb-text-muted uppercase tracking-wider font-medium block mb-3">
          Ligas
        </label>
        <div className="space-y-2">
          {ALL_LEAGUES.map((league) => (
            <label
              key={league}
              className="flex items-center gap-2 cursor-pointer group"
            >
              <button
                type="button"
                onClick={() => toggleLeague(league)}
                className={`size-4 rounded border transition-colors flex items-center justify-center ${
                  selectedLeagues.has(league)
                    ? "bg-fb-primary border-fb-primary"
                    : "border-fb-border group-hover:border-fb-text-muted"
                }`}
                aria-label={`${league} ${selectedLeagues.has(league) ? "selecionada" : "não selecionada"}`}
              >
                {selectedLeagues.has(league) && (
                  <svg
                    className="size-2.5 text-fb-primary-content"
                    viewBox="0 0 12 12"
                    fill="none"
                  >
                    <path
                      d="M2 6L5 9L10 3"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </button>
              <span className="text-xs text-fb-text-secondary group-hover:text-fb-text transition-colors">
                {league}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Notifications */}
      <div className="mb-5">
        <label className="text-[10px] text-fb-text-muted uppercase tracking-wider font-medium block mb-3">
          Notificações
          <span className="ml-1 text-[9px] text-fb-accent-gold font-normal normal-case">
            (em breve)
          </span>
        </label>
        <div className="space-y-2">
          <NotifToggle
            icon={Bell}
            label="Notificações Push"
            checked={pushEnabled}
            onChange={setPushEnabled}
          />
          <NotifToggle
            icon={Bell}
            label="Alertas por E-mail"
            checked={emailEnabled}
            onChange={setEmailEnabled}
          />
          <NotifToggle
            icon={BellOff}
            label="Modo Silencioso"
            checked={silentMode}
            onChange={setSilentMode}
          />
        </div>
      </div>
    </>
  );

  return (
    <div className="theme-value">
      <div className="flex h-[calc(100vh-57px)]">
        {/* Sidebar — desktop */}
        <aside className="hidden md:block w-72 shrink-0 bg-fb-sidebar border-r border-fb-border p-5 overflow-y-auto scrollbar-hide">
          {sidebar}
        </aside>

        {/* Mobile filter sheet */}
        {mobileFiltersOpen && (
          <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label="Filtros de alertas">
            <div
              className="absolute inset-0 bg-black/60"
              onClick={() => setMobileFiltersOpen(false)}
            />
            <div id="alerts-mobile-filters" className="absolute bottom-0 left-0 right-0 bg-fb-bg rounded-t-2xl max-h-[80vh] overflow-y-auto p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-fb-text font-semibold">Filtros</h3>
                <button
                  type="button"
                  onClick={() => setMobileFiltersOpen(false)}
                  className="text-fb-text-muted hover:text-fb-text"
                  aria-label="Fechar filtros"
                >
                  <X className="size-5" />
                </button>
              </div>
              {sidebar}
            </div>
          </div>
        )}

        {/* Main content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-fb-text text-xl font-bold">
                  Oportunidades de Valor
                </h1>
                {filteredAlerts.length > 0 && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-fb-accent-green/10 text-fb-accent-green text-xs font-medium">
                    <Radio className="size-3 animate-pulse" />
                    Ao vivo
                  </div>
                )}
              </div>
              <p className="text-fb-text-muted text-sm">
                {filteredAlerts.length > 0
                  ? `${filteredAlerts.length} de ${alerts.length} oportunidades`
                  : "Nenhuma oportunidade detectada no momento"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setMobileFiltersOpen(true)}
              className="md:hidden flex items-center gap-2 px-3 py-2 bg-fb-surface rounded-lg text-fb-text-secondary text-xs"
              aria-expanded={mobileFiltersOpen}
              aria-controls="alerts-mobile-filters"
            >
              <SlidersHorizontal className="size-4" />
              Filtros
            </button>
          </div>

          {filteredAlerts.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredAlerts.map((alert) => (
                <AlertCard
                  key={`${alert.playerName}-${alert.market}`}
                  {...alert}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="size-16 rounded-full bg-fb-surface flex items-center justify-center mb-4">
                <Inbox className="size-8 text-fb-text-muted" />
              </div>
              <h3 className="text-fb-text font-semibold text-lg mb-2">
                Nenhum alerta disponível
              </h3>
              <p className="text-fb-text-muted text-sm max-w-md">
                {alerts.length > 0
                  ? "Ajuste os filtros para ver mais oportunidades."
                  : "As oportunidades de valor aparecerão aqui quando forem detectadas com base nas análises de mercado."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
   NOTIFICATION TOGGLE
   ============================================================================ */
function NotifToggle({
  icon: Icon,
  label,
  checked,
  onChange,
}: {
  icon: typeof Bell;
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex items-center justify-between w-full"
      role="switch"
      aria-checked={checked}
      aria-label={label}
    >
      <div className="flex items-center gap-2">
        <Icon className="size-3.5 text-fb-text-muted" />
        <span className="text-xs text-fb-text-secondary">{label}</span>
      </div>
      <div
        className={`w-8 h-4 rounded-full relative transition-colors ${
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
