"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { Shield } from "lucide-react";

type FallbackType = "team" | "player";

interface SafeImageProps {
  src: string | undefined | null;
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
 * - If `src` is falsy, renders the appropriate fallback immediately.
 * - If the image fails to load (404, 502, network error), swaps to fallback
 *   via `onError` handler — no broken image icons.
 *
 * Fallback types:
 * - `"team"` → Shield icon (for team badges)
 * - `"player"` → First-letter circle (for player avatars)
 */
export function SafeImage({
  src,
  alt,
  width,
  height,
  className,
  fallbackType = "team",
  fallbackText,
  fallbackClassName,
}: SafeImageProps) {
  const [failed, setFailed] = useState(false);

  const handleError = useCallback(() => {
    setFailed(true);
  }, []);

  // Render fallback when src is missing or image failed to load
  if (!src || failed) {
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
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      onError={handleError}
    />
  );
}
