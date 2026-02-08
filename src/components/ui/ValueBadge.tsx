import {
  TrendingUp,
  TrendingDown,
  Minus,
  Snowflake,
  ThermometerSun,
} from "lucide-react";

export type ValueStatus = "high" | "good" | "neutral" | "low" | "cold";

interface ValueBadgeProps {
  status: ValueStatus;
  className?: string;
}

const statusMap: Record<
  ValueStatus,
  { label: string; icon: typeof TrendingUp; classes: string }
> = {
  high: {
    label: "Alto Valor",
    icon: TrendingUp,
    classes:
      "bg-fb-accent-green/15 text-fb-accent-green border-fb-accent-green/30 animate-value-glow",
  },
  good: {
    label: "Bom Valor",
    icon: ThermometerSun,
    classes:
      "bg-fb-accent-green/10 text-fb-accent-green border-fb-accent-green/20",
  },
  neutral: {
    label: "Neutro",
    icon: Minus,
    classes: "bg-fb-surface text-fb-text-secondary border-fb-border",
  },
  low: {
    label: "Baixo Valor",
    icon: TrendingDown,
    classes: "bg-fb-accent-red/10 text-fb-accent-red border-fb-accent-red/30",
  },
  cold: {
    label: "Frio",
    icon: Snowflake,
    classes: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  },
};

export function ValueBadge({ status, className = "" }: ValueBadgeProps) {
  const cfg = statusMap[status];
  const Icon = cfg.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${cfg.classes} ${className}`}
    >
      <Icon className="size-3" />
      {cfg.label}
    </span>
  );
}
