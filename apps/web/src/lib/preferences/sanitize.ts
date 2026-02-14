export type DashboardDayFilter = "all" | "today" | "tomorrow";
export type DashboardViewMode = "grid" | "list";

export interface DashboardPreferencePayload {
  dayFilter: DashboardDayFilter;
  compFilter: string;
  searchQuery: string;
  view: DashboardViewMode;
}

export interface AlertSettingsPayload {
  minRoi: number;
  maxCv: number;
  pushEnabled: boolean;
  emailEnabled: boolean;
  silentMode: boolean;
  leagues: string[];
}

export type SortDir = "asc" | "desc";

export interface ProPreferencesPayload {
  positionFilter: string;
  sortKey: string;
  sortDir: SortDir;
  minMatches: number;
  minEv: number;
  searchQuery: string;
}

const ALLOWED_POSITION_FILTERS = new Set([
  "Todos",
  "Atacante",
  "Meio-Campo",
  "Defensor",
  "Goleiro",
]);

const ALLOWED_SORT_KEYS = new Set([
  "rank",
  "name",
  "matches",
  "goals",
  "assists",
  "xg",
  "ev",
  "value",
]);

export const DEFAULT_DASHBOARD_PREFERENCES: DashboardPreferencePayload = {
  dayFilter: "all",
  compFilter: "all",
  searchQuery: "",
  view: "grid",
};

export const DEFAULT_ALERT_SETTINGS: AlertSettingsPayload = {
  minRoi: 10,
  maxCv: 0.5,
  pushEnabled: true,
  emailEnabled: false,
  silentMode: false,
  leagues: ["Premier League", "La Liga", "Champions League"],
};

export const DEFAULT_PRO_PREFERENCES: ProPreferencesPayload = {
  positionFilter: "Todos",
  sortKey: "ev",
  sortDir: "desc",
  minMatches: 0,
  minEv: 0,
  searchQuery: "",
};

export function sanitizeDashboardPreferencePayload(
  input: unknown,
): DashboardPreferencePayload {
  const data = (input ?? {}) as Partial<DashboardPreferencePayload>;

  const dayFilter: DashboardDayFilter =
    data.dayFilter === "today" || data.dayFilter === "tomorrow"
      ? data.dayFilter
      : "all";

  const view: DashboardViewMode = data.view === "list" ? "list" : "grid";

  return {
    dayFilter,
    compFilter:
      typeof data.compFilter === "string" && data.compFilter.trim()
        ? data.compFilter.trim().slice(0, 120)
        : "all",
    searchQuery:
      typeof data.searchQuery === "string"
        ? data.searchQuery.trim().slice(0, 120)
        : "",
    view,
  };
}

export function sanitizeAlertSettingsPayload(
  input: unknown,
): AlertSettingsPayload {
  const data = (input ?? {}) as Partial<AlertSettingsPayload>;

  const minRoiValue = Number(data.minRoi);
  const minRoi = Number.isFinite(minRoiValue)
    ? Math.max(0, Math.min(100, minRoiValue))
    : DEFAULT_ALERT_SETTINGS.minRoi;

  const maxCvValue = Number(data.maxCv);
  const maxCv = Number.isFinite(maxCvValue)
    ? Math.max(0, Math.min(2, maxCvValue))
    : DEFAULT_ALERT_SETTINGS.maxCv;

  const leagues = Array.isArray(data.leagues)
    ? data.leagues
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean)
        .slice(0, 20)
    : DEFAULT_ALERT_SETTINGS.leagues;

  return {
    minRoi,
    maxCv,
    pushEnabled:
      typeof data.pushEnabled === "boolean"
        ? data.pushEnabled
        : DEFAULT_ALERT_SETTINGS.pushEnabled,
    emailEnabled:
      typeof data.emailEnabled === "boolean"
        ? data.emailEnabled
        : DEFAULT_ALERT_SETTINGS.emailEnabled,
    silentMode:
      typeof data.silentMode === "boolean"
        ? data.silentMode
        : DEFAULT_ALERT_SETTINGS.silentMode,
    leagues: leagues.length > 0 ? leagues : DEFAULT_ALERT_SETTINGS.leagues,
  };
}

export function sanitizeProPreferencesPayload(
  input: unknown,
): ProPreferencesPayload {
  const data = (input ?? {}) as Partial<ProPreferencesPayload>;

  const positionFilterInput =
    typeof data.positionFilter === "string" ? data.positionFilter.trim() : "";
  const positionFilter = ALLOWED_POSITION_FILTERS.has(positionFilterInput)
    ? positionFilterInput
    : DEFAULT_PRO_PREFERENCES.positionFilter;

  const sortKeyInput =
    typeof data.sortKey === "string" ? data.sortKey.trim() : "";
  const sortKey = ALLOWED_SORT_KEYS.has(sortKeyInput)
    ? sortKeyInput
    : DEFAULT_PRO_PREFERENCES.sortKey;

  const minMatchesValue = Number(data.minMatches);
  const minEvValue = Number(data.minEv);

  return {
    positionFilter,
    sortKey,
    sortDir: data.sortDir === "asc" ? "asc" : "desc",
    minMatches: Number.isFinite(minMatchesValue)
      ? Math.max(0, Math.min(100, Math.trunc(minMatchesValue)))
      : DEFAULT_PRO_PREFERENCES.minMatches,
    minEv: Number.isFinite(minEvValue)
      ? Math.max(-100, Math.min(100, Math.trunc(minEvValue)))
      : DEFAULT_PRO_PREFERENCES.minEv,
    searchQuery:
      typeof data.searchQuery === "string"
        ? data.searchQuery.trim().slice(0, 120)
        : DEFAULT_PRO_PREFERENCES.searchQuery,
  };
}
