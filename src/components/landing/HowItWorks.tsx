import { Card, Container } from "@/components/primitives";
import { cn } from "@/lib/cn";

interface Step {
  readonly number: string;
  readonly title: string;
  readonly description: string;
  readonly icon: string;
}

/**
 * How It Works Section
 * 3-step process mostrando como usar FinalizaBOT
 */

export function HowItWorks() {
  const steps: readonly Step[] = [
    {
      number: "1",
      icon: "🔍",
      title: "Explore",
      description:
        "Busque qualquer jogador. Veja suas métricas instantaneamente.",
    },
    {
      number: "2",
      icon: "❤️",
      title: "Salve",
      description: "Guarde seus favoritos para acompanhamento semanal.",
    },
    {
      number: "3",
      icon: "✅",
      title: "Aposte com Confiança",
      description: "Baseie suas decisões em dados reais, não em achismo.",
    },
  ] as const;

  return (
    <section
      id="how-it-works"
      className="py-12 sm:py-20 lg:py-28 px-4 bg-white"
    >
      <Container>
        <div className="mb-12 sm:mb-16 text-center">
          <h2
            className={cn(
              "text-2xl sm:text-3xl lg:text-4xl",
              "font-bold",
              "text-neutral-900",
              "mb-4",
            )}
          >
            3 passos simples
          </h2>
          <p className="text-neutral-600 text-base sm:text-lg">
            De zero a apostador profissional em minutos
          </p>
        </div>

        <div className="mx-auto max-w-4xl">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
            {steps.map((step, i) => (
              <div key={`step-${i}`} className="relative">
                {/* Card */}
                <Card
                  variant="default"
                  padding="lg"
                  className="h-full flex flex-col items-start hover:border-blue-300 transition-colors"
                >
                  {/* Number Circle */}
                  <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-lg mb-4">
                    {step.number}
                  </div>

                  {/* Icon */}
                  <div className="text-3xl mb-4">{step.icon}</div>

                  {/* Title */}
                  <h3 className="text-lg font-semibold text-neutral-900 mb-3">
                    {step.title}
                  </h3>

                  {/* Description */}
                  <p className="text-sm text-neutral-600 leading-relaxed">
                    {step.description}
                  </p>
                </Card>

                {/* Connector line (desktop only) */}
                {i < steps.length - 1 && (
                  <div className="hidden sm:block absolute top-1/4 -right-4 w-8 h-0.5 bg-gradient-to-r from-blue-300 to-transparent" />
                )}
              </div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}

HowItWorks.displayName = "HowItWorks";
