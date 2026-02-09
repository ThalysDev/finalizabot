import Link from "next/link";
import { Container } from "@/components/primitives";
import { Zap } from "lucide-react";

/**
 * Footer Component
 * Footer with links and copyright
 */

interface FooterLink {
  readonly label: string;
  readonly href: string;
}

const PRODUCT_LINKS: readonly FooterLink[] = [
  { label: "Demo", href: "/#demo" },
  { label: "Benefícios", href: "/#benefits" },
  { label: "Como funciona", href: "/#how-it-works" },
];

const LEGAL_LINKS: readonly FooterLink[] = [
  { label: "Contato", href: "mailto:contato@finalizabot.com" },
];

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-fb-border/50 bg-fb-surface-darker">
      <Container className="py-12 sm:py-16">
        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-8 sm:mb-12">
          {/* Brand */}
          <div>
            <h3 className="font-bold text-fb-text mb-3 flex items-center gap-2.5">
              <div className="size-7 rounded-lg bg-fb-primary/15 border border-fb-primary/20 flex items-center justify-center">
                <Zap className="size-4 text-fb-primary" />
              </div>
              FinalizaBOT
            </h3>
            <p className="text-sm text-fb-text-secondary leading-relaxed">
              Análise profissional de finalizações para apostadores de props.
            </p>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="font-semibold text-fb-text mb-4 text-sm uppercase tracking-wider">
              Produto
            </h4>
            <ul className="space-y-2.5">
              {PRODUCT_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-fb-text-secondary hover:text-fb-primary transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal / Support */}
          <div>
            <h4 className="font-semibold text-fb-text mb-4 text-sm uppercase tracking-wider">
              Suporte
            </h4>
            <ul className="space-y-2.5">
              {LEGAL_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-fb-text-secondary hover:text-fb-primary transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-fb-border/40 pt-8 sm:pt-12">
          <div className="text-center">
            <p className="text-sm text-fb-text-muted">
              &copy; {currentYear} FinalizaBOT. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </Container>
    </footer>
  );
}

Footer.displayName = "Footer";
