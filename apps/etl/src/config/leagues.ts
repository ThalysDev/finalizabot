export const DEFAULT_EUROPE_LEAGUES =
  "Premier League,LaLiga,La Liga,Serie A,Bundesliga,Ligue 1,UEFA Champions League,Champions League,UEFA Europa League,Europa League,UEFA Europa Conference League,Conference League,Brasileirão Série A,Brasileirão Série B,Copa Libertadores,Copa do Brasil,Copa Sudamericana,Copa Sul-Americana,Copa América,Eliminatórias CONMEBOL,World Cup,MLS,Liga Portugal,Primeira Liga,Eredivisie,Superliga Turkey,Scottish Premiership,Pro League";

const envNames = process.env.ALLOWED_TOURNAMENT_NAMES?.trim();
// Default to allow-all: tournament ID set is the authoritative filter
const allowAll = envNames === undefined || envNames === "" || envNames === "*" || envNames?.toLowerCase() === "all";
const useDefault = false; // kept for backwards compat but never triggers
const ALLOWED_NAMES = allowAll
  ? null
  : useDefault
    ? new Set(
        DEFAULT_EUROPE_LEAGUES.split(",")
          .map((s) => s.trim().toLowerCase())
          .filter(Boolean),
      )
    : new Set(
        envNames
          .split(",")
          .map((s) => s.trim().toLowerCase())
          .filter(Boolean),
      );

export function isAllowedTournament(name: string | undefined | null): boolean {
  if (allowAll) return true;
  if (name == null || typeof name !== "string") return false;
  return ALLOWED_NAMES?.has(name.trim().toLowerCase()) ?? false;
}
