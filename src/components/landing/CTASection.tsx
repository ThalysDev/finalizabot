"use client";

import { SignedOut, SignedIn } from "@clerk/nextjs";
import Link from "next/link";
import { Button } from "@/components/primitives";
import { Container } from "@/components/primitives";
import { cn } from "@/lib/cn";

/**
 * CTA Section
 * Call-to-action section final na landing page
 */

export function CTASection() {
  return (
    <section className="relative py-12 sm:py-20 lg:py-28 px-4 overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-600">
      {/* Decorative elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 -right-32 h-64 w-64 rounded-full bg-white blur-3xl" />
        <div className="absolute bottom-0 -left-32 h-64 w-64 rounded-full bg-white blur-3xl" />
      </div>

      <Container className="relative z-10">
        <div className="mx-auto max-w-2xl text-center">
          {/* Heading */}
          <h2
            className={cn(
              "text-2xl sm:text-3xl lg:text-4xl",
              "font-bold",
              "text-white",
              "mb-4",
            )}
          >
            Pronto para começar?
          </h2>

          {/* Subheading */}
          <p
            className={cn(
              "text-base sm:text-lg",
              "text-blue-100",
              "leading-relaxed",
              "mb-8",
            )}
          >
            Acesso gratuito. Nenhum cartão de crédito necessário. Comece a
            analisar jogadores agora.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <SignedOut>
              <Link href="/sign-up">
                <Button
                  size="lg"
                  variant="primary"
                  className="w-full sm:w-auto bg-white text-blue-600 hover:bg-blue-50"
                >
                  Criar Conta Grátis
                </Button>
              </Link>
            </SignedOut>

            <SignedIn>
              <Link href="/dashboard">
                <Button
                  size="lg"
                  variant="primary"
                  className="w-full sm:w-auto bg-white text-blue-600 hover:bg-blue-50"
                >
                  Ir para Dashboard
                </Button>
              </Link>
            </SignedIn>
          </div>

          {/* Secondary text */}
          <p className="text-sm text-blue-50 mt-8">
            ✓ Sem spam • ✓ Sem anúncios • ✓ Dados em tempo real
          </p>
        </div>
      </Container>
    </section>
  );
}

CTASection.displayName = "CTASection";
