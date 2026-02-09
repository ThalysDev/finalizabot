import { Container } from "@/components/primitives";
import { cn } from "@/lib/utils";
import { AuthCTA } from "./AuthCTA";
import { Activity, BarChart3, Shield, TrendingUp, Zap } from "lucide-react";

const HERO_TAGS = [
  { label: "U5/U10 instantâneo", icon: Zap },
  { label: "CV de regularidade", icon: BarChart3 },
  { label: "Chutes + minutos", icon: Activity },
] as const;

interface HeroSectionProps {
  playerCount?: number;
  matchCount?: number;
}

function HeroSection({ playerCount, matchCount }: HeroSectionProps = {}) {
  const displayPlayers =
    playerCount && playerCount > 0
      ? playerCount >= 1000
        ? `${(playerCount / 1000).toFixed(1).replace(/\.0$/, "")}k+`
        : `${playerCount}+`
      : "—";
  const displayMatches =
    matchCount && matchCount > 0 ? `${matchCount}+` : "—";
  return (
    <section className="relative w-full overflow-hidden bg-fb-bg py-16 sm:py-24 lg:py-32">
      {/* Background effects */}
      <div className="absolute inset-0 dot-grid opacity-40" />
      <div className="absolute -top-40 -right-32 h-[500px] w-[500px] rounded-full bg-fb-primary/8 blur-[120px]" />
      <div className="absolute -bottom-40 -left-32 h-[400px] w-[400px] rounded-full bg-fb-accent-green/6 blur-[100px]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-fb-primary/3 blur-[160px]" />

      <Container>
        <div className="relative flex flex-col items-center justify-center text-center">
          {/* Pill badge */}
          <span className="animate-fade-up mb-6 inline-flex items-center gap-2 rounded-full border border-fb-primary/20 bg-fb-primary/5 px-4 py-1.5 text-xs sm:text-sm text-fb-primary font-medium backdrop-blur-sm">
            <Shield className="size-3.5" />
            FinalizaBOT • Props de finalizações
          </span>

          {/* Headline */}
          <h1
            className={cn(
              "animate-fade-up delay-100",
              "text-4xl sm:text-5xl lg:text-6xl xl:text-7xl",
              "font-extrabold",
              "text-fb-text",
              "mb-5 sm:mb-7",
              "tracking-tight leading-[1.1]",
            )}
          >
            Dados de Finalizações para
            <br className="hidden sm:block" />
            <span className="bg-linear-to-r from-fb-primary via-fb-accent-green to-emerald-400 bg-clip-text text-transparent">
              {" "}
              Apostadores Inteligentes
            </span>
          </h1>

          {/* Subtitle */}
          <p
            className={cn(
              "animate-fade-up delay-200",
              "text-base sm:text-lg lg:text-xl",
              "text-fb-text-secondary",
              "mb-8 sm:mb-10",
              "max-w-2xl",
              "leading-relaxed",
            )}
          >
            Veja, em segundos, quem bate linha de finalizações com consistência.
            U5, U10, CV e média de chutes em um card otimizado para celular.
          </p>

          {/* Tags */}
          <div className="animate-fade-up delay-300 flex flex-wrap items-center justify-center gap-3 mb-8">
            {HERO_TAGS.map(({ label, icon: Icon }) => (
              <span
                key={label}
                className="inline-flex items-center gap-2 rounded-xl border border-fb-primary/15 bg-fb-surface/60 backdrop-blur-sm px-4 py-2 text-xs sm:text-sm text-fb-text-secondary font-medium transition-all hover:border-fb-primary/30 hover:bg-fb-primary/5 hover:text-fb-text"
              >
                <Icon className="size-3.5 text-fb-primary" />
                {label}
              </span>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="animate-fade-up delay-400">
            <AuthCTA variant="hero" />
          </div>

          {/* Trust line */}
          <p className="animate-fade-up delay-500 mt-8 flex items-center gap-2 text-xs sm:text-sm text-fb-text-muted">
            <TrendingUp className="size-3.5 text-fb-primary" />
            Dados objetivos para props de finalizações. Sem hype, só
            estatística.
          </p>

          {/* Stats strip */}
          <div className="animate-fade-up delay-600 mt-10 flex items-center gap-6 sm:gap-10">
            {[
              { value: displayPlayers, label: "Jogadores monitorados" },
              { value: displayMatches, label: "Partidas analisadas" },
              { value: "24/7", label: "Atualização" },
            ].map(({ value, label }) => (
              <div key={label} className="text-center">
                <p className="text-xl sm:text-2xl font-bold text-fb-text">
                  {value}
                </p>
                <p className="text-[10px] sm:text-xs text-fb-text-muted uppercase tracking-wider">
                  {label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}

HeroSection.displayName = "HeroSection";

export { HeroSection };
