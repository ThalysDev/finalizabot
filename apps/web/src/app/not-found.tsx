import { NotFoundState } from "@/components/ui/NotFoundState";
import { NAV_COPY, STATE_COPY } from "@/lib/copy";

/**
 * 404 global — Exibida quando nenhuma rota corresponde.
 */
export default function GlobalNotFound() {
  return (
    <html lang="pt-BR">
      <body className="bg-fb-bg text-fb-text">
        <NotFoundState
          description={STATE_COPY.pageNotFoundDescription}
          primaryAction={{
            href: "/",
            label: NAV_COPY.backToHome,
            icon: "home",
          }}
          className="flex min-h-screen items-center justify-center p-4"
        />
      </body>
    </html>
  );
}
