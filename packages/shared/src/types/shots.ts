/**
 * Normalized shot types — shared between ETL parser and web consumers.
 */

export type Outcome =
  | "goal"
  | "on_target"
  | "off_target"
  | "blocked"
  | "unknown";

export type BodyPart =
  | "right_foot"
  | "left_foot"
  | "head"
  | "other"
  | "unknown";

export type Situation =
  | "open_play"
  | "set_piece"
  | "penalty"
  | "corner"
  | "free_kick"
  | "unknown";

export interface NormalizedShot {
  id: string;
  matchId: string;
  playerId: string;
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
