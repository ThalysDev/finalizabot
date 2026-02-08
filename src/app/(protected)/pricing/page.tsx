"use client";

import { useState } from "react";
import { PricingCard } from "@/components/subscription/PricingCard";
import { Check, Lock, Shield, Star, Zap } from "lucide-react";
import type { PricingFeature, ComparisonRow } from "@/data/types";

const FREE_FEATURES: PricingFeature[] = [
  { label: "Dashboard básico de finalizações", included: true },
  { label: "5 jogadores rastreados", included: true },
  { label: "Últimas 5 partidas", included: true },
  { label: "1 liga disponível", included: true },
  { label: "Alertas ilimitados", included: false },
  { label: "xG e métricas avançadas", included: false },
  { label: "Suporte prioritário", included: false },
];

const PRO_FEATURES: PricingFeature[] = [
  { label: "Dashboard completo + tabelas avançadas", included: true },
  { label: "Jogadores ilimitados", included: true },
  { label: "Últimas 20 partidas + histórico completo", included: true },
  { label: "Todas as ligas (5 grandes + Copa)", included: true },
  { label: "Alertas de valor em tempo real", included: true },
  { label: "xG, xA, CV e métricas avançadas", included: true },
  { label: "Exportação de dados + API", included: true },
  { label: "Suporte prioritário via Discord", included: true },
];

const COMPARISON_ROWS: ComparisonRow[] = [
  { feature: "Jogadores rastreados", free: "5", pro: "Ilimitados" },
  { feature: "Histórico de partidas", free: "Últ. 5", pro: "Últ. 20+" },
  { feature: "Ligas disponíveis", free: "1", pro: "Todas" },
  { feature: "Alertas de valor", free: null, pro: "✓ Tempo real" },
  { feature: "xG / xA", free: null, pro: "✓ Completo" },
  { feature: "Coeficiente de Variação", free: null, pro: "✓ Detalhado" },
  { feature: "Exportação CSV", free: null, pro: "✓ Incluído" },
  { feature: "Suporte", free: "Comunidade", pro: "Prioritário" },
];

export default function PricingPage() {
  const [period, setPeriod] = useState<"mensal" | "anual">("mensal");

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="text-fb-text text-3xl md:text-4xl font-bold mb-3">
          Escolha seu Plano
        </h1>
        <p className="text-fb-text-secondary text-sm md:text-base max-w-xl mx-auto">
          Desbloqueie o potencial completo do FinalizaBOT com dados avançados e
          alertas em tempo real.
        </p>

        {/* Billing toggle */}
        <div className="flex items-center justify-center gap-3 mt-6">
          <button
            onClick={() => setPeriod("mensal")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              period === "mensal"
                ? "bg-fb-primary text-fb-primary-content"
                : "bg-fb-surface text-fb-text-secondary hover:text-fb-text"
            }`}
          >
            Mensal
          </button>
          <button
            onClick={() => setPeriod("anual")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors relative ${
              period === "anual"
                ? "bg-fb-primary text-fb-primary-content"
                : "bg-fb-surface text-fb-text-secondary hover:text-fb-text"
            }`}
          >
            Anual
            <span className="absolute -top-2 -right-3 px-1.5 py-0.5 bg-fb-accent-green text-[9px] font-bold text-black rounded-full">
              -20%
            </span>
          </button>
        </div>
      </div>

      {/* Plan cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        <PricingCard
          plan="free"
          price={0}
          period={period}
          features={FREE_FEATURES}
        />
        <PricingCard
          plan="pro"
          price={129}
          period={period}
          features={PRO_FEATURES}
          highlighted
        />
      </div>

      {/* Comparison table */}
      <div className="rounded-xl border border-fb-border overflow-hidden">
        <div className="bg-fb-surface-darker p-4">
          <h3 className="text-fb-text font-bold text-base">
            Comparação de Recursos
          </h3>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-fb-border bg-fb-surface/50">
              <th className="text-left px-4 py-3 text-fb-text-muted text-xs font-medium uppercase tracking-wider">
                Recurso
              </th>
              <th className="text-center px-4 py-3 text-fb-text-muted text-xs font-medium uppercase tracking-wider">
                Gratuito
              </th>
              <th className="text-center px-4 py-3 text-fb-primary text-xs font-medium uppercase tracking-wider">
                PRO
              </th>
            </tr>
          </thead>
          <tbody>
            {COMPARISON_ROWS.map((row) => (
              <tr
                key={row.feature}
                className="border-b border-fb-border/50 hover:bg-fb-surface/30"
              >
                <td className="px-4 py-3 text-fb-text text-sm">
                  {row.feature}
                </td>
                <td className="px-4 py-3 text-center">
                  {row.free ? (
                    <span className="text-fb-text-secondary text-xs">
                      {row.free}
                    </span>
                  ) : (
                    <Lock className="size-4 text-fb-text-muted mx-auto" />
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="text-fb-accent-green text-xs font-medium">
                    {row.pro}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Trust badges */}
      <div className="flex flex-wrap items-center justify-center gap-6 mt-10 text-fb-text-muted">
        <div className="flex items-center gap-2 text-xs">
          <Shield className="size-4" />
          Pagamento seguro
        </div>
        <div className="flex items-center gap-2 text-xs">
          <Star className="size-4" />
          Cancele quando quiser
        </div>
        <div className="flex items-center gap-2 text-xs">
          <Zap className="size-4" />
          Acesso imediato
        </div>
      </div>
    </div>
  );
}
