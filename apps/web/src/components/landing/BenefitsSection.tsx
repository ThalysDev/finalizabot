import { BenefitCard } from "./BenefitCard";
import { Container } from "@/components/primitives";
import { cn } from "@/lib/utils";
import { AuthCTA } from "./AuthCTA";
import { BarChart3, Scale, Target, Smartphone } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface Benefit {
  readonly icon: LucideIcon;
  readonly title: string;
  readonly description: string;
}

const BENEFITS: readonly Benefit[] = [
  {
    icon: BarChart3,
    title: "U5 / U10 na hora",
    description:
      "Consistência recente em segundos: quantas vezes o jogador passou da linha nos últimos 5 e 10 jogos.",
  },
  {
    icon: Scale,
    title: "CV para medir regularidade",
    description:
      "Coeficiente de variação mostra se o volume de finalizações é estável ou arriscado.",
  },
  {
    icon: Target,
    title: "Chutes + Minutos juntos",
    description:
      "Contexto real de volume: séries de chutes e minutos para não tomar decisão no escuro.",
  },
  {
    icon: Smartphone,
    title: "Feito para celular",
    description:
      "Leitura rápida no celular, cards escaneáveis e CTA sempre visível.",
  },
] as const;

function BenefitsSection() {
  return (
    <section
      id="benefits"
      className="relative w-full bg-fb-bg py-16 sm:py-24 lg:py-32 px-4 overflow-hidden"
    >
      {/* Background effects */}
      <div className="absolute inset-0 dot-grid opacity-20" />
      <div className="absolute top-0 left-1/2 h-[300px] w-[300px] -translate-x-1/2 rounded-full bg-fb-primary/5 blur-[100px]" />

      <Container>
        <div className="text-center mb-12 sm:mb-16">
          <span className="animate-fade-up inline-flex items-center rounded-full border border-fb-primary/20 bg-fb-primary/5 px-3 py-1 text-xs font-semibold text-fb-primary mb-4">
            Benefícios
          </span>
          <h2
            className={cn(
              "animate-fade-up delay-100",
              "text-2xl sm:text-3xl lg:text-4xl",
              "font-extrabold",
              "text-fb-text",
              "mb-4",
            )}
          >
            Por que usar FinalizaBOT?
          </h2>
          <p className="animate-fade-up delay-200 text-fb-text-secondary text-base sm:text-lg max-w-2xl mx-auto">
            Métricas objetivas para decidir rápido e com confiança
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
          {BENEFITS.map((benefit, i) => (
            <div
              key={`${benefit.title}-${i}`}
              className={`animate-fade-up delay-${(i + 2) * 100}`}
            >
              <BenefitCard
                icon={benefit.icon}
                title={benefit.title}
                description={benefit.description}
              />
            </div>
          ))}
        </div>

        <div className="mt-14 sm:mt-18 flex flex-col items-center gap-4 text-center">
          <p className="animate-fade-up text-sm sm:text-base text-fb-text-secondary max-w-xl">
            Pronto para decidir com dados claros? Crie sua conta e teste o fluxo
            completo em minutos.
          </p>
          <div className="animate-fade-up delay-100">
            <AuthCTA variant="inline" />
          </div>
        </div>
      </Container>
    </section>
  );
}

BenefitsSection.displayName = "BenefitsSection";

export { BenefitsSection };
