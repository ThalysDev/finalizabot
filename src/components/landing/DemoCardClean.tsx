import { Container } from "@/components/primitives";
import { cn } from "@/lib/utils";

const DEMO_SHOTS = [2, 7, 0, 5, 6, 4, 7, 7, 2, 0] as const;
const DEMO_MINUTES = [85, 62, 46, 89, 90, 90, 90, 85, 90, 90] as const;

function DemoCard() {
  return (
    <section
      id="demo"
      className="relative w-full bg-fb-bg py-16 sm:py-24 lg:py-32 px-4 overflow-hidden"
    >
      {/* Background effects */}
      <div className="absolute inset-0 dot-grid opacity-30" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-fb-primary/8 blur-[120px] pointer-events-none" />

      <Container>
        <div className="text-center mb-10 sm:mb-14">
          <span className="animate-fade-up inline-flex items-center rounded-full border border-fb-primary/20 bg-fb-primary/5 px-3 py-1 text-xs font-semibold text-fb-primary mb-4">
            Demonstração
          </span>
          <h2
            className={cn(
              "animate-fade-up delay-100",
              "text-2xl sm:text-3xl lg:text-4xl",
              "font-extrabold",
              "text-fb-text",
            )}
          >
            Veja o card do produto em ação
          </h2>
          <p className="animate-fade-up delay-200 text-sm sm:text-base text-fb-text-secondary mt-3 max-w-lg mx-auto">
            Exemplo ilustrativo de mercado de finalizações
          </p>
        </div>

        <div className="animate-scale-in delay-300 mx-auto max-w-3xl">
          <div className="glass-card-value rounded-2xl p-6 sm:p-8 shadow-2xl shadow-fb-primary/5">
            <div className="flex flex-col gap-6">
              {/* Player header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="size-12 rounded-full bg-gradient-to-br from-fb-primary/20 to-fb-accent-green/10 flex items-center justify-center border border-fb-primary/20">
                    <span className="text-fb-primary font-bold text-lg">A</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-fb-text">
                      Alonso Martinez
                    </h3>
                    <p className="text-sm text-fb-text-secondary">
                      Atacante • Costa Rica • EUA x Costa Rica
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold text-fb-primary bg-fb-primary/10 border border-fb-primary/20 px-3 py-1.5 rounded-full">
                    Over 1.5 @ 1.83
                  </span>
                  <span className="text-xs font-semibold text-fb-accent-green bg-fb-accent-green/10 border border-fb-accent-green/20 px-3 py-1.5 rounded-full">
                    Confiança alta
                  </span>
                </div>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-3 gap-3 sm:gap-4">
                <div className="bg-fb-accent-green/8 border border-fb-accent-green/15 p-4 rounded-xl text-center">
                  <p className="text-[10px] text-fb-accent-green font-semibold mb-1 uppercase tracking-wider">
                    U5
                  </p>
                  <p className="text-2xl sm:text-3xl font-bold text-fb-accent-green">
                    4/5
                  </p>
                </div>
                <div className="bg-fb-primary/8 border border-fb-primary/15 p-4 rounded-xl text-center">
                  <p className="text-[10px] text-fb-primary font-semibold mb-1 uppercase tracking-wider">
                    U10
                  </p>
                  <p className="text-2xl sm:text-3xl font-bold text-fb-primary">
                    7/10
                  </p>
                </div>
                <div className="bg-fb-accent-gold/8 border border-fb-accent-gold/15 p-4 rounded-xl text-center">
                  <p className="text-[10px] text-fb-accent-gold font-semibold mb-1 uppercase tracking-wider">
                    CV
                  </p>
                  <p className="text-2xl sm:text-3xl font-bold text-fb-accent-gold">
                    0.24
                  </p>
                </div>
              </div>

              {/* Shot/Minute history */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold text-fb-text-secondary mb-2 uppercase tracking-wider">
                    Chutes (últimos 10)
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {DEMO_SHOTS.map((shot, i) => (
                      <span
                        key={`shot-${i}`}
                        className={cn(
                          "px-2.5 py-1 rounded-lg text-xs font-bold transition-all",
                          shot >= 2
                            ? "bg-fb-accent-green/15 text-fb-accent-green border border-fb-accent-green/20"
                            : "bg-fb-accent-red/15 text-fb-accent-red border border-fb-accent-red/20",
                        )}
                      >
                        {shot}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-fb-text-secondary mb-2 uppercase tracking-wider">
                    Minutos (últimos 10)
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {DEMO_MINUTES.map((min, i) => (
                      <span
                        key={`min-${i}`}
                        className="px-2.5 py-1 rounded-lg text-xs font-bold bg-fb-surface-lighter/60 text-fb-text-secondary border border-fb-border/50"
                      >
                        {min}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Pattern insight */}
              <div className="p-4 bg-fb-primary/5 border border-fb-primary/15 rounded-xl">
                <p className="text-sm text-fb-text-secondary">
                  <strong className="text-fb-primary">Padrão:</strong>{" "}
                  Consistente e acima da linha em 70% dos últimos 10 jogos.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

DemoCard.displayName = "DemoCard";

export { DemoCard };
