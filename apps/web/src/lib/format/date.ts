/**
 * Centralised date/time formatting — America/Sao_Paulo timezone
 *
 * All public functions bake-in `timeZone: "America/Sao_Paulo"` so dates
 * render consistently regardless of whether the code runs on a Vercel
 * serverless function (UTC) or a developer's local machine.
 */

const TZ = "America/Sao_Paulo";
const LOCALE = "pt-BR";

/* ============================================================================
   Public API
   ============================================================================ */

/** "10 de fev. de 2026" */
export function formatDate(
  date: Date | string,
  style: "short" | "long" = "short",
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "—";

  if (style === "long") {
    return d.toLocaleDateString(LOCALE, {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: TZ,
    });
  }

  // short → "10 fev."
  return d.toLocaleDateString(LOCALE, {
    day: "2-digit",
    month: "short",
    timeZone: TZ,
  });
}

/** "21:30" */
export function formatTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString(LOCALE, {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TZ,
  });
}

/** "10 de fev. de 2026, 21:30" */
export function formatDateTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(LOCALE, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TZ,
  });
}
