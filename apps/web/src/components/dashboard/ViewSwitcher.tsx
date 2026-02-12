"use client";

import { LayoutGrid, List } from "lucide-react";

interface ViewSwitcherProps {
  view: "grid" | "list";
  onChange: (view: "grid" | "list") => void;
}

export function ViewSwitcher({ view, onChange }: ViewSwitcherProps) {
  return (
    <div className="flex items-center gap-1 p-1 bg-fb-surface border border-fb-border/40 rounded-lg">
      <button
        onClick={() => onChange("grid")}
        className={`p-2 rounded transition-colors ${
          view === "grid"
            ? "bg-fb-primary text-white"
            : "text-fb-text-muted hover:text-fb-text"
        }`}
        aria-label="Visualização em grade"
      >
        <LayoutGrid className="size-4" />
      </button>
      <button
        onClick={() => onChange("list")}
        className={`p-2 rounded transition-colors ${
          view === "list"
            ? "bg-fb-primary text-white"
            : "text-fb-text-muted hover:text-fb-text"
        }`}
        aria-label="Visualização em lista"
      >
        <List className="size-4" />
      </button>
    </div>
  );
}
