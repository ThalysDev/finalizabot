import React from "react";
import { cn } from "@/lib/cn";

/**
 * Container Component
 * Wrapper para limitar largura máxima e adicionar padding responsivo
 */

export interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  readonly size?: "sm" | "md" | "lg" | "xl";
  readonly children: React.ReactNode;
}

export const Container = React.forwardRef<HTMLDivElement, ContainerProps>(
  ({ size = "lg", className, children, ...props }, ref) => {
    const sizes = {
      sm: "max-w-2xl",
      md: "max-w-4xl",
      lg: "max-w-6xl",
      xl: "max-w-7xl",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "mx-auto w-full",
          "px-4 sm:px-6 lg:px-8",
          sizes[size],
          className,
        )}
        {...props}
      >
        {children}
      </div>
    );
  },
);

Container.displayName = "Container";
