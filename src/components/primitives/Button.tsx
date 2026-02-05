import React from "react";
import { cn } from "@/lib/cn";

/**
 * Button Component
 * Componente base para todos os botões da aplicação
 */

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  readonly variant?: "primary" | "secondary" | "ghost";
  readonly size?: "sm" | "md" | "lg";
  readonly isLoading?: boolean;
  readonly children: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      isLoading = false,
      disabled,
      className,
      children,
      ...props
    },
    ref,
  ) => {
    const baseStyles =
      "font-semibold rounded-md transition-colors duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2";

    const variants = {
      primary:
        "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 active:bg-blue-800",
      secondary:
        "bg-blue-100 text-blue-600 hover:bg-blue-200 focus:ring-blue-500 active:bg-blue-300",
      ghost:
        "bg-transparent text-blue-600 hover:bg-blue-50 focus:ring-blue-500 active:text-blue-700",
    };

    const sizes = {
      sm: "px-3 py-1.5 text-sm min-h-[32px]",
      md: "px-4 py-2.5 text-base min-h-[40px]",
      lg: "px-6 py-3 text-lg min-h-[48px]",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" />
            Carregando...
          </span>
        ) : (
          children
        )}
      </button>
    );
  },
);

Button.displayName = "Button";
