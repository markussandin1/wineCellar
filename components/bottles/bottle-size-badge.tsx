import { Badge } from "@/components/ui/badge";

interface BottleSizeBadgeProps {
  sizeInMl: number;
  className?: string;
}

export function BottleSizeBadge({ sizeInMl, className }: BottleSizeBadgeProps) {
  // Standard bottle (750ml) doesn't need a badge
  if (sizeInMl === 750) {
    return null;
  }

  const getSizeInfo = (ml: number) => {
    if (ml <= 375) {
      return { label: "Half Bottle", variant: "secondary" as const };
    } else if (ml === 1500) {
      return { label: "Magnum", variant: "default" as const };
    } else if (ml === 3000) {
      return { label: "Double Magnum", variant: "default" as const };
    } else if (ml > 3000) {
      return { label: "Large Format", variant: "default" as const };
    } else {
      // Non-standard sizes (e.g., 500ml, 1000ml)
      return { label: `${ml}ml`, variant: "outline" as const };
    }
  };

  const { label, variant } = getSizeInfo(sizeInMl);

  return (
    <Badge variant={variant} className={className}>
      {label}
    </Badge>
  );
}
