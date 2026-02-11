/**
 * IDs de torneios na API SofaScore (para descoberta automática no sync).
 * Inclui ligas europeias + brasileiras/sul-americanas.
 * Pode ser sobrescrito por SYNC_TOURNAMENT_IDS no .env (vírgula-separado).
 */
export const DEFAULT_TOURNAMENT_IDS = [
  /* ── Big-5 Europe ─────────────────────────────────── */
  17, // Premier League (England)
  8, // LaLiga (Spain)
  23, // Serie A (Italy)
  35, // Bundesliga (Germany)
  34, // Ligue 1 (France)

  /* ── UEFA Club Competitions ─────────────────────────── */
  7, // UEFA Champions League
  679, // UEFA Europa League
  17015, // UEFA Conference League

  /* ── Other Europe ───────────────────────────────────── */
  37, // Eredivisie (Netherlands)
  238, // Liga Portugal
  38, // Pro League (Belgium)
  52, // Süper Lig (Turkey)
  203, // Russian Premier League
  218, // Ukrainian Premier League
  45, // Austrian Bundesliga
  215, // Swiss Super League
  39, // Danish Superliga
  40, // Allsvenskan (Sweden)
  20, // Eliteserien (Norway)
  202, // Ekstraklasa (Poland)
  172, // Czech First League
  185, // Super League Greece
  210, // Serbian Super Liga
  170, // HNL (Croatia)
  152, // Romanian SuperLiga
  36, // Scottish Premiership

  /* ── Brazil ─────────────────────────────────────────── */
  325, // Brasileirão Série A
  390, // Brasileirão Série B
  4407, // Copa do Brasil

  /* ── South America ──────────────────────────────────── */
  384, // Copa Libertadores
  480, // Copa Sul-Americana
  133, // Copa América
  155, // Liga Profesional (Argentina)
  278, // Primera División (Uruguay)

  /* ── CONCACAF / North America ───────────────────────── */
  11621, // Liga MX - Apertura
  11620, // Liga MX - Clausura
  242, // MLS (USA)
  13470, // Canadian Premier League
  498, // CONCACAF Champions Cup

  /* ── Asia ────────────────────────────────────────────── */
  955, // Saudi Pro League
  196, // J1 League (Japan)
  410, // K League 1 (South Korea)
  825, // Qatar Stars League
  971, // UAE Pro League
  1900, // Indian Super League
  1032, // Thai League 1
  649, // Chinese Super League
  463, // AFC Champions League

  /* ── Africa ──────────────────────────────────────────── */
  808, // Egyptian Premier League
  358, // South Africa Premier Division
  937, // Botola Pro (Morocco)
  1054, // CAF Champions League

  /* ── Oceania ─────────────────────────────────────────── */
  136, // A-League (Australia)

  /* ── International ──────────────────────────────────── */
  16, // FIFA World Cup
];

// Keep old name for backwards compat
export const DEFAULT_EUROPEAN_TOURNAMENT_IDS = DEFAULT_TOURNAMENT_IDS;

export function getSyncTournamentIds(): number[] {
  const fromEnv = process.env.SYNC_TOURNAMENT_IDS?.trim();
  if (fromEnv) {
    return fromEnv
      .split(",")
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => !Number.isNaN(n) && n > 0);
  }
  return [...DEFAULT_EUROPEAN_TOURNAMENT_IDS];
}
