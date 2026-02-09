import Image from "next/image";
import { TrendingUp, Target, Percent, ArrowRight } from "lucide-react";

export interface AlertCardProps {
  playerName: string;
  playerTeam: string;
  avatarUrl?: string;
  match: string;
  market: string;
  evPercent: number;
  impliedProbability: number;
  fairOdds: number;
  currentOdds: number;
  confidence: "high" | "medium" | "low";
  isHighValue?: boolean;
}

export function AlertCard({
  playerName,
  playerTeam,
  avatarUrl,
  match,
  market,
  evPercent,
  impliedProbability,
  fairOdds,
  currentOdds,
  confidence,
  isHighValue = false,
}: AlertCardProps) {
  return (
    <div
      className={`rounded-xl border bg-fb-card p-5 transition-all hover:shadow-lg ${
        isHighValue
          ? "border-fb-accent-gold/40 shadow-fb-accent-gold/5 animate-gold-glow"
          : "border-fb-border hover:border-fb-primary/30"
      }`}
    >
      {/* High value indicator */}
      {isHighValue && (
        <div className="h-1 w-full bg-linear-to-r from-fb-accent-gold/60 via-fb-accent-gold to-fb-accent-gold/60 rounded-full -mt-3 mb-4" />
      )}

      {/* Player info */}
      <div className="flex items-center gap-3 mb-4">
        <div className="size-12 rounded-full bg-fb-surface flex items-center justify-center overflow-hidden shrink-0">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt={playerName}
              width={48}
              height={48}
              className="size-full object-cover"
              unoptimized
            />
          ) : (
            <span className="text-fb-text-muted text-lg font-bold">
              {playerName.charAt(0)}
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-fb-text font-semibold text-sm">{playerName}</h3>
          <p className="text-fb-text-muted text-xs">{playerTeam}</p>
        </div>
        {isHighValue && (
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-fb-accent-gold/15 text-fb-accent-gold border border-fb-accent-gold/30">
            Alto Valor
          </span>
        )}
      </div>

      {/* Match + market */}
      <div className="mb-4 text-xs text-fb-text-secondary">
        <p>{match}</p>
        <p className="text-fb-text font-medium mt-0.5">{market}</p>
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-fb-surface rounded-lg p-3">
          <div className="flex items-center gap-1.5 text-fb-text-muted text-[10px] uppercase tracking-wider mb-1">
            <TrendingUp className="size-3" />
            Valor Estimado
          </div>
          <p
            className={`text-lg font-bold ${
              evPercent >= 10 ? "text-fb-accent-gold" : "text-fb-accent-green"
            }`}
          >
            +{evPercent.toFixed(1)}%
          </p>
        </div>
        <div className="bg-fb-surface rounded-lg p-3">
          <div className="flex items-center gap-1.5 text-fb-text-muted text-[10px] uppercase tracking-wider mb-1">
            <Percent className="size-3" />
            Prob. Implícita
          </div>
          <p className="text-lg font-bold text-fb-text">
            {impliedProbability}%
          </p>
        </div>
      </div>

      {/* Odds comparison */}
      <div className="flex items-center gap-3 bg-fb-surface rounded-lg p-3 mb-4">
        <div className="flex-1 text-center">
          <p className="text-[10px] text-fb-text-muted uppercase tracking-wider">
            Odds Justa
          </p>
          <p className="text-fb-text font-bold">{fairOdds.toFixed(2)}</p>
        </div>
        <ArrowRight className="size-4 text-fb-primary shrink-0" />
        <div className="flex-1 text-center">
          <p className="text-[10px] text-fb-text-muted uppercase tracking-wider">
            Odds Atual
          </p>
          <p className="text-fb-primary font-bold">{currentOdds.toFixed(2)}</p>
        </div>
      </div>

      {/* Confidence + CTA */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="size-3.5 text-fb-text-muted" />
          <span
            className={`text-xs font-medium ${
              confidence === "high"
                ? "text-fb-accent-green"
                : confidence === "medium"
                  ? "text-fb-accent-gold"
                  : "text-fb-accent-red"
            }`}
          >
            Confiança{" "}
            {confidence === "high"
              ? "Alta"
              : confidence === "medium"
                ? "Média"
                : "Baixa"}
          </span>
        </div>
        <button
          type="button"
          aria-label={`Ver aposta de ${playerName}`}
          onClick={() => window.alert("Integração com casas de apostas em breve!")}
          className="px-4 py-2 bg-fb-primary text-fb-primary-content text-xs font-bold rounded-lg hover:bg-fb-primary-dark transition-colors cursor-pointer"
        >
          Apostar
        </button>
      </div>
    </div>
  );
}
