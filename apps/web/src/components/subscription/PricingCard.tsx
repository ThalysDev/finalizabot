import { Check, Lock, Zap } from "lucide-react";

/* ============================================================================
   PRICING CARD
   ============================================================================ */
export interface PricingCardProps {
  plan: "free" | "pro";
  price: number;
  period: "mensal" | "anual";
  features: { label: string; included: boolean }[];
  highlighted?: boolean;
  onSelect?: () => void;
}

export function PricingCard({
  plan,
  price,
  period,
  features,
  highlighted = false,
  onSelect,
}: PricingCardProps) {
  const isPro = plan === "pro";
  const annualPrice = period === "anual" ? Math.round(price * 12 * 0.8) : null;

  return (
    <div
      className={`relative rounded-2xl border p-6 md:p-8 transition-all ${
        highlighted
          ? "border-fb-primary bg-fb-card scale-[1.02] shadow-lg shadow-fb-primary/10"
          : "border-fb-border bg-fb-card hover:border-fb-border/80"
      }`}
    >
      {/* Popular badge */}
      {highlighted && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-fb-primary text-fb-primary-content text-xs font-bold rounded-full">
          Mais Popular
        </div>
      )}

      {/* Plan name */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          {isPro && <Zap className="size-5 text-fb-primary" />}
          <h3 className="text-fb-text text-xl font-bold">
            {isPro ? "PRO" : "Gratuito"}
          </h3>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-fb-text text-4xl font-bold">
            R${period === "anual" && isPro ? Math.round(price * 0.8) : price}
          </span>
          <span className="text-fb-text-muted text-sm">/mês</span>
        </div>
        {isPro && period === "anual" && (
          <p className="text-fb-accent-green text-xs mt-1">
            R${annualPrice}/ano — Economize 20%
          </p>
        )}
      </div>

      {/* Features list */}
      <ul className="space-y-3 mb-8">
        {features.map((f, i) => (
          <li key={i} className="flex items-center gap-3">
            {f.included ? (
              <Check className="size-4 text-fb-accent-green shrink-0" />
            ) : (
              <Lock className="size-4 text-fb-text-muted shrink-0" />
            )}
            <span
              className={`text-sm ${
                f.included ? "text-fb-text" : "text-fb-text-muted"
              }`}
            >
              {f.label}
            </span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      <button
        onClick={onSelect}
        className={`w-full py-3 rounded-xl font-bold text-sm transition-colors ${
          isPro
            ? "bg-fb-primary text-fb-primary-content hover:bg-fb-primary-dark"
            : "bg-fb-surface text-fb-text hover:bg-fb-surface-lighter"
        }`}
      >
        {isPro ? "Assinar PRO" : "Plano Atual"}
      </button>
    </div>
  );
}

/* ============================================================================
   GATED OVERLAY
   ============================================================================ */
export interface GatedOverlayProps {
  title?: string;
  description?: string;
  ctaLabel?: string;
  onUpgrade?: () => void;
}

export function GatedOverlay({
  title = "Desbloqueie 500+ jogadores",
  description = "Acesse dados avançados como xG, xA, CV detalhado e alertas de valor em tempo real.",
  ctaLabel = "Upgrade para PRO",
  onUpgrade,
}: GatedOverlayProps) {
  return (
    <div className="absolute bottom-0 left-0 right-0 z-20">
      {/* Gradient fade */}
      <div className="h-40 bg-linear-to-t from-fb-bg via-fb-bg/90 to-transparent" />

      {/* CTA card */}
      <div className="bg-fb-bg pb-8 px-6">
        <div className="max-w-lg mx-auto text-center">
          <div className="inline-flex items-center justify-center size-12 rounded-full bg-fb-primary/10 text-fb-primary mb-4">
            <Lock className="size-6" />
          </div>
          <h3 className="text-fb-text text-xl font-bold mb-2">{title}</h3>
          <p className="text-fb-text-secondary text-sm mb-6">{description}</p>
          <button
            onClick={onUpgrade}
            className="px-8 py-3 bg-fb-primary text-fb-primary-content font-bold text-sm rounded-xl hover:bg-fb-primary-dark transition-colors"
          >
            {ctaLabel}
          </button>
          <p className="text-fb-text-muted text-xs mt-3">
            A partir de R$129/mês • Cancele quando quiser
          </p>
        </div>
      </div>
    </div>
  );
}
