/* ============================================================================
   SHOT BAR CHART — Finalizações por jogo (últimos N jogos)
   Matches Stitch mockup: full-height bg bar, hover tooltips, smooth grow
   ============================================================================ */

import { useId } from "react";

export interface ShotBarChartProps {
  data: { label: string; shots: number; sot?: number; line: number }[];
  maxHeight?: number;
  dataKey?: "shots" | "sot";
}

export function ShotBarChart({
  data,
  maxHeight = 256,
  dataKey = "shots",
}: ShotBarChartProps) {
  const values = data.map((d) => (dataKey === "sot" ? (d.sot ?? 0) : d.shots));
  const maxVal = Math.max(...values, 1);
  // Use the first entry's line as the threshold (they should all be the same)
  const lineThreshold = data.length > 0 ? data[0].line : 0;
  const linePct = lineThreshold > 0 ? (lineThreshold / maxVal) * 100 : 0;

  return (
    <div
      className="w-full"
      role="img"
      aria-label={`Gráfico de barras: ${dataKey === "sot" ? "chutes no alvo" : "finalizações"} por jogo, ${data.length} jogos`}
    >
      <div
        className="flex items-end justify-between gap-2 sm:gap-4 w-full relative"
        style={{ height: maxHeight }}
      >
        {/* Threshold line indicator */}
        {linePct > 0 && linePct <= 100 && (
          <div
            className="absolute left-0 right-0 z-10 pointer-events-none flex items-center"
            style={{ bottom: `${linePct}%` }}
          >
            <div className="w-full border-t-2 border-dashed border-yellow-400/60" />
            <span className="absolute -right-1 -translate-y-1/2 bg-yellow-400/90 text-[9px] font-bold text-black px-1.5 py-0.5 rounded-sm whitespace-nowrap">
              {lineThreshold}+
            </span>
          </div>
        )}

        {data.map((d, i) => {
          const val = dataKey === "sot" ? (d.sot ?? 0) : d.shots;
          const pct = (val / maxVal) * 100;
          const labelSuffix = dataKey === "sot" ? "No Alvo" : "Chute";
          const isOver = val >= d.line;

          return (
            <div
              key={i}
              className="flex flex-col items-center gap-2 flex-1 group"
            >
              {/* Full-height container with bg tint + bar inside */}
              <div className="w-full bg-fb-primary/20 rounded-t-sm relative h-full flex items-end group-hover:bg-fb-primary/30 transition-colors">
                <div
                  className={`w-full rounded-t-sm relative animate-bar-grow ${isOver ? "bg-fb-primary" : "bg-fb-primary/60"}`}
                  style={{
                    height: `${pct}%`,
                    animationDelay: `${i * 60}ms`,
                  }}
                >
                  {/* Value label on top of bar */}
                  <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-bold text-fb-text">
                    {val}
                  </span>
                  {/* Hover tooltip */}
                  <div className="opacity-0 group-hover:opacity-100 absolute -top-10 left-1/2 -translate-x-1/2 bg-fb-bg text-fb-text text-xs py-1 px-2 rounded whitespace-nowrap z-10 transition-opacity pointer-events-none border border-fb-border shadow-lg">
                    {val} {labelSuffix}
                    {val !== 1 ? "s" : ""} vs {d.label}
                  </div>
                </div>
              </div>
              {/* Label */}
              <span className="text-[10px] sm:text-xs text-fb-text-muted font-medium truncate max-w-full">
                {d.label}
              </span>
            </div>
          );
        })}
      </div>
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
  if (data.length < 2) return null;

  const chartWidth = 360;
  const chartHeight = height;

  const maxVal = Math.max(...data.map((d) => d.value));
  const minVal = Math.min(...data.map((d) => d.value));
  const range = maxVal - minVal || 1;
  const padding = 0.1 * chartHeight; // small vertical padding

  const points = data.map((d, i) => ({
    x: (i / (data.length - 1)) * chartWidth,
    y: padding + (1 - (d.value - minVal) / range) * (chartHeight - padding * 2),
  }));

  const lineD = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");

  const areaD = `${lineD} L ${chartWidth} ${chartHeight} L 0 ${chartHeight} Z`;

  const gradientId = useId();

  return (
    <div className="relative w-full" style={{ height }}>
      {/* 4x4 Grid background (matches Stitch) */}
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

        {/* Gradient area under the line */}
        <path d={areaD} fill={`url(#${gradientId})`} stroke="none" />

        {/* Main line */}
        <path
          d={lineD}
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data point dots with dark fill + colored stroke (Stitch style) */}
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
