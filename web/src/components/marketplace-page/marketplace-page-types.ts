import type { ReactNode } from "react";

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

export type MarketplaceMeta = {
  type?: string;
  owner?: string;
  tag?: string;
  status?: string;
  publish_date?: string;
  label?: string;
  items?: string[];
  tools?: string[];
  button_text?: string;
  logo_text?: string;
  sub_text?: string;
  vendor?: string;
  highlight?: string;
};

export type MetaRow = {
  label?: string | null;
  value?: string | null;
};

export type MarketplaceLeftCardScale = {
  columnWidthClass: string;
  heightClass: string;
  paddingClass: string;
  iconWrapperClass: string;
  iconSize: number;
  titleWidthClass: string;
  titleTextClass: string;
  descriptionClass: string;
};

export type ComputeCard = {
  name: string;
  price: string;
  priceColor: string;
  region: string;
  server: string;
  gpuCards: string;
  vcpuCores: string;
  memory: string;
  gpuMemory: string;
  storage: string;
};

export type MarketplaceUnifiedCardProps = {
  icon?: string | null;
  title: string;
  summary: string;
  tags?: string[];
  metaRows?: Array<{ label: string; value?: string | null }>;
  footer?: ReactNode;
  className?: string;
};
