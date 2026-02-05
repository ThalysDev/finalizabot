import { Card, Container } from "@/components/primitives";
import { cn } from "@/lib/cn";

function DemoCard() {
  return (
    <section className="w-full bg-neutral-50 py-12 sm:py-20 lg:py-28 px-4">
      <Container>
        <div className="text-center mb-12 sm:mb-16">
          <h2
            className={cn(
              "text-2xl sm:text-3xl lg:text-4xl",
              "font-bold",
              "text-neutral-900",
            )}
          >
            Assim funciona a análise
          </h2>
        </div>

        <div className="mx-auto max-w-2xl">
          <Card variant="elevated" padding="lg">
            <div className="mb-6 pb-6 border-b border-neutral-200">
              <h3 className="text-xl font-bold text-neutral-900">
                Alonso Martinez
              </h3>
              <p className="text-sm text-neutral-600 mt-1">
                Atacante • Costa Rica
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg text-center">
                <p className="text-xs text-neutral-600 font-medium mb-2">U5</p>
                <p className="text-3xl font-bold text-green-600">4/5</p>
                <p className="text-xs text-green-700 mt-1 font-medium">80%</p>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg text-center">
                <p className="text-xs text-neutral-600 font-medium mb-2">U10</p>
                <p className="text-3xl font-bold text-blue-600">7/10</p>
                <p className="text-xs text-blue-700 mt-1 font-medium">70%</p>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg text-center">
                <p className="text-xs text-neutral-600 font-medium mb-2">CV</p>
                <p className="text-3xl font-bold text-purple-600">0.24</p>
                <p className="text-xs text-purple-700 mt-1 font-medium">
                  Baixo
                </p>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-neutral-200">
              <p className="text-xs text-neutral-600 font-medium mb-3">
                Últimos 5 Jogos
              </p>
              <div className="flex gap-2">
                {[1, 1, 0, 1, 1].map((match, i) => (
                  <div
                    key={`match-${i}`}
                    className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center font-semibold text-sm",
                      match
                        ? "bg-green-100 text-green-700 border border-green-300"
                        : "bg-neutral-200 text-neutral-600 border border-neutral-300",
                    )}
                  >
                    {match ? "✓" : "✗"}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-900">
                <strong>Padrão:</strong> Alto e consistente. Jogador finalizou
                em 4 dos últimos 5 jogos.
              </p>
            </div>
          </Card>
        </div>
      </Container>
    </section>
  );
}

DemoCard.displayName = "DemoCard";

export { DemoCard };
