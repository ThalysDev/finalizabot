"use client";

import Link from "next/link";
import { ChevronRight, Users } from "lucide-react";
import { SafeImage } from "@/components/ui/SafeImage";
import type { MatchCardData } from "@/data/types";

export function MatchListItem(match: MatchCardData) {
  return (
    <Link
      href={`/match/${match.id}`}
      className="flex items-center gap-3 md:gap-4 p-3 bg-fb-surface border border-fb-border/40 rounded-lg hover:border-fb-border hover:bg-fb-surface-highlight transition-all group"
    >
      {/* Teams */}
      <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
        {/* Home Team */}
        <div className="flex items-center gap-1.5 md:gap-2 min-w-0">
          <SafeImage
            src={match.homeBadgeUrl}
            alt={match.homeTeam}
            width={24}
            height={24}
            className="shrink-0 size-5 md:size-6"
          />
          <span className="text-xs md:text-sm font-medium text-fb-text truncate">
            {match.homeTeam}
          </span>
        </div>

        <span className="text-xs text-fb-text-muted shrink-0">vs</span>

        {/* Away Team */}
        <div className="flex items-center gap-1.5 md:gap-2 min-w-0">
          <SafeImage
            src={match.awayBadgeUrl}
            alt={match.awayTeam}
            width={24}
            height={24}
            className="shrink-0 size-5 md:size-6"
          />
          <span className="text-xs md:text-sm font-medium text-fb-text truncate">
            {match.awayTeam}
          </span>
        </div>
      </div>

      {/* Competition */}
      <div className="hidden md:block">
        <span className="text-xs text-fb-text-muted">{match.competition}</span>
      </div>

      {/* Time/Score */}
      <div className="text-xs text-fb-text-muted shrink-0">
        {match.status === "live" && match.minute != null ? (
          <span className="text-fb-accent-red font-bold">{match.minute}'</span>
        ) : match.status === "finished" && match.homeScore != null && match.awayScore != null ? (
          <span>{match.homeScore} - {match.awayScore}</span>
        ) : (
          <span>{match.matchTime}</span>
        )}
      </div>

      {/* Player count */}
      <div className="flex items-center gap-1.5 text-xs text-fb-text-muted shrink-0">
        <Users className="size-3.5" />
        <span>{match.playerCount}</span>
      </div>

      {/* Chevron */}
      <ChevronRight className="size-4 text-fb-text-muted group-hover:text-fb-primary transition-colors" />
    </Link>
  );
}
