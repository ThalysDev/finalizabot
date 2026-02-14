"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/ui/ErrorState";
import { logger } from "@/lib/logger";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error("[Dashboard Error]", {
      name: error.name,
      message: error.message,
      digest: error.digest,
      cause: error.cause,
    });
  }, [error]);

  return (
    <ErrorState
      title="Erro no Dashboard"
      description="Não foi possível carregar os dados do dashboard no momento. Tente novamente em instantes."
      digest={error.digest}
      onRetry={reset}
      secondaryAction={{
        href: "/dashboard",
        label: "Voltar ao painel",
      }}
      className="flex flex-col items-center justify-center min-h-[60vh] p-8"
    />
  );
}
