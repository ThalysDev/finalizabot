import Image from "next/image";
import { Shield } from "lucide-react";

export interface MatchBannerProps {
  homeTeam: string;
  awayTeam: string;
  competition: string;
  matchDate?: string;
  homeScore?: number;
  awayScore?: number;
  minute?: number;
  isLive?: boolean;
  homeBadgeUrl?: string;
  awayBadgeUrl?: string;
}

export function MatchBanner({
  homeTeam,
  awayTeam,
  competition,
  matchDate,
  homeScore,
  awayScore,
  minute,
  isLive = false,
  homeBadgeUrl,
  awayBadgeUrl,
}: MatchBannerProps) {
  return (
    <div className="rounded-2xl bg-linear-to-r from-fb-primary/8 via-fb-surface/80 to-fb-primary/8 border border-fb-border/60 p-4 md:p-6 backdrop-blur-sm">
      <div className="flex items-center justify-between">
        {/* Home team */}
        <div className="flex items-center gap-3 flex-1">
          <div className="size-10 md:size-12 rounded-full bg-linear-to-br from-fb-surface-lighter to-fb-surface flex items-center justify-center overflow-hidden border border-fb-border/50">
            {homeBadgeUrl ? (
              <Image
                src={homeBadgeUrl}
                alt={homeTeam}
                width={32}
                height={32}
                className="size-8 object-contain"
              />
            ) : (
              <Shield className="size-5 text-fb-text-muted" />
            )}
          </div>
          <div>
            <h3 className="text-fb-text font-bold text-sm md:text-base">
              {homeTeam}
            </h3>
            <p className="text-fb-text-muted text-xs">Casa</p>
          </div>
        </div>

        {/* Score / VS */}
        <div className="flex flex-col items-center px-4 md:px-8">
          {homeScore !== undefined && awayScore !== undefined ? (
            <>
              <div className="flex items-center gap-3">
                <span className="text-fb-text font-bold text-2xl md:text-3xl">
                  {homeScore}
                </span>
                <span className="text-fb-text-muted text-lg">-</span>
                <span className="text-fb-text font-bold text-2xl md:text-3xl">
                  {awayScore}
                </span>
              </div>
              {isLive && minute !== undefined && (
                <div className="flex items-center gap-2 mt-1">
                  <span className="size-2 rounded-full bg-fb-accent-red animate-pulse" />
                  <span className="text-fb-accent-red text-xs font-bold">
                    {minute}&apos;
                  </span>
                </div>
              )}
            </>
          ) : (
            <span className="text-fb-text-muted font-bold text-lg">VS</span>
          )}
          <p className="text-fb-text-muted text-[10px] uppercase tracking-wider mt-1">
            {competition}
          </p>
          {matchDate && (
            <p className="text-fb-text-muted text-[10px]">{matchDate}</p>
          )}
        </div>

        {/* Away team */}
        <div className="flex items-center gap-3 flex-1 justify-end">
          <div className="text-right">
            <h3 className="text-fb-text font-bold text-sm md:text-base">
              {awayTeam}
            </h3>
            <p className="text-fb-text-muted text-xs">Fora</p>
          </div>
          <div className="size-10 md:size-12 rounded-full bg-fb-surface-lighter flex items-center justify-center overflow-hidden">
            {awayBadgeUrl ? (
              <Image
                src={awayBadgeUrl}
                alt={awayTeam}
                width={32}
                height={32}
                className="size-8 object-contain"
              />
            ) : (
              <Shield className="size-5 text-fb-text-muted" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
