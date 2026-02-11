"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { Shield } from "lucide-react";

type FallbackType = "team" | "player";

interface SafeImageProps {
  src: string | undefined | null;
  /** Optional additional URLs to try before rendering the final fallback */
  fallbackSrcs?: (string | undefined | null)[];
  alt: string;
  width: number;
  height: number;
  className?: string;
  fallbackType?: FallbackType;
  /** Text to display in the player initial fallback (defaults to first char of alt) */
  fallbackText?: string;
  /** Extra classes for the fallback container (only used when fallback renders) */
  fallbackClassName?: string;
}

/**
 * Resilient image wrapper around `next/image`.
 *
 * - If `src` is falsy, tries each `fallbackSrcs` URL in order.
 * - If all URLs fail to load, renders the appropriate fallback.
 *
 * Fallback types:
 * - `"team"` → Shield icon (for team badges)
 * - `"player"` → First-letter circle (for player avatars)
 */
export function SafeImage({
  src,
  fallbackSrcs,
  alt,
  width,
  height,
  className,
  fallbackType = "team",
  fallbackText,
  fallbackClassName,
}: SafeImageProps) {
  // Build source chain: primary → fallback URLs
  const sources = [src, ...(fallbackSrcs ?? [])].filter(
    (s): s is string => !!s,
  );

  const [srcIndex, setSrcIndex] = useState(0);

  const handleError = useCallback(() => {
    setSrcIndex((prev) => prev + 1);
  }, []);

  const currentSrc = sources[srcIndex];

  // Render fallback when all sources exhausted
  if (!currentSrc) {
    if (fallbackType === "player") {
      const initial = (fallbackText ?? alt ?? "?").charAt(0).toUpperCase();
      return (
        <span
          className={
            fallbackClassName ??
            "text-fb-primary text-lg font-bold flex items-center justify-center w-full h-full"
          }
          aria-hidden="true"
        >
          {initial}
        </span>
      );
    }
    // team fallback
    return (
      <Shield
        className={fallbackClassName ?? "size-5 text-fb-text-muted"}
        aria-hidden="true"
      />
    );
  }

  return (
    <Image
      src={currentSrc}
      alt={alt}
      width={width}
      height={height}
      className={className}
      onError={handleError}
      unoptimized={currentSrc.startsWith("/api/")}
    />
  );
}
