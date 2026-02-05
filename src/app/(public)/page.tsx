import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { HeroSection } from '@/components/landing/HeroSection';
import { DemoCard } from '@/components/landing/DemoCard';
import { BenefitsSection } from '@/components/landing/BenefitsSection';
import { HowItWorks } from '@/components/landing/HowItWorks';
import { CTASection } from '@/components/landing/CTASection';

export default function LandingPage() {
  return (
    <>
      <Header />
      <main>
        <HeroSection />
        <DemoCard />
        <BenefitsSection />
        <HowItWorks />
        <CTASection />
      </main>
      <Footer />
    </>
  );
}
