"use client";

import Link from "next/link";
import Image from "next/image";
import { Shield, Clock, Users, ChevronRight } from "lucide-react";
import type { MatchCardData } from "@/data/types";

/* ============================================================================
   MatchCard — Clickable card for a match on the dashboard
   ============================================================================ */

export function MatchCard({
  id,
  homeTeam,
  awayTeam,
  competition,
  matchTime,
  homeScore,
  awayScore,
  minute,
  isLive,
  playerCount,
  homeBadgeUrl,
  awayBadgeUrl,
}: MatchCardData) {
  const hasScore = homeScore != null && awayScore != null;
  return (
    <Link
      href={`/match/${id}`}
      className="group block rounded-2xl bg-fb-surface border border-fb-border/60 hover:border-fb-primary/40 transition-all duration-200 hover:shadow-lg hover:shadow-fb-primary/5 overflow-hidden"
    >
      {/* Competition header */}
      <div className="px-4 py-2 bg-fb-surface-lighter/50 border-b border-fb-border/40">
        <p className="text-fb-text-muted text-[10px] uppercase tracking-wider font-medium">
          {competition}
        </p>
      </div>

      {/* Match body */}
      <div className="p-4">
        <div className="flex items-center justify-between gap-3">
          {/* Home team */}
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <div className="size-10 rounded-full bg-fb-surface-lighter flex items-center justify-center flex-shrink-0 border border-fb-border/40 overflow-hidden">
              {homeBadgeUrl ? (
                <Image
                  src={homeBadgeUrl}
                  alt={homeTeam}
                  width={28}
                  height={28}
                  className="size-7 object-contain"
                />
              ) : (
                <Shield className="size-5 text-fb-text-muted" />
              )}
            </div>
            <span className="text-fb-text font-semibold text-sm truncate">
              {homeTeam}
            </span>
          </div>

          {/* Time / Score */}
          <div className="flex flex-col items-center px-2 flex-shrink-0">
            {hasScore ? (
              <div className="flex items-center gap-2 text-fb-text font-bold text-base">
                <span>{homeScore}</span>
                <span className="text-fb-text-muted">-</span>
                <span>{awayScore}</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-fb-primary font-bold text-base">
                <Clock className="size-3.5" />
                {matchTime}
              </div>
            )}
            {isLive && minute != null && (
              <div className="flex items-center gap-1 mt-0.5">
                <span className="size-1.5 rounded-full bg-fb-accent-red animate-pulse" />
                <span className="text-[10px] text-fb-accent-red font-bold">
                  {minute}&apos;
                </span>
              </div>
            )}
          </div>

          {/* Away team */}
          <div className="flex items-center gap-2.5 flex-1 min-w-0 justify-end">
            <span className="text-fb-text font-semibold text-sm truncate text-right">
              {awayTeam}
            </span>
            <div className="size-10 rounded-full bg-fb-surface-lighter flex items-center justify-center flex-shrink-0 border border-fb-border/40 overflow-hidden">
              {awayBadgeUrl ? (
                <Image
                  src={awayBadgeUrl}
                  alt={awayTeam}
                  width={28}
                  height={28}
                  className="size-7 object-contain"
                />
              ) : (
                <Shield className="size-5 text-fb-text-muted" />
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-fb-border/30">
          <div className="flex items-center gap-1.5 text-fb-text-muted text-xs">
            <Users className="size-3.5" />
            <span>
              {playerCount > 0
                ? `${playerCount} jogadores analisados`
                : "Clique para ver jogadores"}
            </span>
          </div>
          <ChevronRight className="size-4 text-fb-text-muted group-hover:text-fb-primary transition-colors" />
        </div>
      </div>
    </Link>
  );
}
