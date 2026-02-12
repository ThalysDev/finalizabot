"use client";

import { useEffect } from "react";

export default function TableError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[AdvancedTable] error:", error);
    console.error("[AdvancedTable] error.message:", error.message);
    console.error("[AdvancedTable] error.stack:", error.stack);
    console.error("[AdvancedTable] error.digest:", error.digest);
    console.error("[AdvancedTable] error.cause:", error.cause);
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
          Erro ao carregar a tabela avançada
        </h3>
        <p className="text-fb-text-muted text-sm max-w-md mb-1">
          Ocorreu um erro ao processar os dados. Isso pode acontecer quando o
          serviço ETL está indisponível ou existem dados inconsistentes.
        </p>
        {error.digest && (
          <p className="text-fb-text-muted text-xs mb-4">
            Código: {error.digest}
          </p>
        )}

        {/* Show detailed error in development */}
        {process.env.NODE_ENV === 'development' && error.message && (
          <div className="mt-4 p-4 bg-fb-surface border border-fb-border rounded-lg text-left max-w-2xl w-full">
            <p className="text-xs font-mono text-fb-accent-red mb-2">
              <strong>Error Message:</strong>
            </p>
            <p className="text-xs font-mono text-fb-text-muted mb-4 break-words">
              {error.message}
            </p>

            {error.stack && (
              <>
                <p className="text-xs font-mono text-fb-accent-red mb-2">
                  <strong>Stack Trace:</strong>
                </p>
                <pre className="text-xs font-mono text-fb-text-muted overflow-x-auto whitespace-pre-wrap max-h-64 overflow-y-auto">
                  {error.stack}
                </pre>
              </>
            )}
          </div>
        )}
        <button
          onClick={reset}
          className="mt-6 bg-fb-primary text-white font-bold py-2.5 px-6 rounded-lg text-sm hover:brightness-110 transition-all"
        >
          Tentar Novamente
        </button>
      </div>
    </div>
  );
}
