/* ============================================================================
   SHOT BAR CHART — Finalizações por jogo (últimos N jogos)
   Built with Recharts for tooltips, responsiveness & accessibility.
   ============================================================================ */

"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Target } from "lucide-react";

export interface ShotBarChartProps {
  data: { label: string; shots: number; sot?: number; line: number }[];
  maxHeight?: number;
  dataKey?: "shots" | "sot";
}

interface ChartPoint {
  label: string;
  shots: number;
  sot?: number;
  line: number;
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{ payload?: ChartPoint }>;
  label?: string | number;
}

/* ---------- Custom tooltip ---------- */
function ChartTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;
  return (
    <div className="bg-fb-bg border border-fb-border rounded-lg px-3 py-2 shadow-lg text-xs">
      <p className="text-fb-text font-bold mb-1">vs {label}</p>
      <p className="text-fb-text-secondary">
        Chutes: <span className="text-fb-text font-semibold">{d.shots}</span>
      </p>
      {d.sot != null && (
        <p className="text-fb-text-secondary">
          No Alvo: <span className="text-fb-text font-semibold">{d.sot}</span>
        </p>
      )}
      <p className="text-fb-text-muted mt-0.5">Linha: {d.line}+</p>
    </div>
  );
}

export function ShotBarChart({
  data,
  maxHeight = 256,
  dataKey = "shots",
}: ShotBarChartProps) {
  // Empty state
  if (!data || data.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center text-center py-12 px-4"
        style={{ minHeight: maxHeight }}
      >
        <div className="size-12 rounded-full bg-fb-surface flex items-center justify-center mb-3">
          <Target className="size-6 text-fb-text-muted" />
        </div>
        <p className="text-fb-text-secondary text-sm font-medium">
          Sem dados de finalizações
        </p>
        <p className="text-fb-text-muted text-xs mt-1">
          Os dados aparecerão após as primeiras partidas analisadas.
        </p>
      </div>
    );
  }

  const lineThreshold = data[0]?.line ?? 0;

  return (
    <div className="w-full" style={{ height: maxHeight }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 20, right: 8, left: -20, bottom: 4 }}
        >
          <XAxis
            dataKey="label"
            tick={{ fill: "var(--fb-text-muted)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "var(--fb-text-muted)", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip
            content={<ChartTooltip />}
            cursor={{ fill: "rgba(255,255,255,0.03)" }}
          />
          {lineThreshold > 0 && (
            <ReferenceLine
              y={lineThreshold}
              stroke="#facc15"
              strokeDasharray="6 3"
              strokeOpacity={0.7}
              label={{
                value: `${lineThreshold}+`,
                position: "right",
                fill: "#facc15",
                fontSize: 10,
                fontWeight: 700,
              }}
            />
          )}
          <Bar dataKey={dataKey} radius={[4, 4, 0, 0]} maxBarSize={40}>
            {data.map((entry, i) => {
              const val = dataKey === "sot" ? (entry.sot ?? 0) : entry.shots;
              const isOver = val >= entry.line;
              return (
                <Cell
                  key={i}
                  fill={
                    isOver
                      ? "var(--fb-primary)"
                      : "var(--fb-primary-muted, rgba(19,236,91,0.35))"
                  }
                />
              );
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ============================================================================
   LINE EVOLUTION CHART — SVG path with gradient fill + grid background
   Matches Stitch mockup: 4x4 grid, gradient area, circle dots with stroke
   ============================================================================ */

export interface LineChartPoint {
  label: string;
  value: number;
}

export interface LineEvolutionChartProps {
  data: LineChartPoint[];
  height?: number;
  color?: string;
}

export function LineEvolutionChart({
  data,
  height = 192,
  color = "#13ec5b",
}: LineEvolutionChartProps) {
  if (data.length < 2) {
    return (
      <div
        className="flex items-center justify-center text-center"
        style={{ height }}
      >
        <p className="text-fb-text-muted text-xs">
          Dados insuficientes para gerar o gráfico de evolução.
        </p>
      </div>
    );
  }

  const chartWidth = 360;
  const chartHeight = height;

  const maxVal = Math.max(...data.map((d) => d.value));
  const minVal = Math.min(...data.map((d) => d.value));
  const range = maxVal - minVal || 1;
  const padding = 0.1 * chartHeight;

  const points = data.map((d, i) => ({
    x: (i / (data.length - 1)) * chartWidth,
    y: padding + (1 - (d.value - minVal) / range) * (chartHeight - padding * 2),
  }));

  const lineD = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");

  const areaD = `${lineD} L ${chartWidth} ${chartHeight} L 0 ${chartHeight} Z`;

  const gradientId = `line-grad-${Math.random().toString(36).slice(2, 8)}`;

  return (
    <div className="relative w-full" style={{ height }}>
      {/* 4x4 Grid background */}
      <div className="absolute inset-0 grid grid-cols-4 grid-rows-4">
        {Array.from({ length: 16 }).map((_, i) => {
          const row = Math.floor(i / 4);
          const col = i % 4;
          return (
            <div
              key={i}
              className={`${row < 3 ? "border-b" : ""} ${col < 3 ? "border-r" : ""} border-white/5`}
            />
          );
        })}
      </div>

      {/* SVG chart */}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        preserveAspectRatio="none"
        role="img"
        aria-label={`Gráfico de evolução: ${data.length} pontos de dados`}
      >
        <title>Evolução de finalizações</title>
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity={0.3} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>

        <path d={areaD} fill={`url(#${gradientId})`} stroke="none" />
        <path
          d={lineD}
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r="3"
            fill="var(--fb-bg)"
            stroke={color}
            strokeWidth="2"
          />
        ))}
      </svg>
    </div>
  );
}
