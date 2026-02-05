/**
 * Class Name Utility
 * Merge Tailwind classes inteligentemente, removendo conflitos
 */

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}
