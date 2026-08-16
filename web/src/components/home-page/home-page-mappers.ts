import { Home } from "lucide-react";
import { articleTabs } from "@/lib/site-constants";
import type { Article, Banner, HomeMarketplaceSummary, PageSection, ServiceItem } from "@/types";
import { formatPublishDate, getMarketplaceGroup, parseExtra, pickText, resolveHeroImageUrl, resolveSummaryLink } from "./home-page-helpers";
import type {
  CommunityCard,
  ComputeProductItem,
  ComputeSummaryItem,
  DataResourceFeaturedItem,
  DataResourceSummaryItem,
  HeroSlide,
  MarketplaceViewModel,
  NewsItem,
  ScenarioCard,
  ServiceCard,
  ToolkitResourceItem
} from "./home-page-types";

const opcBusinessRegistrationTitle = "OPC工商注册";
const computePlatformTitle = "厦门市公共算力服务平台";
const scenarioBannerImageUrl = "/scene-innovation-banner.png";
const legacyScenarioImageUrls = new Set(["/home-hero-ai-torch-series.png", "/home-hero-community-space.png"]);
const homeServiceIconNamePattern = /^[A-Z][A-Za-z0-9]*$/;

function normalizeComputePlatformTitle(title?: string | null) {
  const trimmed = title?.trim() || "";
  if (!trimmed || trimmed === "普惠算力") {
    return computePlatformTitle;
  }
  return trimmed;
}

function resolveServiceImageSource(icon?: string | null) {
  const trimmed = icon?.trim() || "";
  if (!trimmed || homeServiceIconNamePattern.test(trimmed)) {
    return undefined;
  }
  return trimmed;
}

function isOpcBusinessRegistrationService(item: ServiceItem) {
  const targetValue = item.target_value?.trim().replace(/\/$/, "");
  return targetValue === "/setup";
}

function resolveScenarioImageUrl(imageUrl?: string) {
  const normalizedImageUrl = imageUrl?.trim();
  if (!normalizedImageUrl || legacyScenarioImageUrls.has(normalizedImageUrl)) {
    return scenarioBannerImageUrl;
  }

  return normalizedImageUrl;
}

export function buildSortedHomeSections(sections: PageSection[]) {
  return sections.filter((item) => item.page_key === "home").sort((a, b) => a.sort_order - b.sort_order);
}

export function buildHeroSlides(banners: Banner[]): HeroSlide[] {
  return [...banners]
    .sort((a, b) => a.sort_order - b.sort_order)
    .filter((item) => Boolean(item.image_url?.trim()))
    .map((item, index) => ({
      title: item.title?.trim() || "",
      subtitle: item.subtitle?.trim() || "",
      highlightTitle: item.highlight_title?.trim() || "",
      description: item.description?.trim() || "",
      imageUrl: resolveHeroImageUrl(item.image_url, item.highlight_title?.trim() || "", index),
      actionType: item.action_type || "none",
      actionValue: item.action_value || undefined
    }));
}

export function buildNewsByTab(articlesByTab: Record<string, Article[]>): Record<string, NewsItem[]> {
  return Object.fromEntries(
    articleTabs.map((tab) => {
      const items = articlesByTab[tab.code] || [];
      return [
        tab.code,
        items.map((item) => ({
          tag: tab.tag,
          title: pickText(item.title, ""),
          date: formatPublishDate(item.publish_at),
          href: item.external_url || "/news",
          target: item.link_type === "external" ? "_blank" : "_self"
        }))
      ];
    })
  ) as Record<string, NewsItem[]>;
}

export function buildServiceCards(serviceItems: ServiceItem[]): ServiceCard[] {
  const sortedItems = [...serviceItems].sort((a, b) => a.sort_order - b.sort_order);
  return sortedItems.map((item, index) => {
    const resolvedTitle = isOpcBusinessRegistrationService(item) ? opcBusinessRegistrationTitle : pickText(item.title, "");
    return {
      icon: Home,
      imageSrc: resolveServiceImageSource(item.icon),
      iconName: resolveServiceImageSource(item.icon) ? undefined : item.icon || undefined,
      title: resolvedTitle,
      desc: pickText(item.summary, ""),
      href: item.target_value || "/services",
      actionType: item.target_type || "internal"
    } satisfies ServiceCard;
  });
}

export function buildScenarioCards(sortedHomeSections: PageSection[]): ScenarioCard[] {
  const source = sortedHomeSections
    .filter((item) => item.section_key.startsWith("scenario_"))
    .sort((a, b) => a.sort_order - b.sort_order);

  return source.map((item) => {
    const extra = parseExtra(item.extra_json);

    return {
      title: pickText(item.title, ""),
      subtitle: pickText(item.subtitle, ""),
      desc: pickText(item.content, ""),
      href: extra.action_value || "",
      buttonText: pickText(extra.button_text, ""),
      bgFrom: extra.bg_from || "",
      bgTo: extra.bg_to || "",
      imageUrl: resolveScenarioImageUrl(extra.image_url)
    } satisfies ScenarioCard;
  });
}

export function buildCommunityCard(sortedHomeSections: PageSection[]): CommunityCard {
  const communitySection = sortedHomeSections.find((item) => item.section_key === "community_intro");
  const communityExtra = parseExtra(communitySection?.extra_json);

  return {
    title: pickText(communitySection?.title, ""),
    desc: pickText(communitySection?.content, ""),
    imageUrl: communityExtra.image_url || "",
    href: communityExtra.action_value || "/community",
    actionType: communityExtra.action_type || "internal"
  };
}

function buildFeaturedDataCard(marketplaceSummary: HomeMarketplaceSummary): DataResourceFeaturedItem | null {
  const marketplaceDataGroup = getMarketplaceGroup(marketplaceSummary, "data");
  const featuredCategory =
    marketplaceDataGroup?.categories.find((item) => item.code === "marketplace_city_dataspace") ||
    marketplaceDataGroup?.categories.find((item) => item.display_template === "featured_data");

  if (!featuredCategory) {
    return null;
  }

  return {
    code: featuredCategory.code,
    title: pickText(featuredCategory.name, ""),
    desc: pickText(featuredCategory.description, ""),
    href: featuredCategory.action_value || "/marketplace",
    actionType: featuredCategory.action_type || "internal",
    imageUrl: featuredCategory.image_url || undefined,
    buttonText: pickText(featuredCategory.button_text, "查看详情")
  };
}

function buildDataSummaryCards(marketplaceSummary: HomeMarketplaceSummary, featuredCode?: string): DataResourceSummaryItem[] {
  const marketplaceDataGroup = getMarketplaceGroup(marketplaceSummary, "data");
  const source = (marketplaceDataGroup?.categories || [])
    .filter((item) => item.code !== featuredCode)
    .sort((a, b) => a.sort_order - b.sort_order)
    .slice(0, 3);

  return source.map((item) => {
    return {
      code: item.code,
      title: pickText(item.name, ""),
      desc: pickText(item.description, ""),
      href: item.action_value || "/marketplace",
      actionType: item.action_type || "internal",
      imageUrl: item.image_url || undefined,
      buttonText: pickText(item.button_text, "查看详情")
    };
  });
}

function buildToolCards(marketplaceSummary: HomeMarketplaceSummary): ToolkitResourceItem[] {
  const marketplaceToolsGroup = getMarketplaceGroup(marketplaceSummary, "tools");
  const source = (marketplaceToolsGroup?.categories || []).sort((a, b) => a.sort_order - b.sort_order);
  return source.slice(0, 4).map((item) => {
    return {
      title: pickText(item.name, ""),
      desc: pickText(item.description, ""),
      href: item.action_value || "/marketplace",
      actionType: item.action_type || "internal"
    };
  });
}

function buildComputeSummary(marketplaceSummary: HomeMarketplaceSummary): ComputeSummaryItem | null {
  const marketplaceComputeGroup = getMarketplaceGroup(marketplaceSummary, "compute");
  const category = marketplaceComputeGroup?.categories[0];
  if (!category) {
    return null;
  }

  return {
    title: normalizeComputePlatformTitle(category.name),
    desc: pickText(category.description, ""),
    href: category.action_value || "/marketplace",
    actionType: category.action_type || "internal",
    imageUrl: category.image_url || undefined,
    buttonText: pickText(category.button_text, "查看更多")
  };
}

function buildComputeCards(marketplaceSummary: HomeMarketplaceSummary): ComputeProductItem[] {
  const marketplaceComputeGroup = getMarketplaceGroup(marketplaceSummary, "compute");
  const source = (marketplaceComputeGroup?.items || []).sort((a, b) => a.sort_order - b.sort_order);
  return source.map((item) => {
    return {
      title: pickText(item.title, ""),
      price: pickText(item.price, ""),
      unitLabel: pickText(item.unit_label, ""),
      badgeText: pickText(item.badge_text, ""),
      primaryButtonText: pickText(item.primary_button_text, "立即咨询"),
      secondaryButtonText: pickText(item.secondary_button_text, "立即购买"),
      primaryHref: item.link_value || "/marketplace",
      primaryActionType: item.link_type || "external",
      secondaryHref: item.secondary_link_value || "/marketplace",
      secondaryActionType: item.secondary_link_type || "external",
      meta: item.meta || {}
    } satisfies ComputeProductItem;
  });
}

export function buildMarketplaceViewModel(
  marketplaceSummary: HomeMarketplaceSummary,
  sortedHomeSections: PageSection[]
): MarketplaceViewModel {
  const marketplaceSection = marketplaceSummary.summary || sortedHomeSections.find((item) => item.section_key === "marketplace_summary");
  const marketplaceDataGroup = getMarketplaceGroup(marketplaceSummary, "data");
  const marketplaceToolsGroup = getMarketplaceGroup(marketplaceSummary, "tools");
  const marketplaceComputeGroup = getMarketplaceGroup(marketplaceSummary, "compute");

  const marketplaceDataSection =
    marketplaceDataGroup?.section || sortedHomeSections.find((item) => item.section_key === "marketplace_group_data");
  const marketplaceToolsSection =
    marketplaceToolsGroup?.section || sortedHomeSections.find((item) => item.section_key === "marketplace_group_tools");
  const marketplaceComputeSection =
    marketplaceComputeGroup?.section || sortedHomeSections.find((item) => item.section_key === "marketplace_group_compute");

  const featuredDataCard = buildFeaturedDataCard(marketplaceSummary);

  return {
    title: pickText(marketplaceSection?.title, ""),
    desc: pickText(marketplaceSection?.content, ""),
    dataSectionTitle: pickText(marketplaceDataSection?.title, ""),
    dataLink: resolveSummaryLink(marketplaceDataSection, "/marketplace#marketplace-data"),
    featuredDataCard,
    dataSummaryCards: buildDataSummaryCards(marketplaceSummary, featuredDataCard?.code),
    toolsSectionTitle: pickText(marketplaceToolsSection?.title, ""),
    toolsLink: resolveSummaryLink(marketplaceToolsSection, "/marketplace#marketplace-tools"),
    toolCards: buildToolCards(marketplaceSummary),
    computeSectionTitle: pickText(marketplaceComputeSection?.title, ""),
    computeLink: resolveSummaryLink(marketplaceComputeSection, "/marketplace#marketplace-compute"),
    computeSummary: buildComputeSummary(marketplaceSummary),
    computeCards: buildComputeCards(marketplaceSummary)
  };
}
