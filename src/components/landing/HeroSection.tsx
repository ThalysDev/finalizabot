"use client";

import { SignedOut, SignedIn } from "@clerk/nextjs";
import Link from "next/link";
import { Button, Container } from "@/components/primitives";
import { cn } from "@/lib/cn";

function HeroSection() {
  return (
    <section className="relative w-full bg-gradient-to-br from-blue-50 to-indigo-50 py-16 sm:py-24 lg:py-32">
      <Container>
        <div className="flex flex-col items-center justify-center text-center">
          <h1
            className={cn(
              "text-3xl sm:text-4xl lg:text-5xl xl:text-6xl",
              "font-bold",
              "text-neutral-900",
              "mb-4 sm:mb-6",
            )}
          >
            Analise finalizações de jogadores em tempo real
          </h1>
          <p
            className={cn(
              "text-base sm:text-lg lg:text-xl",
              "text-neutral-600",
              "mb-8 sm:mb-12",
              "max-w-2xl",
            )}
          >
            Veja os padrões que os mercados ainda não perceberam. Tome decisões
            baseadas em dados, não em intuição.
          </p>

          <SignedOut>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Link href="/sign-up">
                <Button size="lg" variant="primary">
                  Comece Agora
                </Button>
              </Link>
              <Link href="#how-it-works">
                <Button size="lg" variant="secondary">
                  Ver Demo
                </Button>
              </Link>
            </div>
          </SignedOut>

          <SignedIn>
            <Link href="/dashboard">
              <Button size="lg" variant="primary">
                Ir para Dashboard
              </Button>
            </Link>
          </SignedIn>
        </div>
      </Container>
    </section>
  );
}

HeroSection.displayName = "HeroSection";

export { HeroSection };
