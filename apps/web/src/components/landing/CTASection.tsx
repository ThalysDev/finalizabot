import { Container } from "@/components/primitives";
import { cn } from "@/lib/utils";
import { AuthCTA } from "./AuthCTA";
import { CheckCircle2 } from "lucide-react";

/**
 * CTA Section
 * Call-to-action section final na landing page
 */

export function CTASection() {
  return (
    <section className="relative py-16 sm:py-24 lg:py-32 px-4 overflow-hidden bg-fb-bg">
      {/* Background effects */}
      <div className="absolute inset-0 dot-grid opacity-20" />
      <div className="absolute top-0 right-0 h-[400px] w-[400px] rounded-full bg-fb-primary/6 blur-[120px]" />
      <div className="absolute bottom-0 left-0 h-[300px] w-[300px] rounded-full bg-fb-accent-green/5 blur-[100px]" />

      <Container className="relative z-10">
        <div className="mx-auto max-w-2xl text-center">
          <div className="glass-card-value rounded-3xl p-8 sm:p-12 shadow-2xl shadow-fb-primary/5">
            {/* Heading */}
            <h2
              className={cn(
                "animate-fade-up",
                "text-3xl sm:text-4xl lg:text-5xl",
                "font-extrabold",
                "text-fb-text",
                "mb-5",
                "tracking-tight leading-[1.1]",
              )}
            >
              Pare de adivinhar.
              <br />
              <span className="bg-gradient-to-r from-fb-primary to-fb-accent-green bg-clip-text text-transparent">
                Decida com dados reais.
              </span>
            </h2>

            {/* Subheading */}
            <p
              className={cn(
                "animate-fade-up delay-100",
                "text-base sm:text-lg",
                "text-fb-text-secondary",
                "leading-relaxed",
                "mb-8",
                "max-w-xl mx-auto",
              )}
            >
              U5, U10 e CV em um único card. Clareza para comparar jogadores em
              segundos.
            </p>

            {/* CTA Buttons */}
            <div className="animate-fade-up delay-200">
              <AuthCTA variant="section" />
            </div>

            {/* Trust indicators */}
            <div className="animate-fade-up delay-300 flex flex-wrap items-center justify-center gap-4 sm:gap-6 mt-8">
              {["Sem hype", "Sem ruído", "Dados objetivos"].map((text) => (
                <span
                  key={text}
                  className="flex items-center gap-1.5 text-sm text-fb-text-secondary"
                >
                  <CheckCircle2 className="size-4 text-fb-primary" />
                  {text}
                </span>
              ))}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

CTASection.displayName = "CTASection";
