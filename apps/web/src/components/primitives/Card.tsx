import React from "react";
import { cn } from "@/lib/utils";

/**
 * Card Component
 * Wrapper base para cards com styling consistente
 */

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  readonly variant?: "default" | "elevated" | "outline";
  readonly padding?: "none" | "sm" | "md" | "lg";
  readonly children: React.ReactNode;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    { variant = "default", padding = "md", className, children, ...props },
    ref,
  ) => {
    const baseStyles = "bg-white rounded-lg transition-all duration-200";

    const variants = {
      default: "border border-neutral-200",
      elevated: "shadow-card",
      outline: "border-2 border-neutral-200 hover:border-blue-400",
    };

    const paddings = {
      none: "p-0",
      sm: "p-3",
      md: "p-6",
      lg: "p-8",
    };

    return (
      <div
        ref={ref}
        className={cn(
          baseStyles,
          variants[variant],
          paddings[padding],
          className,
        )}
        {...props}
      >
        {children}
      </div>
    );
  },
);

Card.displayName = "Card";
