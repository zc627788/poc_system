import * as Icons from "lucide-react";
import type { LucideIcon } from "lucide-react";

export function MarketplaceCmsIcon({
  name,
  className,
  size = 20,
  strokeWidth = 1.8,
}: {
  name?: string | null;
  className?: string;
  size?: number;
  strokeWidth?: number;
}) {
  const Icon = ((name && Icons[name as keyof typeof Icons]) as LucideIcon | undefined) || Icons.FileText;
  return <Icon className={className} size={size} strokeWidth={strokeWidth} />;
}
