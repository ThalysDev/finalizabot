import { LoadingState } from "@/components/ui/LoadingState";
import { LOADING_COPY } from "@/lib/copy/navigation";

/**
 * Loading state para todas as rotas protegidas.
 * Usa Suspense boundary do Next.js automaticamente.
 */
export default function ProtectedLoading() {
  return <LoadingState fullHeight title={LOADING_COPY.protectedData} />;
}
