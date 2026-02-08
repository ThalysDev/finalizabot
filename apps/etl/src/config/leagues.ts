export const DEFAULT_EUROPE_LEAGUES =
  'Premier League,LaLiga,Serie A,Bundesliga,Ligue 1,UEFA Champions League,UEFA Europa League';

const envNames = process.env.ALLOWED_TOURNAMENT_NAMES?.trim();
const ALLOWED_NAMES = envNames === '' || envNames === undefined
  ? new Set(DEFAULT_EUROPE_LEAGUES.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean))
  : new Set(envNames.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean));

export function isAllowedTournament(name: string | undefined | null): boolean {
  if (name == null || typeof name !== 'string') return false;
  return ALLOWED_NAMES.has(name.trim().toLowerCase());
}
