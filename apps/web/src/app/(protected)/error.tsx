"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/ui/ErrorState";
import { NAV_COPY } from "@/lib/copy/navigation";
import { logger } from "@/lib/logger";

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
    logger.error("[FinalizaBOT Error]", {
      name: error.name,
      message: error.message,
      digest: error.digest,
      cause: error.cause,
    });
  }, [error]);

  return (
    <ErrorState
      title="Algo deu errado"
      description="Ocorreu um erro inesperado ao carregar esta página. Nossa equipe foi notificada automaticamente."
      digest={error.digest}
      onRetry={reset}
      secondaryAction={{
        href: "/dashboard",
        label: NAV_COPY.backToDashboard,
      }}
    />
  );
}
