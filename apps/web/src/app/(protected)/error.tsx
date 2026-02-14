"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/ui/ErrorState";
import { ERROR_COPY, NAV_COPY } from "@/lib/copy/navigation";
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
      title={ERROR_COPY.genericTitle}
      description={ERROR_COPY.protectedDescription}
      digest={error.digest}
      onRetry={reset}
      secondaryAction={{
        href: "/dashboard",
        label: NAV_COPY.backToDashboard,
      }}
    />
  );
}
