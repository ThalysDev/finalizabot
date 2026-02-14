import { LoadingState } from "@/components/ui/LoadingState";

/**
 * Loading state para todas as rotas protegidas.
 * Usa Suspense boundary do Next.js automaticamente.
 */
export default function ProtectedLoading() {
  return <LoadingState fullHeight title="Carregando dados…" />;
}
