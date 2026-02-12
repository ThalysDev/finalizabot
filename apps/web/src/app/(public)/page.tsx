import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { HeroSection } from "@/components/landing/HeroSection";
import { DemoCard } from "@/components/landing/DemoCard";
import { BenefitsSection } from "@/components/landing/BenefitsSection";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { CTASection } from "@/components/landing/CTASection";
import prisma from "@/lib/db/prisma";

/** Revalidate every 5 minutes — no need to hit DB on every request */
export const revalidate = 300;

/* Force rebuild: Next.js 15 migration */

export default async function LandingPage() {
  const [playerCount, matchCount] = await Promise.all([
    prisma.player.count(),
    prisma.match.count(),
  ]);

  return (
    <>
      <Header />
      <main>
        <HeroSection playerCount={playerCount} matchCount={matchCount} />
        <DemoCard />
        <BenefitsSection />
        <HowItWorks />
        <CTASection />
      </main>
      <Footer />
    </>
  );
}
