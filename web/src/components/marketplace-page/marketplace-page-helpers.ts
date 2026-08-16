import type { PageSection, ResourceCategory, ResourceItem } from "@/types";
import { apiFeatureTags, apiPricingTags } from "./marketplace-page-data";
import type { MarketplaceMeta } from "./marketplace-page-types";

export function getSection(sections: PageSection[], sectionKey: string) {
  return sections.find((item) => item.section_key === sectionKey);
}

export function matchesKeyword(item: ResourceItem, keyword: string) {
  if (!keyword.trim()) {
    return true;
  }

  const meta = item.meta as MarketplaceMeta;
  const text = [
    item.title,
    item.summary,
    item.price,
    item.badge_text,
    item.status_text,
    ...(item.tags || []),
    meta.type,
    meta.owner,
    meta.tag,
    meta.label,
    meta.logo_text,
    meta.sub_text,
    ...(meta.items || []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return text.includes(keyword.trim().toLowerCase());
}

export function groupCategories(categories: ResourceCategory[], groupKey: string) {
  return categories
    .filter((item) => item.group_key === groupKey)
    .sort((a, b) => a.sort_order - b.sort_order);
}

export function asStringList(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(/[,，\n]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

export function getModelTags(item: ResourceItem, meta: MarketplaceMeta) {
  return [...asStringList(item.tags), ...asStringList(meta.items)].filter(
    (tag, index, list) => list.indexOf(tag) === index
  );
}

export function getModelAvatarText(item: ResourceItem, meta: MarketplaceMeta) {
  const text = meta.logo_text || meta.vendor || item.title;
  return text.replace(/\s+/g, "").slice(0, 2).toUpperCase();
}

export function getModelTagClass(tag: string, index: number) {
  if (tag.includes("语言") || tag.includes("视频") || tag.includes("图像") || index === 0) {
    return "bg-[#fff1f3] text-[#f0526e]";
  }
  return "bg-[#eaf0ff] text-[#4b72f0]";
}

export function normalizeMcpHeroTitle(title?: string | null) {
  const normalized = title?.trim();
  if (!normalized) return "MCP标准连接服务";
  return normalized === "MCP 标准连接服务" ? "MCP标准连接服务" : normalized;
}

export function normalizeApiHeroTitle(title?: string | null) {
  const normalized = title?.trim();
  if (!normalized) return "API服务";
  return normalized === "API 服务市场" || normalized === "API服务市场" ? "API服务" : normalized;
}

export function normalizeApiTags(tags: string[]) {
  const normalizedTags = tags.map((tag) => tag.trim()).filter(Boolean);
  const priceTag = normalizedTags.find((tag) => apiPricingTags.includes(tag));
  const featureTags = apiFeatureTags.filter((tag) => normalizedTags.includes(tag));
  const customTags = normalizedTags.filter((tag) => !apiPricingTags.includes(tag) && !apiFeatureTags.includes(tag));
  return [...(priceTag ? [priceTag] : []), ...featureTags, ...customTags].filter(
    (tag, index, list) => list.indexOf(tag) === index
  );
}

export function getApiTagClass(tag: string) {
  if (tag === "付费") return "bg-[#fff1f3] text-[#f0526e]";
  if (tag === "免费") return "bg-[#fff6d8] text-[#d69600]";
  if (tag === "企业专用") return "bg-[#eaf2ff] text-[#2d72e8]";
  if (tag === "个人高级认证") return "bg-[#e9f8ee] text-[#1d9c55]";
  if (tag === "支持MCP") return "bg-[#eaf0ff] text-[#4b72f0]";
  return "bg-[#f3f6fa] text-[#6a778b]";
}
