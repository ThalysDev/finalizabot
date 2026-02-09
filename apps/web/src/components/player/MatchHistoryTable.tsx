import type { MatchHistoryRow } from "@/data/types";
import { ArrowUpRight } from "lucide-react";

interface MatchHistoryTableProps {
  matchHistory: MatchHistoryRow[];
  lineLabel: string;
}

export function MatchHistoryTable({
  matchHistory,
  lineLabel,
}: MatchHistoryTableProps) {
  return (
    <div className="bg-fb-card rounded-xl border border-fb-border overflow-hidden">
      <div className="px-6 py-5 border-b border-fb-border flex justify-between items-center">
        <h2 className="text-lg font-bold text-fb-text">
          Histórico de Partidas
        </h2>
        <button
          type="button"
          className="text-sm text-fb-text-muted font-medium flex items-center gap-1 cursor-not-allowed"
          aria-disabled="true"
          title="Registro completo em breve"
        >
          Ver Registro Completo
          <ArrowUpRight className="size-3.5" aria-hidden="true" />
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
              <th className="px-6 py-4 text-center">Linha {lineLabel}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-fb-border/50">
            {matchHistory.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="px-6 py-10 text-center text-sm text-fb-text-muted"
                >
                  Sem historico disponivel
                </td>
              </tr>
            ) : (
              matchHistory.map((row) => (
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
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
