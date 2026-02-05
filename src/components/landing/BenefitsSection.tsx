import { BenefitCard } from "./BenefitCard";

export function BenefitsSection() {
  const benefits = [
    {
      icon: "📊",
      title: "Shots Over/Under em foco",
      description:
        "Veja U5 e U10 de forma clara para cada jogador, atualizados em tempo real.",
    },
    {
      icon: "📈",
      title: "Série histórica clara",
      description:
        "Últimos 10 jogos em visualização imediata. Veja padrões de forma rápida.",
    },
    {
      icon: "⚖️",
      title: "Análise de consistência",
      description:
        "Coeficiente de Variação mostra o quanto o jogador é previsível.",
    },
  ];

  return (
    <section className="py-12 sm:py-16 px-4">
      <div className="container mx-auto max-w-4xl">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-12 text-center">
          Por que usar FinalizaBOT?
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {benefits.map((benefit, i) => (
            <BenefitCard
              key={i}
              icon={benefit.icon}
              title={benefit.title}
              description={benefit.description}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
