import { Card } from "@/components/primitives";

interface BenefitCardProps {
  readonly icon: string;
  readonly title: string;
  readonly description: string;
}

export function BenefitCard({ icon, title, description }: BenefitCardProps) {
  return (
    <Card
      variant="elevated"
      padding="md"
      className="hover:shadow-lg transition-shadow duration-200"
    >
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-lg font-semibold text-neutral-900 mb-2">{title}</h3>
      <p className="text-sm text-neutral-600 leading-relaxed">{description}</p>
    </Card>
  );
}

BenefitCard.displayName = "BenefitCard";
