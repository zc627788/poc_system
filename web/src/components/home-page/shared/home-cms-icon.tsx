"use client";

import { AppWindow } from "lucide-react";
import * as LucideIcons from "lucide-react";
import type { LucideIcon } from "lucide-react";

type HomeCmsIconProps = {
  name?: string | null;
  className?: string;
  size?: number;
  strokeWidth?: number;
};

export function HomeCmsIcon({ name, className, size = 20, strokeWidth = 1.9 }: HomeCmsIconProps) {
  const Icon = ((name && LucideIcons[name as keyof typeof LucideIcons]) as LucideIcon | undefined) || AppWindow;
  return <Icon className={className} size={size} strokeWidth={strokeWidth} />;
}
