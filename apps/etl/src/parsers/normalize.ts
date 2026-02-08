export type Outcome =
  | 'goal'
  | 'on_target'
  | 'off_target'
  | 'blocked'
  | 'unknown';

export type BodyPart =
  | 'right_foot'
  | 'left_foot'
  | 'head'
  | 'other'
  | 'unknown';

export type Situation =
  | 'open_play'
  | 'set_piece'
  | 'penalty'
  | 'corner'
  | 'free_kick'
  | 'unknown';

export interface NormalizedShot {
  id: string;
  matchId: string;
  playerId: string;
  playerName?: string;
  teamId: string;
  minute: number;
  second?: number;
  outcome: Outcome;
  xg?: number;
  bodyPart?: BodyPart;
  situation?: Situation;
  coordsX?: number;
  coordsY?: number;
}

const OUTCOME_MAP: Record<string, Outcome> = {
  goal: 'goal',
  on: 'on_target',
  on_target: 'on_target',
  save: 'on_target',
  off: 'off_target',
  off_target: 'off_target',
  miss: 'off_target',
  post: 'off_target',
  blocked: 'blocked',
  block: 'blocked',
};

const BODY_PART_MAP: Record<string, BodyPart> = {
  right_foot: 'right_foot',
  'right-foot': 'right_foot',
  right: 'right_foot',
  left_foot: 'left_foot',
  'left-foot': 'left_foot',
  left: 'left_foot',
  head: 'head',
  other: 'other',
};

const SITUATION_MAP: Record<string, Situation> = {
  open_play: 'open_play',
  open: 'open_play',
  regular: 'open_play',
  assisted: 'open_play',
  set_piece: 'set_piece',
  setpiece: 'set_piece',
  penalty: 'penalty',
  penalties: 'penalty',
  corner: 'corner',
  corners: 'corner',
  free_kick: 'free_kick',
  freekick: 'free_kick',
  'free-kick': 'free_kick',
};

function mapOutcome(raw: unknown): Outcome {
  if (raw == null || typeof raw !== 'string') return 'unknown';
  const key = raw.toLowerCase().trim();
  return OUTCOME_MAP[key] ?? 'unknown';
}

function mapBodyPart(raw: unknown): BodyPart {
  if (raw == null || typeof raw !== 'string') return 'unknown';
  const key = raw.toLowerCase().replace(/\s+/g, '_').trim();
  return BODY_PART_MAP[key] ?? 'unknown';
}

function mapSituation(raw: unknown): Situation {
  if (raw == null || typeof raw !== 'string') return 'unknown';
  const key = raw.toLowerCase().replace(/\s+/g, '_').trim();
  return SITUATION_MAP[key] ?? 'unknown';
}

function isShotLike(obj: unknown): obj is Record<string, unknown> {
  if (obj == null || typeof obj !== 'object' || Array.isArray(obj)) return false;
  const o = obj as Record<string, unknown>;
  const type = o.type ?? o.eventType ?? o.kind ?? o.incidentType;
  if (typeof type !== 'string') return false;
  const t = type.toLowerCase();
  return t === 'shot' || t === 'shoton' || t === 'shot_on' || t === 'finish' || t === 'goal';
}

function extractEvents(json: unknown): unknown[] {
  if (Array.isArray(json)) return json;
  if (json != null && typeof json === 'object') {
    const o = json as Record<string, unknown>;
    const events = o.shotmap ?? o.events ?? o.data ?? o.incidents ?? o.shots;
    if (Array.isArray(events)) return events;
    if (events != null && typeof events === 'object' && Array.isArray((events as Record<string, unknown>).events))
      return (events as { events: unknown[] }).events;
  }
  return [];
}

function safeNum(v: unknown): number | undefined {
  if (typeof v === 'number' && !Number.isNaN(v)) return v;
  if (typeof v === 'string') {
    const n = Number(v);
    if (!Number.isNaN(n)) return n;
  }
  return undefined;
}

function safeStr(v: unknown): string {
  if (v == null) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'number') return String(v);
  return '';
}

export function normalizeShotsFromSofaScore(
  matchId: string,
  json: unknown,
  homeTeamId?: string,
  awayTeamId?: string,
): NormalizedShot[] {
  const events = extractEvents(json);
  const out: NormalizedShot[] = [];

  for (let i = 0; i < events.length; i++) {
    const raw = events[i];
    if (!isShotLike(raw)) continue;

    const o = raw as Record<string, unknown>;
    const eventId = safeStr(o.id ?? o.incidentId ?? o.eventId ?? `${matchId}-${i}`);
    const id = `${matchId}:${eventId}`;

    /* --- Player ID: flat playerId or nested player.id --- */
    const playerId = safeStr(
      o.playerId ??
        (typeof o.player === 'object' && o.player !== null && 'id' in o.player
          ? (o.player as { id: unknown }).id
          : undefined)
    );

    /* --- Player Name: extract from nested player object if available --- */
    const playerName = typeof o.player === 'object' && o.player !== null
      ? safeStr((o.player as Record<string, unknown>).name ?? (o.player as Record<string, unknown>).shortName) || undefined
      : undefined;

    /* --- Team ID: flat teamId, nested team.id, or derived from isHome --- */
    let teamId = safeStr(
      o.teamId ??
        (typeof o.team === 'object' && o.team !== null && 'id' in o.team
          ? (o.team as { id: unknown }).id
          : undefined)
    );
    if (!teamId && typeof o.isHome === 'boolean' && (homeTeamId || awayTeamId)) {
      teamId = o.isHome ? (homeTeamId ?? '') : (awayTeamId ?? '');
    }

    const minute = safeNum(o.minute ?? o.time ?? o.min) ?? 0;
    const second = safeNum(o.second ?? o.seconds ?? o.sec ?? o.timeSeconds);

    /* --- Outcome: prefer shotType (SofaScore shotmap), then outcome/result --- */
    const outcome = mapOutcome(o.shotType ?? o.outcome ?? o.result ?? o.type);
    const xg = safeNum(o.xg ?? o.expectedGoals);
    const bodyPart = mapBodyPart(o.bodyPart ?? o.bodyPartId ?? o.foot);
    const situation = mapSituation(o.situation ?? o.situationType);

    /* --- Coordinates: flat x/y or nested playerCoordinates.x/y --- */
    const coords = typeof o.playerCoordinates === 'object' && o.playerCoordinates !== null
      ? o.playerCoordinates as Record<string, unknown>
      : null;
    const coordsX = safeNum(coords?.x ?? o.x ?? o.coordsX ?? o.coordinateX);
    const coordsY = safeNum(coords?.y ?? o.y ?? o.coordsY ?? o.coordinateY);

    out.push({
      id,
      matchId,
      playerId,
      playerName,
      teamId,
      minute,
      second,
      outcome,
      xg,
      bodyPart,
      situation,
      coordsX,
      coordsY,
    });
  }

  return out;
}
