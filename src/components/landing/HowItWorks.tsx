import { Card, CardContent } from "@/components/ui/card";

export function HowItWorks() {
  const steps = [
    {
      number: "1",
      title: "Explore",
      description:
        "Navegue pelos matches e jogadores disponíveis. Veja análises em tempo real.",
    },
    {
      number: "2",
      title: "Salve",
      description:
        "Crie sua lista de favoritos. Acompanhe os jogadores que mais interessam.",
    },
    {
      number: "3",
      title: "Acompanhe",
      description:
        "Receba atualizações dos seus jogadores. Tome decisões com confiança.",
    },
  ];

  return (
    <section className="py-12 sm:py-16 px-4 bg-gray-50">
      <div className="container mx-auto max-w-4xl">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-12 text-center">
          Como funciona?
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {steps.map((step, i) => (
            <div key={i} className="relative">
              <Card className="border-gray-200">
                <CardContent className="pt-8 pb-6">
                  <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg mb-4">
                    {step.number}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {step.title}
                  </h3>
                  <p className="text-sm text-gray-600">{step.description}</p>
                </CardContent>
              </Card>

              {/* Connector line (desktop only) */}
              {i < steps.length - 1 && (
                <div className="hidden sm:block absolute top-1/2 -right-3 w-6 h-0.5 bg-gray-300 transform -translate-y-1/2" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
