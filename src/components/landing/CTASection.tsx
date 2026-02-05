"use client";

import { SignedOut, SignUpButton, SignedIn } from "@clerk/nextjs";
import Link from "next/link";

export function CTASection() {
  return (
    <section className="py-12 sm:py-16 px-4 bg-gradient-to-r from-blue-600 to-indigo-600">
      <div className="container mx-auto max-w-2xl text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
          Pronto para começar?
        </h2>
        <p className="text-lg text-blue-100 mb-8">
          Cadastre-se agora e acesse análises completas de finalizações.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <SignedOut>
            <SignUpButton mode="modal">
              <button className="px-8 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-50 transition">
                Comece Grátis
              </button>
            </SignUpButton>
          </SignedOut>

          <SignedIn>
            <Link href="/dashboard">
              <button className="px-8 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-50 transition">
                Ir para Dashboard
              </button>
            </Link>
          </SignedIn>
        </div>
      </div>
    </section>
  );
}
