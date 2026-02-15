"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/ui/ErrorState";
import { ERROR_COPY, NAV_COPY } from "@/lib/copy";
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
      title={ERROR_COPY.dashboardTitle}
      description={ERROR_COPY.dashboardDescription}
      digest={error.digest}
      onRetry={reset}
      secondaryAction={{
        href: "/dashboard",
        label: NAV_COPY.backToDashboard,
      }}
      className="flex flex-col items-center justify-center min-h-[60vh] p-8"
    />
  );
}
