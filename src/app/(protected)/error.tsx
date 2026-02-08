"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

/**
 * Error boundary para rotas protegidas.
 * Captura erros de runtime e exibe UI de recuperação.
 */
export default function ProtectedError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Futuro: enviar para serviço de monitoramento (Sentry, etc.)
    console.error("[FinalizaBOT Error]", error);
  }, [error]);

  return (
    <div className="flex h-[calc(100vh-57px)] items-center justify-center p-4">
      <div className="max-w-md w-full text-center animate-fade-up">
        {/* Ícone */}
        <div className="mx-auto size-16 rounded-2xl bg-fb-accent-red/10 border border-fb-accent-red/20 flex items-center justify-center mb-6">
          <AlertTriangle className="size-8 text-fb-accent-red" />
        </div>

        {/* Texto */}
        <h1 className="text-fb-text text-2xl font-bold mb-2">
          Algo deu errado
        </h1>
        <p className="text-fb-text-secondary text-sm mb-6 leading-relaxed">
          Ocorreu um erro inesperado ao carregar esta página. Nossa equipe foi
          notificada automaticamente.
        </p>

        {/* Digest ID */}
        {error.digest && (
          <p className="text-fb-text-muted text-xs font-mono mb-6 bg-fb-surface rounded-lg px-3 py-2">
            ID do erro: {error.digest}
          </p>
        )}

        {/* Ações */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={reset}
            className="flex items-center gap-2 px-6 py-3 bg-fb-primary text-fb-primary-content font-bold text-sm rounded-lg hover:brightness-110 transition-all"
          >
            <RefreshCw className="size-4" />
            Tentar novamente
          </button>
          <Link
            href="/dashboard"
            className="flex items-center gap-2 px-6 py-3 bg-fb-surface border border-fb-border text-fb-text font-medium text-sm rounded-lg hover:brightness-110 transition-colors"
          >
            <Home className="size-4" />
            Voltar ao painel
          </Link>
        </div>
      </div>
    </div>
  );
}
