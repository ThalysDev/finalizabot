"use client";

import { SignedIn, SignedOut } from "@clerk/nextjs";
import Link from "next/link";
import { ArrowRight, Play } from "lucide-react";
import { CTA_COPY, NAV_COPY } from "@/lib/copy/navigation";

/**
 * AuthCTA — Componente unificado de Call-to-Action com auth.
 *
 * Substitui: HeroActions, CTAButtons, BenefitsCtaActions
 *
 * @param variant
 *   - "hero"    → CTA primário + botão secundário "Ver exemplo"
 *   - "section" → CTA primário centralizado (padding maior)
 *   - "inline"  → CTA primário inline (sem wrapper)
 */

type CTAVariant = "hero" | "section" | "inline";

interface AuthCTAProps {
  variant?: CTAVariant;
}

export function AuthCTA({ variant = "inline" }: AuthCTAProps) {
  const primaryClasses =
    "inline-flex items-center justify-center gap-2 text-base font-bold text-fb-primary-content bg-linear-to-r from-fb-primary to-fb-accent-green rounded-xl hover:shadow-xl hover:shadow-fb-primary/25 transition-all duration-300 btn-press";

  const padding = variant === "section" ? "px-8 py-3.5" : "px-7 py-3";

  const wrapperClasses =
    variant === "section"
      ? "flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center"
      : variant === "hero"
        ? "flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto"
        : "";

  const inner = (
    <>
      <SignedOut>
        <Link
          href="/sign-up"
          className={`${variant === "hero" ? "w-full sm:w-auto " : ""}${primaryClasses} ${padding}`}
        >
          {CTA_COPY.createFreeAccount}
          <ArrowRight className="size-4" />
        </Link>

        {variant === "hero" && (
          <Link
            href="#demo"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3 text-base font-medium text-fb-text border border-fb-border hover:border-fb-primary/30 bg-fb-surface/60 backdrop-blur-sm rounded-xl hover:bg-fb-primary/5 transition-all duration-300"
          >
            <Play className="size-4" />
            {CTA_COPY.seeExample}
          </Link>
        )}
      </SignedOut>

      <SignedIn>
        <Link
          href="/dashboard"
          className={`${variant === "hero" ? "w-full sm:w-auto " : ""}${primaryClasses} ${padding}`}
        >
          {NAV_COPY.goToDashboard}
          <ArrowRight className="size-4" />
        </Link>
      </SignedIn>
    </>
  );

  if (wrapperClasses) {
    return <div className={wrapperClasses}>{inner}</div>;
  }

  return inner;
}

AuthCTA.displayName = "AuthCTA";
