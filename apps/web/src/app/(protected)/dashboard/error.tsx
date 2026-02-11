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
    console.error("[Dashboard] error:", error);
  }, [error]);

  return (
    <div className="p-4 md:p-6 max-w-[1400px] mx-auto">
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="size-16 rounded-full bg-fb-accent-red/10 flex items-center justify-center mb-4">
          <svg
            className="size-8 text-fb-accent-red"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
            />
          </svg>
        </div>
        <h3 className="text-fb-text font-semibold text-lg mb-2">
          Erro ao carregar o painel
        </h3>
        <p className="text-fb-text-muted text-sm max-w-md mb-6">
          Ocorreu um erro ao buscar os dados das partidas. Tente novamente em
          alguns instantes.
          {error.digest && (
            <span className="block mt-1 text-xs opacity-60">
              Código: {error.digest}
            </span>
          )}
        </p>
        <button
          onClick={reset}
          className="bg-fb-primary text-fb-primary-content font-bold py-2.5 px-6 rounded-lg text-sm hover:brightness-110 transition-all"
        >
          Tentar Novamente
        </button>
      </div>
    </div>
  );
}
