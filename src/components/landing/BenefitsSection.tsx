import { BenefitCard } from "./BenefitCard";
import { Container } from "@/components/primitives";
import { cn } from "@/lib/cn";

interface Benefit {
  readonly icon: string;
  readonly title: string;
  readonly description: string;
}

function BenefitsSection() {
  const benefits: readonly Benefit[] = [
    {
      icon: "📊",
      title: "U5 e U10 em Foco",
      description:
        "Veja quantas finalizações cada jogador faz em período recente vs histórico. Claros e atualizados.",
    },
    {
      icon: "📈",
      title: "Série Histórica Completa",
      description:
        "Últimos 10, 20, 30 jogos de forma. Entenda o padrão real do jogador.",
    },
    {
      icon: "⚖️",
      title: "Coeficiente de Variação",
      description:
        "Saiba se o jogador é consistente ou irregular. Avalie o risco da sua aposta.",
    },
  ];

  return (
    <section className="w-full bg-white py-12 sm:py-20 lg:py-28 px-4">
      <Container>
        <div className="text-center mb-12 sm:mb-16">
          <h2
            className={cn(
              "text-2xl sm:text-3xl lg:text-4xl",
              "font-bold",
              "text-neutral-900",
              "mb-4",
            )}
          >
            Por que usar FinalizaBOT?
          </h2>
          <p className="text-neutral-600 text-base sm:text-lg max-w-2xl mx-auto">
            Análise profissional em um só lugar
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {benefits.map((benefit, i) => (
            <BenefitCard
              key={`${benefit.title}-${i}`}
              icon={benefit.icon}
              title={benefit.title}
              description={benefit.description}
            />
          ))}
        </div>
      </Container>
    </section>
  );
}

BenefitsSection.displayName = "BenefitsSection";

export { BenefitsSection };
