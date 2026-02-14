import { NotFoundState } from "@/components/ui/NotFoundState";
import { NAV_COPY, STATE_COPY } from "@/lib/copy/navigation";

/**
 * 404 para rotas protegidas.
 * Exibida quando uma rota não é encontrada dentro de (protected).
 */
export default function ProtectedNotFound() {
  return (
    <NotFoundState
      description={STATE_COPY.protectedNotFoundDescription}
      primaryAction={{
        href: "/dashboard",
        label: NAV_COPY.goToDashboard,
        icon: "home",
      }}
      showBackAction
      backLabel="Voltar"
    />
  );
}
