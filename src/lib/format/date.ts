/**
 * Formata uma data no padrão pt-BR
 * @param date - Date object ou string ISO
 * @param includeTime - Se deve incluir horário
 */
export function formatDate(
  date: Date | string,
  includeTime: boolean = true,
): string {
  const d = typeof date === "string" ? new Date(date) : date;

  if (includeTime) {
    return d.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "America/Sao_Paulo",
    });
  }

  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "America/Sao_Paulo",
  });
}

/**
 * Formata data para exibição em cards de match
 */
export function formatMatchDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;

  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  });
}
