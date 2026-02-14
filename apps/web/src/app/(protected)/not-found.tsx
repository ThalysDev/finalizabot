import { NotFoundState } from "@/components/ui/NotFoundState";

/**
 * 404 para rotas protegidas.
 * Exibida quando uma rota não é encontrada dentro de (protected).
 */
export default function ProtectedNotFound() {
  return (
    <NotFoundState
      description="A página que você procura não existe ou foi movida. Verifique a URL ou volte para o painel."
      primaryAction={{
        href: "/dashboard",
        label: "Ir para o painel",
        icon: "home",
      }}
      showBackAction
      backLabel="Voltar"
    />
  );
}
