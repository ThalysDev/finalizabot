import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Planos e Preços - FinalizaBOT",
  description:
    "Escolha seu plano FinalizaBOT e desbloqueie análises avançadas de finalizações",
};

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
