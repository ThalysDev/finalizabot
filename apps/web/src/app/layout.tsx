import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { GoogleAnalytics } from "@/components/GoogleAnalytics";
import "./globals.css";

const appUrl = (() => {
  const value = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (!value) return "http://localhost:3000";

  try {
    return new URL(value).toString();
  } catch {
    return "http://localhost:3000";
  }
})();

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: "FinalizaBOT - Análise de Finalizações",
  description:
    "Plataforma de análise de mercado de finalizações para apostas esportivas",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
  openGraph: {
    title: "FinalizaBOT - Análise de Finalizações",
    description:
      "Plataforma de análise de mercado de finalizações para apostas esportivas",
    images: ["/logo.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="pt-BR">
        <head>
          <GoogleAnalytics />
        </head>
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-100 focus:px-4 focus:py-2 focus:bg-fb-primary focus:text-fb-primary-content focus:rounded-lg focus:text-sm focus:font-bold"
          >
            Pular para o conteúdo
          </a>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
