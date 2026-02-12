"use client";

import { useEffect } from "react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Dashboard Error]", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8">
      <div className="max-w-md w-full bg-fb-surface border border-fb-border rounded-lg p-6">
        <h2 className="text-fb-text font-bold text-xl mb-4">
          Erro no Dashboard
        </h2>
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded text-sm">
          <p className="text-red-400 font-mono break-all">
            {error.message}
          </p>
          {error.digest && (
            <p className="text-red-400/60 text-xs mt-2">
              ID: {error.digest}
            </p>
          )}
        </div>
        <button
          onClick={() => reset()}
          className="w-full bg-fb-primary text-white py-2 px-4 rounded hover:bg-fb-primary/90 transition-colors"
        >
          Tentar novamente
        </button>
        <a
          href="/"
          className="block w-full text-center mt-3 text-fb-text-muted hover:text-fb-text transition-colors text-sm"
        >
          Voltar ao início
        </a>
      </div>
    </div>
  );
}
