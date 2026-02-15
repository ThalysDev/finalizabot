"use client";

import { cn } from "@/lib/utils";

interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: string;
  className?: string;
  thumbClassName?: string;
  disabled?: boolean;
}

export function Switch({
  checked,
  onCheckedChange,
  label,
  className,
  thumbClassName,
  disabled = false,
}: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => {
        if (!disabled) onCheckedChange(!checked);
      }}
      className={cn(
        "w-8 h-4 rounded-full relative transition-colors",
        checked ? "bg-fb-primary" : "bg-fb-surface-highlight",
        disabled && "opacity-50 cursor-not-allowed",
        className,
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 size-3 rounded-full bg-white transition-transform",
          checked ? "translate-x-4" : "translate-x-0.5",
          thumbClassName,
        )}
      />
    </button>
  );
}
