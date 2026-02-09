"use client";

import { useState } from "react";
import Link from "next/link";
import {
  X,
  Lock,
  Zap,
  TrendingUp,
  Headphones,
  ShieldCheck,
} from "lucide-react";

/* ============================================================================
   DATA
   ============================================================================ */
const benefits = [
  {
    icon: Zap,
    title: "Alertas em Tempo Real",
    text: "Nunca perca um gol ou mudança de momentum com notificações instantâneas direto no seu dispositivo.",
  },
  {
    icon: TrendingUp,
    title: "Dados de Consistência Exclusivos",
    text: "Identifique jogadores confiáveis com nosso índice de consistência proprietário e gráficos de performance.",
  },
  {
    icon: Headphones,
    title: "Suporte Prioritário",
    text: "Tenha suas dúvidas respondidas primeiro com nossa linha dedicada para membros PRO.",
  },
];

/* ============================================================================
   PAGE
   ============================================================================ */
export default function UpgradePage() {
  const [billing, setBilling] = useState<"mensal" | "anual">("anual");

  const monthlyPrice = 129;
  const yearlyPrice = monthlyPrice * 12 * 0.8; // 20% off = R$1238.40
  const total = billing === "mensal" ? monthlyPrice : Math.round(yearlyPrice);

  return (
    <div className="relative flex min-h-[calc(100vh-57px)] w-full flex-col items-center justify-center p-4">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-fb-primary/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-fb-primary/5 rounded-full blur-[120px]" />
      </div>

      {/* Close button */}
      <Link
        href="/dashboard"
        className="absolute top-6 right-6 p-2 rounded-full hover:bg-white/10 transition-colors text-fb-text-muted hover:text-fb-text z-20"
      >
        <X className="size-5" />
      </Link>

      {/* Main card */}
      <div className="relative w-full max-w-[960px] bg-fb-surface-darker border border-fb-border rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row">
        {/* Left: Benefits */}
        <div className="flex-1 p-8 md:p-10 flex flex-col justify-center border-b md:border-b-0 md:border-r border-fb-border bg-linear-to-br from-fb-surface-darker to-fb-bg">
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-fb-primary/10 border border-fb-primary/20 text-fb-primary text-xs font-bold tracking-wide uppercase mb-4">
              <Lock className="size-3.5" />
              Recurso Bloqueado
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-fb-text leading-tight mb-4">
              Desbloqueie Análises Profissionais
            </h1>
            <p className="text-fb-text-secondary text-base leading-relaxed">
              Você encontrou um recurso PRO. Faça upgrade agora para acessar
              dados em tempo real, estatísticas exclusivas e ganhar a vantagem
              decisiva.
            </p>
          </div>

          <div className="grid gap-6">
            {benefits.map((b) => {
              const Icon = b.icon;
              return (
                <div key={b.title} className="flex gap-4 items-start">
                  <div className="shrink-0 size-10 rounded-lg bg-fb-surface border border-fb-border flex items-center justify-center text-fb-primary">
                    <Icon className="size-5" />
                  </div>
                  <div>
                    <h3 className="text-fb-text font-bold text-sm mb-1">
                      {b.title}
                    </h3>
                    <p className="text-fb-text-muted text-sm leading-relaxed">
                      {b.text}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Plan selector */}
        <div className="w-full md:w-[400px] bg-fb-surface/50 p-8 md:p-10 flex flex-col">
          <h3 className="text-fb-text text-xl font-bold mb-6">
            Escolha seu plano
          </h3>

          <div className="flex flex-col gap-4 flex-1">
            {/* Monthly */}
            <label className="cursor-pointer group">
              <input
                type="radio"
                name="billing"
                className="peer sr-only"
                checked={billing === "mensal"}
                onChange={() => setBilling("mensal")}
              />
              <div
                className={`p-4 rounded-xl border transition-all flex items-center gap-4 ${
                  billing === "mensal"
                    ? "border-fb-primary bg-fb-surface-darker"
                    : "border-fb-border bg-fb-surface-darker hover:border-fb-border/80"
                }`}
              >
                <div
                  className={`size-5 rounded-full border-2 flex items-center justify-center ${
                    billing === "mensal"
                      ? "border-fb-primary bg-fb-primary"
                      : "border-fb-text-muted"
                  }`}
                >
                  {billing === "mensal" && (
                    <span className="size-2 rounded-full bg-fb-bg" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-fb-text">Mensal</span>
                    <span className="font-bold text-fb-text">
                      R${monthlyPrice}
                      <span className="text-fb-text-muted font-normal text-sm">
                        /mês
                      </span>
                    </span>
                  </div>
                  <p className="text-fb-text-muted text-sm mt-1">
                    Flexível, cancele a qualquer momento.
                  </p>
                </div>
              </div>
            </label>

            {/* Annual */}
            <label className="cursor-pointer group">
              <input
                type="radio"
                name="billing"
                className="peer sr-only"
                checked={billing === "anual"}
                onChange={() => setBilling("anual")}
              />
              <div
                className={`relative p-4 rounded-xl border transition-all flex items-center gap-4 ${
                  billing === "anual"
                    ? "border-fb-primary bg-fb-surface-darker shadow-[0_0_15px_-3px_rgba(19,236,91,0.1)]"
                    : "border-fb-border bg-fb-surface-darker hover:border-fb-border/80"
                }`}
              >
                <div className="absolute -top-3 right-4 bg-fb-primary text-fb-primary-content text-xs font-bold px-2 py-1 rounded-md shadow-sm">
                  2 MESES GRÁTIS
                </div>
                <div
                  className={`size-5 rounded-full border-2 flex items-center justify-center ${
                    billing === "anual"
                      ? "border-fb-primary bg-fb-primary"
                      : "border-fb-text-muted"
                  }`}
                >
                  {billing === "anual" && (
                    <span className="size-2 rounded-full bg-fb-bg" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-fb-text">Anual</span>
                    <span className="font-bold text-fb-text">
                      R${total}
                      <span className="text-fb-text-muted font-normal text-sm">
                        /ano
                      </span>
                    </span>
                  </div>
                  <p className="text-fb-text-muted text-sm mt-1">
                    Economize R${monthlyPrice * 12 - total} por ano.
                  </p>
                </div>
              </div>
            </label>

            {/* Checkout */}
            <div className="mt-6 pt-6 border-t border-fb-border">
              <div className="flex justify-between items-end mb-2">
                <span className="text-fb-text-secondary text-sm">
                  Total hoje
                </span>
                <span className="text-3xl font-bold text-fb-text">
                  R${total}
                </span>
              </div>
              <button
                onClick={() => alert("Pagamento será disponibilizado em breve! Você receberá uma notificação quando o checkout estiver ativo.")}
                className="w-full bg-fb-primary hover:brightness-110 text-fb-primary-content font-bold text-base py-4 px-6 rounded-lg transition-all shadow-lg shadow-fb-primary/20 flex items-center justify-center gap-2 mt-4"
              >
                <Lock className="size-5" />
                Upgrade para PRO
              </button>
              <div className="flex items-center justify-center gap-2 mt-4 text-xs text-fb-text-muted">
                <ShieldCheck className="size-3.5" />
                Pagamento seguro via Stripe. Cancele a qualquer momento.
              </div>
            </div>
          </div>

          <div className="mt-auto pt-6 text-center">
            <Link
              href="/dashboard"
              className="text-sm text-fb-text-muted hover:text-fb-text transition-colors underline underline-offset-4"
            >
              Não, obrigado. Ficar no plano gratuito.
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
