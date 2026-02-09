import type { LucideIcon } from "lucide-react";

interface BenefitCardProps {
  readonly icon: LucideIcon;
  readonly title: string;
  readonly description: string;
}

export function BenefitCard({
  icon: Icon,
  title,
  description,
}: BenefitCardProps) {
  return (
    <div className="group relative h-full flex flex-col gap-4 rounded-2xl border border-fb-border/60 bg-fb-card/80 backdrop-blur-sm p-6 transition-all duration-300 hover:border-fb-primary/30 hover:shadow-lg hover:shadow-fb-primary/5 hover:-translate-y-0.5">
      {/* Icon */}
      <div className="size-12 rounded-xl bg-fb-primary/10 border border-fb-primary/15 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
        <Icon className="size-5 text-fb-primary" />
      </div>
      <h3 className="text-base sm:text-lg font-bold text-fb-text">{title}</h3>
      <p className="text-sm text-fb-text-secondary leading-relaxed">
        {description}
      </p>
    </div>
  );
}

BenefitCard.displayName = "BenefitCard";
