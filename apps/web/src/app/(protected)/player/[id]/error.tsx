"use client";

import Link from "next/link";
import { AlertTriangle, RefreshCw, ArrowLeft } from "lucide-react";

export default function PlayerError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  void error;

  return (
    <div className="min-h-[calc(100vh-57px)] bg-fb-bg flex items-center justify-center p-4">
      <div className="bg-fb-card rounded-2xl border border-fb-border p-8 max-w-md w-full text-center">
        <div className="size-16 rounded-full bg-fb-accent-red/10 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="size-8 text-fb-accent-red" />
        </div>
        <h2 className="text-fb-text font-bold text-xl mb-2">
          Erro ao carregar jogador
        </h2>
        <p className="text-fb-text-muted text-sm mb-6">
          Não foi possível carregar os dados deste jogador. Isso pode ser
          temporário — tente novamente.
        </p>
        <div className="flex flex-col gap-3">
          <button
            onClick={reset}
            className="w-full py-2.5 rounded-xl bg-fb-primary text-fb-primary-content font-bold text-sm hover:brightness-110 transition-all flex items-center justify-center gap-2"
          >
            <RefreshCw className="size-4" />
            Tentar novamente
          </button>
          <Link
            href="/dashboard"
            className="w-full py-2.5 rounded-xl border border-fb-border text-fb-text-secondary font-medium text-sm hover:bg-fb-surface transition-colors flex items-center justify-center gap-2"
          >
            <ArrowLeft className="size-4" />
            Voltar ao Painel
          </Link>
        </div>
      </div>
    </div>
  );
}
