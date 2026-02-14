"use client";

import {
  DataTable,
  SuccessBar,
  StatusCell,
} from "@/components/table/DataTable";
import type { Column } from "@/components/table/DataTable";
import type { AdvancedPlayerRow } from "@/data/types";

const columns: Column<AdvancedPlayerRow>[] = [
  {
    key: "player",
    label: "Jogador",
    sortable: true,
    render: (row) => (
      <div className="flex items-center gap-3">
        <div className="size-8 rounded-full bg-fb-surface-lighter flex items-center justify-center text-fb-text-muted text-xs font-bold shrink-0">
          {row.player.charAt(0)}
        </div>
        <div>
          <p className="text-fb-text font-medium text-sm">{row.player}</p>
          <p className="text-fb-text-muted text-[11px]">{row.team}</p>
        </div>
      </div>
    ),
  },
  {
    key: "position",
    label: "Posição",
    align: "center",
    sortable: true,
    render: (row) => (
      <span className="text-fb-text-muted text-xs uppercase font-medium">
        {row.position}
      </span>
    ),
  },
  {
    key: "line",
    label: "Linha",
    align: "center",
    render: (row) => (
      <span className="text-fb-primary text-xs font-medium">{row.line}</span>
    ),
  },
  {
    key: "odds",
    label: "Odds",
    sortable: true,
    align: "center",
    render: (row) => (
      <div className="flex flex-col items-center gap-0.5">
        <span className="text-fb-text font-bold text-sm">
          {row.odds > 0 ? row.odds.toFixed(2) : "—"}
        </span>
        {row.odds > 0 && (
          <span className="text-[9px] text-fb-text-muted italic">
            (Estimativa)
          </span>
        )}
      </div>
    ),
  },
  {
    key: "l5",
    label: "Últ. 5",
    sortable: true,
    align: "center",
    render: (row) => <SuccessBar hits={row.l5} total={5} />,
  },
  {
    key: "l10",
    label: "Últ. 10",
    sortable: true,
    align: "center",
    render: (row) => <SuccessBar hits={row.l10} total={10} />,
  },
  {
    key: "cv",
    label: "CV",
    sortable: true,
    align: "center",
    render: (row) => (
      <span
        className={`text-xs font-medium ${
          row.cv <= 0.3
            ? "text-fb-accent-green"
            : row.cv <= 0.5
              ? "text-fb-accent-gold"
              : "text-fb-accent-red"
        }`}
      >
        {row.cv.toFixed(2)}
      </span>
    ),
  },
  {
    key: "avgShots",
    label: "Méd. Chutes",
    sortable: true,
    align: "center",
    render: (row) => (
      <span className="text-fb-text text-sm">{row.avgShots.toFixed(1)}</span>
    ),
  },
  {
    key: "avgMins",
    label: "Méd. Min",
    sortable: true,
    align: "center",
    render: (row) => (
      <span className="text-fb-text-secondary text-sm">
        {row.avgMins}&apos;
      </span>
    ),
  },
  {
    key: "status",
    label: "Status",
    align: "center",
    render: (row) => <StatusCell status={row.status} />,
  },
];

interface AdvancedTableClientProps {
  players: AdvancedPlayerRow[];
}

export function AdvancedTableClient({ players }: AdvancedTableClientProps) {
  return (
    <DataTable
      columns={columns}
      data={players}
      rowKey={(row, index) => `${row.player}-${row.team}-${row.position}-${index}`}
      searchPlaceholder="Buscar jogador por nome..."
      filterTabs={[{ label: "Todos", value: "all" }]}
      activeFilter="all"
      pageSize={8}
    />
  );
}
