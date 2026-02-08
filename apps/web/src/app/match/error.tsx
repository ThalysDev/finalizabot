"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

/**
 * Error boundary para rotas de partida (/match/[id]).
 * Captura erros de runtime e exibe UI de recuperação.
 */
export default function MatchError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[FinalizaBOT Match Error]", error);
  }, [error]);

  return (
    <div className="flex h-[calc(100vh-57px)] items-center justify-center p-4 bg-fb-bg">
      <div className="max-w-md w-full text-center animate-fade-up">
        <div className="mx-auto size-16 rounded-2xl bg-fb-accent-red/10 border border-fb-accent-red/20 flex items-center justify-center mb-6">
          <AlertTriangle className="size-8 text-fb-accent-red" />
        </div>

        <h1 className="text-fb-text text-2xl font-bold mb-2">
          Erro ao carregar partida
        </h1>
        <p className="text-fb-text-secondary text-sm mb-6 leading-relaxed">
          Não foi possível carregar os dados desta partida. Tente novamente ou
          volte ao painel.
        </p>

        {error.digest && (
          <p className="text-fb-text-muted text-xs font-mono mb-6 bg-fb-surface rounded-lg px-3 py-2">
            ID do erro: {error.digest}
          </p>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={reset}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-fb-primary text-fb-primary-content text-sm font-bold hover:brightness-110 transition-all"
          >
            <RefreshCw className="size-4" />
            Tentar Novamente
          </button>
          <Link
            href="/dashboard"
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-fb-surface border border-fb-border text-fb-text text-sm font-medium hover:brightness-110 transition-all"
          >
            <Home className="size-4" />
            Voltar ao Início
          </Link>
        </div>
      </div>
    </div>
  );
}
