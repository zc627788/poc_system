import type { HomeMarketplaceSummary, PageSection } from "@/types";
import type { SectionExtra, SummaryLinkConfig } from "./home-page-types";

const legacyAssetMap: Record<string, string> = {
  "/home-hero-ai-hackathon.png": "/home-banner-ai-hackathon.webp",
  "/home-hero-ai-torch-series.png": "/home-banner-ai-torch-series.webp",
  "/home-hero-community-space.png": "/home-banner-opc-community-space.webp",
  "/opc-community-mark.png": "/site-logo-opc-community.png",
  "/community-base-soft6.png": "/community-base-soft3.png",
};

export function resolveHeroImageUrl(imageUrl: string | null | undefined, highlightTitle: string, index: number) {
  const normalized = imageUrl?.trim() || "";
  return legacyAssetMap[normalized] || normalized;
}

export function pickText(value: string | null | undefined, fallback: string) {
  return value && value.trim() ? value : fallback;
}

export function parseExtra(extraJson?: string | null): SectionExtra {
  if (!extraJson) {
    return {};
  }

  try {
    return JSON.parse(extraJson) as SectionExtra;
  } catch (error) {
    console.error("Failed to parse section extra_json", error);
    return {};
  }
}

export function formatPublishDate(value: string) {
  return value.replace("T", " ").slice(0, 10);
}

export function joinClasses(...values: Array<string | undefined>) {
  return values.filter(Boolean).join(" ");
}

export function getMarketplaceGroup(summary: HomeMarketplaceSummary, key: string) {
  return summary.groups.find((item) => item.key === key) || null;
}

export function resolveSummaryLink(section: PageSection | null | undefined, fallbackHref: string): SummaryLinkConfig {
  const extra = parseExtra(section?.extra_json);
  const actionValue = extra.action_value === "/marketplace#tools-model-plaza" ? fallbackHref : extra.action_value;

  return {
    buttonText: pickText(extra.button_text, "查看更多"),
    actionType: extra.action_type || "internal",
    href: actionValue || fallbackHref
  };
}
