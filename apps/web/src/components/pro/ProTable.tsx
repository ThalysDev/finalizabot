"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { ChevronUp, ChevronDown, Search } from "lucide-react";
import { StatePanel } from "@/components/ui/StatePanel";
import { STATE_COPY } from "@/lib/copy";
import type { ProPlayerRow } from "@/data/types";

const headers = [
  { key: "rank", label: "#", sortable: false },
  { key: "name", label: "Jogador", sortable: true },
  { key: "matches", label: "Jogos", sortable: true },
  { key: "goals", label: "Gols", sortable: true },
  { key: "assists", label: "Assist.", sortable: true },
  { key: "xg", label: "xG", sortable: true },
  { key: "ev", label: "EV (Pro)", sortable: true },
  { key: "value", label: "Valor Mercado", sortable: true },
];

const positionFilters = [
  "Todos",
  "Atacante",
  "Meio-Campo",
  "Defensor",
  "Goleiro",
];

export function ProTable({ players }: { players: ProPlayerRow[] }) {
  const saveDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [sortKey, setSortKey] = useState<string | null>("ev");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [posFilter, setPosFilter] = useState("Todos");
  const [searchQuery, setSearchQuery] = useState("");
  const [minMatches, setMinMatches] = useState(0);
  const [minEv, setMinEv] = useState(0);
  const [serverPrefsEnabled, setServerPrefsEnabled] = useState(false);
  const [serverPrefsLoaded, setServerPrefsLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadPreferences() {
      try {
        const response = await fetch("/api/user/pro-preferences", {
          method: "GET",
          cache: "no-store",
          headers: { Accept: "application/json" },
        });

        if (response.status === 401 || response.status === 403) {
          if (!cancelled) setServerPrefsEnabled(false);
          return;
        }

        if (!response.ok) {
          if (!cancelled) setServerPrefsEnabled(false);
          return;
        }

        const payload = (await response.json()) as {
          positionFilter?: string;
          sortKey?: string;
          sortDir?: "asc" | "desc";
          minMatches?: number;
          minEv?: number;
          searchQuery?: string;
        };

        if (cancelled) return;

        if (typeof payload.positionFilter === "string") {
          setPosFilter(payload.positionFilter);
        }
        if (typeof payload.sortKey === "string") {
          setSortKey(payload.sortKey);
        }
        if (payload.sortDir === "asc" || payload.sortDir === "desc") {
          setSortDir(payload.sortDir);
        }
        if (typeof payload.minMatches === "number") {
          setMinMatches(payload.minMatches);
        }
        if (typeof payload.minEv === "number") {
          setMinEv(payload.minEv);
        }
        if (typeof payload.searchQuery === "string") {
          setSearchQuery(payload.searchQuery);
        }

        setServerPrefsEnabled(true);
      } catch {
        if (!cancelled) setServerPrefsEnabled(false);
      } finally {
        if (!cancelled) setServerPrefsLoaded(true);
      }
    }

    loadPreferences();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!serverPrefsEnabled || !serverPrefsLoaded) return;

    if (saveDebounceRef.current) {
      clearTimeout(saveDebounceRef.current);
    }

    saveDebounceRef.current = setTimeout(() => {
      void fetch("/api/user/pro-preferences", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          positionFilter: posFilter,
          sortKey: sortKey ?? "ev",
          sortDir,
          minMatches,
          minEv,
          searchQuery,
        }),
      });
    }, 600);

    return () => {
      if (saveDebounceRef.current) {
        clearTimeout(saveDebounceRef.current);
      }
    };
  }, [
    posFilter,
    sortKey,
    sortDir,
    minMatches,
    minEv,
    searchQuery,
    serverPrefsEnabled,
    serverPrefsLoaded,
  ]);

  const toggleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  // Filter by position
  const filtered = useMemo(() => {
    return players.filter((p) => {
      if (p.matches < minMatches) return false;
      if (p.ev < minEv) return false;

      const term = searchQuery.trim().toLowerCase();
      if (term) {
        const haystack = `${p.name} ${p.team}`.toLowerCase();
        if (!haystack.includes(term)) return false;
      }

      if (posFilter === "Todos") return true;

      const pos = p.pos.toLowerCase();
      switch (posFilter) {
        case "Atacante":
          return (
            pos.includes("atacante") ||
            pos.includes("forward") ||
            pos === "fw" ||
            pos === "f" ||
            pos === "st" ||
            pos === "cf" ||
            pos === "lw" ||
            pos === "rw"
          );
        case "Meio-Campo":
          return (
            pos.includes("meio") ||
            pos.includes("midfield") ||
            pos === "mf" ||
            pos === "m" ||
            pos === "cm" ||
            pos === "am" ||
            pos === "dm" ||
            pos === "cdm" ||
            pos === "cam"
          );
        case "Defensor":
          return (
            pos.includes("defensor") ||
            pos.includes("zagueiro") ||
            pos.includes("lateral") ||
            pos.includes("defender") ||
            pos === "df" ||
            pos === "d" ||
            pos === "cb" ||
            pos === "lb" ||
            pos === "rb" ||
            pos === "wb"
          );
        case "Goleiro":
          return (
            pos.includes("goleiro") ||
            pos.includes("goalkeeper") ||
            pos === "gk" ||
            pos === "g"
          );
        default:
          return true;
      }
    });
  }, [players, posFilter, minMatches, minEv, searchQuery]);

  // Sort by selected column
  const sorted = useMemo(() => {
    if (!sortKey) return filtered;

    return [...filtered].sort((a, b) => {
      const aVal = a[sortKey as keyof ProPlayerRow];
      const bVal = b[sortKey as keyof ProPlayerRow];

      // Handle string comparison
      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortDir === "asc"
          ? aVal.localeCompare(bVal, "pt-BR")
          : bVal.localeCompare(aVal, "pt-BR");
      }

      // Handle numeric comparison
      const aNum = Number(aVal) || 0;
      const bNum = Number(bVal) || 0;
      return sortDir === "asc" ? aNum - bNum : bNum - aNum;
    });
  }, [filtered, sortKey, sortDir]);

  return (
    <>
      <div className="px-5 py-3 border-y border-fb-border bg-fb-surface/50 flex flex-wrap gap-3 items-center">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar jogador/time"
          className="px-3 py-1.5 rounded-lg text-xs bg-fb-surface border border-fb-border text-fb-text placeholder:text-fb-text-muted w-48"
        />

        <div className="flex gap-2">
          {positionFilters.map((p) => (
            <button
              key={p}
              onClick={() => setPosFilter(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                posFilter === p
                  ? "bg-fb-primary text-white"
                  : "bg-fb-surface text-fb-text-secondary hover:text-fb-text border border-fb-border"
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        <label className="flex items-center gap-2 text-xs text-fb-text-secondary">
          Min jogos
          <input
            type="number"
            min={0}
            max={100}
            value={minMatches}
            onChange={(e) =>
              setMinMatches(Math.max(0, Number(e.target.value) || 0))
            }
            className="w-16 px-2 py-1 rounded bg-fb-surface border border-fb-border text-fb-text"
          />
        </label>

        <label className="flex items-center gap-2 text-xs text-fb-text-secondary">
          Min EV
          <input
            type="number"
            min={-100}
            max={100}
            value={minEv}
            onChange={(e) =>
              setMinEv(
                Math.max(-100, Math.min(100, Number(e.target.value) || 0)),
              )
            }
            className="w-16 px-2 py-1 rounded bg-fb-surface border border-fb-border text-fb-text"
          />
        </label>

        <button
          onClick={() => {
            setPosFilter("Todos");
            setSortKey("ev");
            setSortDir("desc");
            setMinMatches(0);
            setMinEv(0);
            setSearchQuery("");
          }}
          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-fb-surface text-fb-text-secondary hover:text-fb-text border border-fb-border"
        >
          Limpar
        </button>

        <div className="ml-auto text-sm text-fb-text-muted">
          Exibindo {sorted.length} jogadores
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {sorted.length === 0 ? (
          <StatePanel
            icon={Search}
            title={STATE_COPY.noPlayerFound}
            description="Nenhum jogador atende aos filtros atuais. Ajuste os parâmetros para ampliar os resultados."
            className="py-14"
          />
        ) : (
          <table className="w-full border-collapse text-left text-sm whitespace-nowrap">
            <thead className="bg-fb-surface sticky top-0 z-10 text-[11px] font-semibold text-fb-text-muted uppercase tracking-wider">
              <tr>
                {headers.map((h) => (
                  <th
                    key={h.key}
                    onClick={() => h.sortable && toggleSort(h.key)}
                    className={`p-4 border-b border-fb-border ${
                      h.sortable
                        ? "cursor-pointer hover:text-fb-text select-none"
                        : ""
                    } ${h.key === "xg" || h.key === "ev" ? "bg-fb-primary/5" : ""}`}
                  >
                    <div className="flex items-center gap-1">
                      {h.label}
                      {h.sortable &&
                        sortKey === h.key &&
                        (sortDir === "asc" ? (
                          <ChevronUp className="size-3" />
                        ) : (
                          <ChevronDown className="size-3" />
                        ))}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="text-fb-text divide-y divide-fb-border/50">
              {sorted.map((p, idx) => (
                <tr
                  key={`${p.name}-${idx}`}
                  className="hover:bg-fb-surface/50 transition-colors"
                >
                  <td className="p-4 text-fb-text-muted text-center">
                    {idx + 1}
                  </td>
                  <td className="p-4">
                    <div>
                      <span className="font-bold text-fb-text">{p.name}</span>
                      <span className="block text-[11px] text-fb-text-muted">
                        {p.team} • {p.pos}
                      </span>
                    </div>
                  </td>
                  <td className="p-4 text-right">{p.matches}</td>
                  <td className="p-4 text-right font-bold text-fb-accent-green">
                    {p.goals}
                  </td>
                  <td className="p-4 text-right">{p.assists}</td>
                  <td className="p-4 text-right bg-fb-primary/5 font-medium">
                    {p.xg.toFixed(1)}
                  </td>
                  <td className="p-4 text-right font-bold text-fb-accent-gold bg-fb-accent-gold/5">
                    {p.ev.toFixed(1)}
                  </td>
                  <td className="p-4 text-right font-medium">{p.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
