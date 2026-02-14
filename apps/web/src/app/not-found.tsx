import { NotFoundState } from "@/components/ui/NotFoundState";

/**
 * 404 global — Exibida quando nenhuma rota corresponde.
 */
export default function GlobalNotFound() {
  return (
    <html lang="pt-BR">
      <body className="bg-fb-bg text-fb-text">
        <NotFoundState
          description="A página que você procura não existe ou foi movida."
          primaryAction={{
            href: "/",
            label: "Voltar ao início",
            icon: "home",
          }}
          className="flex min-h-screen items-center justify-center p-4"
        />
      </body>
    </html>
  );
}
