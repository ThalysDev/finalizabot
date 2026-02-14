import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface StatePanelProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
  iconClassName?: string;
}

export function StatePanel({
  icon: Icon,
  title,
  description,
  action,
  className,
  iconClassName,
}: StatePanelProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center py-20 text-center ${className ?? ""}`}
    >
      <div className={`size-16 rounded-full bg-fb-surface flex items-center justify-center mb-4 ${iconClassName ?? ""}`}>
        <Icon className="size-8 text-fb-text-muted" />
      </div>
      <h3 className="text-fb-text font-semibold text-lg mb-2">{title}</h3>
      <p className="text-fb-text-muted text-sm max-w-md">{description}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
