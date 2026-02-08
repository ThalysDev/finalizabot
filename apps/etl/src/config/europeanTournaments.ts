/**
 * IDs de torneios na API SofaScore (para descoberta automática no sync).
 * Inclui ligas europeias + brasileiras/sul-americanas.
 * Pode ser sobrescrito por SYNC_TOURNAMENT_IDS no .env (vírgula-separado).
 */
export const DEFAULT_TOURNAMENT_IDS = [
  16,  // World Cup
  133, // Copa América
  242, // Eliminatórias CONMEBOL
  17,  // Premier League
  8,   // LaLiga
  23,  // Serie A
  35,  // Bundesliga
  34,  // Ligue 1
  7,   // UEFA Champions League
  679, // UEFA Europa League
  390, // Brasileirão Série B
  4407, // Copa do Brasil
  325, // Brasileirão Série A
  384, // Copa Libertadores
  373, // Copa do Brasil
  480, // Copa Sul-Americana
];

// Keep old name for backwards compat
export const DEFAULT_EUROPEAN_TOURNAMENT_IDS = DEFAULT_TOURNAMENT_IDS;

export function getSyncTournamentIds(): number[] {
  const fromEnv = process.env.SYNC_TOURNAMENT_IDS?.trim();
  if (fromEnv) {
    return fromEnv
      .split(',')
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => !Number.isNaN(n) && n > 0);
  }
  return [...DEFAULT_EUROPEAN_TOURNAMENT_IDS];
}
