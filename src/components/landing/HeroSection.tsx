"use client";

import { SignedOut, SignInButton, SignUpButton } from "@clerk/nextjs";
import { SignedIn } from "@clerk/nextjs";
import Link from "next/link";

export function HeroSection() {
  return (
    <section className="py-12 sm:py-24 px-4 bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="container mx-auto max-w-3xl text-center">
        <h1 className="text-3xl sm:text-5xl font-bold text-gray-900 mb-4 leading-tight">
          Analise finalizações de jogadores em tempo real
        </h1>

        <p className="text-lg sm:text-xl text-gray-600 mb-8 leading-relaxed">
          Veja U5/U10, série histórica e coeficiente de variação. Tudo o que
          você precisa para tomar decisões melhores.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <SignedOut>
            <SignUpButton mode="modal">
              <button className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition">
                Comece Agora
              </button>
            </SignUpButton>
            <SignInButton mode="modal">
              <button className="px-6 py-3 border-2 border-blue-600 text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition">
                Entrar
              </button>
            </SignInButton>
          </SignedOut>

          <SignedIn>
            <Link href="/dashboard">
              <button className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition">
                Ir para Dashboard
              </button>
            </Link>
          </SignedIn>
        </div>
      </div>
    </section>
  );
}
