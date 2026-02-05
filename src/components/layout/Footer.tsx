import Link from "next/link";
import { Container } from "@/components/primitives";
import { cn } from "@/lib/cn";

/**
 * Footer Component
 * Footer with links and copyright
 */

interface FooterLink {
  readonly label: string;
  readonly href: string;
}

const PRODUCT_LINKS: readonly FooterLink[] = [
  { label: "Matches", href: "#matches" },
  { label: "Jogadores", href: "#players" },
  { label: "Análises", href: "#analysis" },
];

const LEGAL_LINKS: readonly FooterLink[] = [
  { label: "Privacidade", href: "/privacy" },
  { label: "Termos", href: "/terms" },
];

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-neutral-200 bg-neutral-50 mt-16 sm:mt-24">
      <Container className="py-12 sm:py-16">
        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-8 sm:mb-12">
          {/* Brand */}
          <div>
            <h3 className="font-bold text-neutral-900 mb-3 flex items-center gap-2">
              <div className="w-6 h-6 bg-blue-600 rounded text-white flex items-center justify-center text-xs font-bold">
                FB
              </div>
              FinalizaBOT
            </h3>
            <p className="text-sm text-neutral-600 leading-relaxed">
              Análise profissional de finalizações para apostadores de props.
            </p>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="font-semibold text-neutral-900 mb-4 text-sm">
              Produto
            </h4>
            <ul className="space-y-2">
              {PRODUCT_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={cn(
                      "text-sm text-neutral-600",
                      "hover:text-blue-600 transition-colors",
                    )}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className="font-semibold text-neutral-900 mb-4 text-sm">
              Legal
            </h4>
            <ul className="space-y-2">
              {LEGAL_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={cn(
                      "text-sm text-neutral-600",
                      "hover:text-blue-600 transition-colors",
                    )}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-neutral-200 pt-8 sm:pt-12">
          {/* Copyright */}
          <div className="text-center">
            <p className="text-sm text-neutral-600">
              &copy; {currentYear} FinalizaBOT. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </Container>
    </footer>
  );
}

Footer.displayName = "Footer";
