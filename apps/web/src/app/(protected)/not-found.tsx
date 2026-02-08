"use client";

import Link from "next/link";
import { SearchX, Home, ArrowLeft } from "lucide-react";

/**
 * 404 para rotas protegidas.
 * Exibida quando uma rota não é encontrada dentro de (protected).
 */
export default function ProtectedNotFound() {
  return (
    <div className="flex h-[calc(100vh-57px)] items-center justify-center p-4">
      <div className="max-w-md w-full text-center animate-fade-up">
        {/* Ícone */}
        <div className="mx-auto size-16 rounded-2xl bg-fb-surface border border-fb-border flex items-center justify-center mb-6">
          <SearchX className="size-8 text-fb-text-muted" />
        </div>

        {/* 404 grande */}
        <p className="text-fb-primary text-6xl font-black mb-2">404</p>

        <h1 className="text-fb-text text-xl font-bold mb-2">
          Página não encontrada
        </h1>
        <p className="text-fb-text-secondary text-sm mb-8 leading-relaxed">
          A página que você procura não existe ou foi movida. Verifique a URL ou
          volte para o painel.
        </p>

        {/* Ações */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 px-6 py-3 bg-fb-primary text-fb-primary-content font-bold text-sm rounded-lg hover:brightness-110 transition-all"
          >
            <Home className="size-4" />
            Ir para o painel
          </Link>
          <button
            onClick={() => history.back()}
            className="flex items-center gap-2 px-6 py-3 bg-fb-surface border border-fb-border text-fb-text font-medium text-sm rounded-lg hover:brightness-110 transition-colors"
          >
            <ArrowLeft className="size-4" />
            Voltar
          </button>
        </div>
      </div>
    </div>
  );
}
