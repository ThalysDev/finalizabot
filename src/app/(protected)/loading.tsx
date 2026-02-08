import { Zap } from "lucide-react";

/**
 * Loading state para todas as rotas protegidas.
 * Usa Suspense boundary do Next.js automaticamente.
 */
export default function ProtectedLoading() {
  return (
    <div className="flex h-[calc(100vh-57px)] items-center justify-center">
      <div className="flex flex-col items-center gap-4 animate-fade-up">
        {/* Logo animado */}
        <div className="size-14 rounded-xl bg-fb-primary/20 flex items-center justify-center animate-pulse">
          <Zap className="size-7 text-fb-primary" />
        </div>

        {/* Skeleton bars */}
        <div className="flex flex-col items-center gap-2 w-48">
          <div className="h-3 w-full rounded-full bg-fb-surface animate-shimmer" />
          <div className="h-3 w-3/4 rounded-full bg-fb-surface animate-shimmer [animation-delay:150ms]" />
          <div className="h-3 w-1/2 rounded-full bg-fb-surface animate-shimmer [animation-delay:300ms]" />
        </div>

        <p className="text-fb-text-muted text-sm mt-2">Carregando dados…</p>
      </div>
    </div>
  );
}
