/**
 * IDs de torneios europeus na API SofaScore (para descoberta automática no sync).
 * Pode ser sobrescrito por SYNC_TOURNAMENT_IDS no .env (vírgula-separado).
 */
export const DEFAULT_EUROPEAN_TOURNAMENT_IDS = [
  17,  // Premier League
  8,   // LaLiga
  23,  // Serie A
  35,  // Bundesliga
  34,  // Ligue 1
  7,   // UEFA Champions League
  679, // UEFA Europa League
];

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
