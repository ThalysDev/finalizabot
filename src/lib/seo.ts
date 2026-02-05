/**
 * SEO Metadata Configuration
 * Comprehensive metadata for all pages
 */

import type { Metadata } from "next";

export const defaultMetadata: Metadata = {
  title: "FinalizaBOT - Análise de Finalizações em Tempo Real",
  description:
    "Plataforma completa para análise de finalizações de jogadores. Veja padrões, estatísticas e tome decisões baseadas em dados.",
  keywords: [
    "análise de futebol",
    "finalizações",
    "estatísticas",
    "mercado de apostas",
    "dados em tempo real",
  ],
  authors: [{ name: "FinalizaBOT Team" }],
  creator: "FinalizaBOT",
  publisher: "FinalizaBOT",
  robots: "index, follow",
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "https://finalizabot.com",
    siteName: "FinalizaBOT",
    title: "FinalizaBOT - Análise de Finalizações em Tempo Real",
    description:
      "Plataforma completa para análise de finalizações de jogadores. Veja padrões, estatísticas e tome decisões baseadas em dados.",
    images: [
      {
        url: "https://finalizabot.com/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "FinalizaBOT",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "FinalizaBOT - Análise de Finalizações em Tempo Real",
    description:
      "Plataforma completa para análise de finalizações de jogadores. Veja padrões, estatísticas e tome decisões baseadas em dados.",
    images: ["https://finalizabot.com/og-image.jpg"],
    creator: "@finalizabot",
  },
  category: "sports",
  classification: "Sports Analytics",
  formatDetection: {
    email: false,
    telephone: false,
  },
};

export const landingPageMetadata: Metadata = {
  ...defaultMetadata,
  title: "FinalizaBOT - Análise de Finalizações em Tempo Real",
  description:
    "Análise profissional de finalizações de jogadores. Métricas em tempo real, padrões históricos e insights para apostadores.",
};

export const dashboardMetadata: Metadata = {
  ...defaultMetadata,
  title: "Dashboard - FinalizaBOT",
  description:
    "Seu painel de controle pessoal com análises customizadas de jogadores e mercados.",
  robots: "noindex, nofollow", // Protect dashboard from search
};

export const authMetadata: Metadata = {
  ...defaultMetadata,
  title: "Autenticação - FinalizaBOT",
  description: "Acesso seguro à plataforma FinalizaBOT com Clerk.",
  robots: "noindex, nofollow",
};

/**
 * Generate JSON-LD structured data for SEO
 */
export function generateOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "FinalizaBOT",
    description: "Plataforma de análise de finalizações em tempo real",
    url: "https://finalizabot.com",
    logo: "https://finalizabot.com/logo.png",
    sameAs: [
      "https://twitter.com/finalizabot",
      "https://instagram.com/finalizabot",
    ],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "Customer Support",
      email: "support@finalizabot.com",
    },
  };
}

/**
 * Generate JSON-LD for Software Application
 */
export function generateSoftwareAppSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "FinalizaBOT",
    applicationCategory: "BusinessApplication",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "BRL",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.8",
      ratingCount: "250",
    },
  };
}
