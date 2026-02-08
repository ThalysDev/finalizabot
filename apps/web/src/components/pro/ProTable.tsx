"use client";

import { useState, useMemo } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
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
  const [sortKey, setSortKey] = useState<string | null>("ev");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [posFilter, setPosFilter] = useState("Todos");

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
    if (posFilter === "Todos") return players;
    return players.filter((p) => {
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
  }, [players, posFilter]);

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
        <div className="ml-auto text-sm text-fb-text-muted">
          Exibindo {sorted.length} jogadores
        </div>
      </div>

      <div className="flex-1 overflow-auto">
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
      </div>
    </>
  );
}
