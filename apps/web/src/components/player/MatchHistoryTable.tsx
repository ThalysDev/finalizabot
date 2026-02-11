import type { MatchHistoryRow } from "@/data/types";
import { Target } from "lucide-react";

interface MatchHistoryTableProps {
  matchHistory: MatchHistoryRow[];
  lineLabel: string;
}

export function MatchHistoryTable({
  matchHistory,
  lineLabel,
}: MatchHistoryTableProps) {
  // Calculate summary stats
  const totalShots = matchHistory.reduce((acc, row) => acc + row.shots, 0);
  const totalSot = matchHistory.reduce((acc, row) => acc + row.sot, 0);
  const overCount = matchHistory.filter((row) => row.over).length;

  return (
    <div className="bg-fb-card rounded-xl border border-fb-border overflow-hidden">
      <div className="px-6 py-5 border-b border-fb-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-lg font-bold text-fb-text flex items-center gap-2">
            <Target className="size-5 text-fb-primary" />
            Histórico de Partidas
          </h2>
          {matchHistory.length > 0 && (
            <p className="text-xs text-fb-text-muted mt-1">
              {matchHistory.length} jogos • {totalShots} chutes total •{" "}
              {totalSot} no alvo •{" "}
              <span
                className={
                  overCount > matchHistory.length / 2
                    ? "text-fb-accent-green font-medium"
                    : "text-fb-accent-red font-medium"
                }
              >
                {overCount}/{matchHistory.length} OVER
              </span>
            </p>
          )}
        </div>
        <span className="text-xs text-fb-text-muted font-medium flex items-center gap-1 shrink-0">
          {matchHistory.length} jogos analisados
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-fb-text-secondary">
          <thead className="bg-fb-surface-darker text-xs uppercase font-semibold text-fb-text-muted">
            <tr>
              <th className="px-4 sm:px-6 py-4">Data</th>
              <th className="px-4 sm:px-6 py-4">Oponente</th>
              <th className="px-4 sm:px-6 py-4">Resultado</th>
              <th className="px-4 sm:px-6 py-4 text-center hidden sm:table-cell">
                Min.
              </th>
              <th className="px-4 sm:px-6 py-4 text-center">Chutes</th>
              <th className="px-4 sm:px-6 py-4 text-center">No Alvo</th>
              <th className="px-4 sm:px-6 py-4 text-right hidden md:table-cell">
                xG
              </th>
              <th className="px-4 sm:px-6 py-4 text-center hidden lg:table-cell">
                <div className="flex items-center justify-center gap-1.5">
                  <span>Rating</span>
                  <span className="px-1.5 py-0.5 text-[9px] font-semibold bg-yellow-500/20 text-yellow-500 rounded">
                    Em breve
                  </span>
                </div>
              </th>
              <th className="px-4 sm:px-6 py-4 text-center">
                Linha {lineLabel}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-fb-border/50">
            {matchHistory.length === 0 ? (
              <tr>
                <td
                  colSpan={9}
                  className="px-6 py-10 text-center text-sm text-fb-text-muted"
                >
                  Sem histórico disponível
                </td>
              </tr>
            ) : (
              matchHistory.map((row, index) => (
                <tr
                  key={`${row.date}-${row.opponent}-${index}`}
                  className="hover:bg-fb-surface-darker/50 transition-colors"
                >
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap font-medium text-fb-text text-xs sm:text-sm">
                    {row.date}
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div
                        className={`size-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${row.badgeBg} ${row.badgeText}`}
                      >
                        {row.opponent.charAt(0)}
                      </div>
                      <span className="text-fb-text text-xs sm:text-sm truncate max-w-25 sm:max-w-none">
                        {row.opponent}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1 font-bold text-xs sm:text-sm ${
                        row.result.startsWith("V")
                          ? "text-green-500"
                          : row.result.startsWith("D")
                            ? "text-red-500"
                            : row.result.startsWith("E")
                              ? "text-yellow-400"
                              : "text-fb-text-muted"
                      }`}
                    >
                      <span
                        className={`inline-flex items-center justify-center size-5 rounded text-[10px] font-bold ${
                          row.result.startsWith("V")
                            ? "bg-green-500/15"
                            : row.result.startsWith("D")
                              ? "bg-red-500/15"
                              : row.result.startsWith("E")
                                ? "bg-yellow-500/15"
                                : "bg-fb-surface"
                        }`}
                      >
                        {row.result.charAt(0)}
                      </span>
                      <span className="text-fb-text-secondary">
                        {row.result.slice(2)}
                      </span>
                    </span>
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-center hidden sm:table-cell">
                    {row.minutes}
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-center text-fb-text font-bold">
                    {row.shots}
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-center">
                    {row.sot}
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-right hidden md:table-cell">
                    {row.xg}
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-center hidden lg:table-cell text-fb-text-muted">
                    —
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-center">
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
