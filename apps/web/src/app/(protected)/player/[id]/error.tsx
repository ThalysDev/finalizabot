"use client";

import { ErrorState } from "@/components/ui/ErrorState";

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
      title="Erro ao carregar jogador"
      description="Não foi possível carregar os dados deste jogador. Isso pode ser temporário — tente novamente."
      onRetry={reset}
      secondaryAction={{
        href: "/dashboard",
        label: "Voltar ao painel",
      }}
      className="min-h-[calc(100vh-57px)] bg-fb-bg flex items-center justify-center p-4"
      contentClassName="bg-fb-card rounded-2xl border border-fb-border p-8 max-w-md w-full text-center"
    />
  );
}
