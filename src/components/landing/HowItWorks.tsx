import { Container } from "@/components/primitives";
import { cn } from "@/lib/utils";
import { Target, BarChart3, CheckCircle2, ArrowRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface Step {
  readonly number: string;
  readonly title: string;
  readonly description: string;
  readonly icon: LucideIcon;
}

const STEPS: readonly Step[] = [
  {
    number: "1",
    icon: Target,
    title: "Escolha a partida",
    description:
      "Selecione o jogo e veja os jogadores com mercados de finalizações.",
  },
  {
    number: "2",
    icon: BarChart3,
    title: "Analise os jogadores",
    description: "U5, U10, CV, chutes e minutos em um card único e claro.",
  },
  {
    number: "3",
    icon: CheckCircle2,
    title: "Tome sua decisão",
    description: "Decida rápido com dados objetivos e consistentes.",
  },
] as const;

/**
 * How It Works Section
 * 3-step process mostrando como usar FinalizaBOT
 */

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="relative py-16 sm:py-24 lg:py-32 px-4 bg-fb-surface-darker overflow-hidden"
    >
      <div className="absolute inset-0 dot-grid opacity-15" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[200px] w-[400px] rounded-full bg-fb-primary/4 blur-[80px]" />

      <Container>
        <div className="relative mb-12 sm:mb-16 text-center">
          <span className="animate-fade-up inline-flex items-center rounded-full border border-fb-primary/20 bg-fb-primary/5 px-3 py-1 text-xs font-semibold text-fb-primary mb-4">
            Como funciona
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
            3 passos simples
          </h2>
          <p className="animate-fade-up delay-200 text-fb-text-secondary text-base sm:text-lg">
            Simples, direto e sem fricção
          </p>
        </div>

        <div className="relative mx-auto max-w-4xl">
          {/* Connector line (desktop) */}
          <div className="hidden sm:block absolute top-16 left-[16%] right-[16%] h-px bg-gradient-to-r from-fb-primary/30 via-fb-primary/15 to-fb-primary/30" />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
            {STEPS.map((step, i) => {
              const Icon = step.icon;
              return (
                <div
                  key={`step-${i}`}
                  className={`animate-fade-up delay-${(i + 2) * 100} relative`}
                >
                  <div className="group h-full flex flex-col items-center text-center rounded-2xl border border-fb-border/60 bg-fb-card/80 backdrop-blur-sm p-6 transition-all duration-300 hover:border-fb-primary/30 hover:shadow-lg hover:shadow-fb-primary/5">
                    {/* Number Circle */}
                    <div className="relative z-10 w-12 h-12 rounded-full bg-gradient-to-br from-fb-primary to-fb-accent-green text-fb-primary-content flex items-center justify-center font-bold text-lg mb-5 shadow-lg shadow-fb-primary/20 transition-transform duration-300 group-hover:scale-110">
                      {step.number}
                    </div>

                    {/* Icon */}
                    <div className="size-10 rounded-xl bg-fb-primary/8 border border-fb-primary/10 flex items-center justify-center mb-4">
                      <Icon className="size-5 text-fb-primary" />
                    </div>

                    {/* Title */}
                    <h3 className="text-lg font-bold text-fb-text mb-3">
                      {step.title}
                    </h3>

                    {/* Description */}
                    <p className="text-sm text-fb-text-secondary leading-relaxed">
                      {step.description}
                    </p>
                  </div>

                  {/* Arrow connector (mobile) */}
                  {i < STEPS.length - 1 && (
                    <div className="sm:hidden flex justify-center py-3">
                      <ArrowRight className="size-5 text-fb-primary/40 rotate-90" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </Container>
    </section>
  );
}

HowItWorks.displayName = "HowItWorks";
