"use client";

import { ErrorState } from "@/components/ui/ErrorState";
import { ERROR_COPY, NAV_COPY } from "@/lib/copy/navigation";

export default function PlayerError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  void error;

  return (
    <ErrorState
      title={ERROR_COPY.playerTitle}
      description={ERROR_COPY.playerDescription}
      onRetry={reset}
      secondaryAction={{
        href: "/dashboard",
        label: NAV_COPY.backToDashboard,
      }}
      className="min-h-[calc(100vh-57px)] bg-fb-bg flex items-center justify-center p-4"
      contentClassName="bg-fb-card rounded-2xl border border-fb-border p-8 max-w-md w-full text-center"
    />
  );
}
