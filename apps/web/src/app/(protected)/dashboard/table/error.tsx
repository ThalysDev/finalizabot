"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/ui/ErrorState";
import { ERROR_COPY } from "@/lib/copy";
import { logger } from "@/lib/logger";

export default function TableError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error("[AdvancedTable] Error", {
      name: error.name,
      message: error.message,
      digest: error.digest,
      stack: error.stack,
      cause: error.cause,
    });
  }, [error]);

  return (
    <ErrorState
      title={ERROR_COPY.advancedTableTitle}
      description={ERROR_COPY.advancedTableDescription}
      digest={error.digest}
      onRetry={reset}
      className="p-4 md:p-6 max-w-[1400px] mx-auto flex flex-col items-center justify-center py-20"
      contentClassName="max-w-2xl w-full text-center animate-fade-up"
    >
      {process.env.NODE_ENV === "development" && error.message ? (
        <div className="p-4 bg-fb-surface border border-fb-border rounded-lg text-left max-w-2xl w-full">
          <p className="text-xs font-mono text-fb-accent-red mb-2">
            <strong>Error Message:</strong>
          </p>
          <p className="text-xs font-mono text-fb-text-muted mb-4 break-words">
            {error.message}
          </p>

          {error.stack ? (
            <>
              <p className="text-xs font-mono text-fb-accent-red mb-2">
                <strong>Stack Trace:</strong>
              </p>
              <pre className="text-xs font-mono text-fb-text-muted overflow-x-auto whitespace-pre-wrap max-h-64 overflow-y-auto">
                {error.stack}
              </pre>
            </>
          ) : null}
        </div>
      ) : null}
    </ErrorState>
  );
}
