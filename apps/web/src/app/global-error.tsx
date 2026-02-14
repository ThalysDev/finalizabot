"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { NAV_COPY } from "@/lib/copy/navigation";
import { logger } from "@/lib/logger";

/**
 * Error boundary global — captura erros em qualquer rota.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error("[FinalizaBOT Global Error]", {
      name: error.name,
      message: error.message,
      digest: error.digest,
      cause: error.cause,
    });
  }, [error]);

  return (
    <html lang="pt-BR">
      <body className="bg-fb-bg text-fb-text">
        <div className="flex min-h-screen items-center justify-center p-4">
          <div className="max-w-md w-full text-center">
            <div className="mx-auto size-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6">
              <AlertTriangle className="size-8 text-red-500" />
            </div>

            <h1 className="text-fb-text text-2xl font-bold mb-2">
              Algo deu errado
            </h1>
            <p className="text-fb-text-muted text-sm mb-6 leading-relaxed">
              Ocorreu um erro inesperado. Tente recarregar a página.
            </p>

            {error.digest && (
              <p className="text-fb-text-muted/60 text-xs font-mono mb-6 bg-fb-surface rounded-lg px-3 py-2">
                ID: {error.digest}
              </p>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={reset}
                className="flex items-center gap-2 px-6 py-3 bg-fb-primary text-fb-primary-content font-bold text-sm rounded-lg hover:brightness-110 transition-all"
              >
                <RefreshCw className="size-4" />
                Tentar novamente
              </button>
              <Link
                href="/"
                className="flex items-center gap-2 px-6 py-3 bg-fb-surface border border-fb-border text-fb-text font-medium text-sm rounded-lg hover:bg-fb-surface-lighter transition-colors"
              >
                <Home className="size-4" />
                {NAV_COPY.backToHome}
              </Link>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
