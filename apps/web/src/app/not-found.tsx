import Link from "next/link";
import { SearchX, Home } from "lucide-react";

/**
 * 404 global — Exibida quando nenhuma rota corresponde.
 */
export default function GlobalNotFound() {
  return (
    <html lang="pt-BR">
      <body className="bg-[#0a0f1a] text-white">
        <div className="flex min-h-screen items-center justify-center p-4">
          <div className="max-w-md w-full text-center">
            <div className="mx-auto size-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6">
              <SearchX className="size-8 text-white/40" />
            </div>

            <p className="text-[#13ec5b] text-6xl font-black mb-2">404</p>

            <h1 className="text-white text-xl font-bold mb-2">
              Página não encontrada
            </h1>
            <p className="text-white/60 text-sm mb-8 leading-relaxed">
              A página que você procura não existe ou foi movida.
            </p>

            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#13ec5b] text-[#0a0f1a] font-bold text-sm rounded-lg hover:brightness-110 transition-all"
            >
              <Home className="size-4" />
              Voltar ao início
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}
