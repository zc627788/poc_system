import type { LucideIcon } from "lucide-react";
import type { Article, Banner, HomeMarketplaceSummary, PageSection, ServiceItem } from "@/types";

export type HomePageViewProps = {
  articlesByTab: Record<string, Article[]>;
  banners: Banner[];
  marketplaceSummary: HomeMarketplaceSummary;
  sections: PageSection[];
  serviceItems: ServiceItem[];
};

export type SectionExtra = {
  button_text?: string;
  action_type?: string;
  action_value?: string;
  image_url?: string;
  bg_from?: string;
  bg_to?: string;
};

export type HeroSlide = {
  title: string;
  subtitle: string;
  highlightTitle: string;
  description: string;
  imageUrl: string;
  actionType?: string;
  actionValue?: string;
};

export type NewsItem = {
  tag: string;
  title: string;
  date: string;
  href: string;
  target: "_self" | "_blank";
};

export type ServiceCard = {
  icon: LucideIcon;
  imageSrc?: string;
  iconName?: string;
  title: string;
  desc: string;
  href: string;
  actionType: string;
};

export type ToolkitCard = {
  title: string;
  desc: string;
  href: string;
};

export type MarketplaceItemMeta = {
  region?: string;
  server?: string;
  gpu_cards?: string;
  vcpu_cores?: string;
  memory?: string;
  gpu_memory?: string;
  storage?: string;
  vendor?: string;
  highlight?: string;
};

export type SummaryLinkConfig = {
  buttonText: string;
  actionType: string;
  href: string;
};

export type ScenarioCard = {
  title: string;
  subtitle: string;
  desc: string;
  href: string;
  buttonText: string;
  bgFrom: string;
  bgTo: string;
  imageUrl?: string;
};

export type CommunityCard = {
  title: string;
  desc: string;
  imageUrl: string;
  href: string;
  actionType: string;
};

export type DataResourceFeaturedItem = {
  code: string;
  title: string;
  desc: string;
  href: string;
  actionType: string;
  imageUrl?: string;
  buttonText: string;
};

export type DataResourceSummaryItem = {
  code: string;
  title: string;
  desc: string;
  href: string;
  actionType: string;
  imageUrl?: string;
  buttonText: string;
};

export type ToolkitResourceItem = {
  title: string;
  desc: string;
  href: string;
  actionType: string;
};

export type ComputeSummaryItem = {
  title: string;
  desc: string;
  href: string;
  actionType: string;
  imageUrl?: string;
  buttonText: string;
};

export type ComputeProductItem = {
  title: string;
  price: string;
  unitLabel: string;
  badgeText: string;
  primaryButtonText: string;
  secondaryButtonText: string;
  primaryHref: string;
  primaryActionType: string;
  secondaryHref: string;
  secondaryActionType: string;
  meta: MarketplaceItemMeta;
};

export type MarketplaceViewModel = {
  title: string;
  desc: string;
  dataSectionTitle: string;
  dataLink: SummaryLinkConfig;
  featuredDataCard: DataResourceFeaturedItem | null;
  dataSummaryCards: DataResourceSummaryItem[];
  toolsSectionTitle: string;
  toolsLink: SummaryLinkConfig;
  toolCards: ToolkitResourceItem[];
  computeSectionTitle: string;
  computeLink: SummaryLinkConfig;
  computeSummary: ComputeSummaryItem | null;
  computeCards: ComputeProductItem[];
};
