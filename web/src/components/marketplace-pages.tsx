"use client";

import * as Icons from "lucide-react";
import { Children, useEffect, useMemo, useState, type ReactNode } from "react";
import { MobileComputeMarketplaceModule } from "@/components/mobile-compute-marketplace-module";
import { ScrollToTopLink } from "@/components/scroll-to-top-link";
import { SharedSearchActionCard } from "@/components/shared-search-action-card";
import type { PageSection, ResourceCategory, ResourceItem } from "@/types";
import { compactMarketplaceLeftCardScale } from "./marketplace-page/marketplace-page-data";
import {
  asStringList,
  getApiTagClass,
  getModelAvatarText,
  getModelTagClass,
  getModelTags,
  getSection,
  groupCategories,
  matchesKeyword,
  normalizeApiTags,
} from "./marketplace-page/marketplace-page-helpers";
import type { MarketplaceLeftCardScale, MarketplaceMeta, MetaRow } from "./marketplace-page/marketplace-page-types";
import { MarketplaceActionButton as ActionButton } from "./marketplace-page/shared/marketplace-action-button";
import { MarketplaceBreadcrumbs as Breadcrumbs } from "./marketplace-page/shared/marketplace-breadcrumbs";
import { MarketplaceCmsIcon as CmsIcon } from "./marketplace-page/shared/marketplace-cms-icon";
import { MarketplaceSectionHeader } from "./marketplace-page/shared/marketplace-section-header";

type MarketplaceTabKey = "data" | "tools" | "compute";
const TOOL_CATEGORY_COLLAPSED_COUNT = 4;
const COMPUTE_PLATFORM_TITLE = "厦门市公共算力服务平台";

function normalizeComputePlatformTitle(title?: string | null) {
  const trimmed = title?.trim() || "";
  if (!trimmed || trimmed === "普惠算力") {
    return COMPUTE_PLATFORM_TITLE;
  }
  return trimmed;
}

const toolCategoryDisplayConfig: Record<string, { name: string; description: string; actionValue: string; order: number }> = {
  marketplace_tools: {
    name: "热门推荐",
    description: "精选高频 AI 工具与创业团队常用能力，覆盖项目启动、产品搭建、运营增长等场景，帮助快速找到可直接使用的工具入口。",
    actionValue: "/marketplace/tools",
    order: 1,
  },
  marketplace_api: {
    name: "AI编程工具",
    description: "面向代码生成、接口调试、研发协作与自动化开发流程，提供适合创业团队快速接入的 AI 编程工具。",
    actionValue: "/marketplace/tools/API",
    order: 2,
  },
  marketplace_mcp: {
    name: "AI办公套件",
    description: "聚合文档处理、内容创作、知识管理与流程自动化工具，让日常办公和团队协作更高效。",
    actionValue: "/marketplace/tools/MCP",
    order: 3,
  },
  marketplace_model_plaza: {
    name: "大模型服务",
    description: "汇聚主流大模型与多模态能力入口，支持模型体验、能力对比和业务场景接入。",
    actionValue: "/marketplace/tools/model-plaza",
    order: 4,
  },
};

function getToolCategoryDisplay(category: ResourceCategory): ResourceCategory {
  const config = toolCategoryDisplayConfig[category.code];

  if (!config) {
    return category;
  }

  return {
    ...category,
    name: config.name,
    description: config.description,
    action_type: "internal",
    action_value: config.actionValue,
  };
}

function compareToolCategories(a: ResourceCategory, b: ResourceCategory) {
  return (toolCategoryDisplayConfig[a.code]?.order || a.sort_order || 99) - (toolCategoryDisplayConfig[b.code]?.order || b.sort_order || 99);
}

function getToolCategorySectionId(categoryCode: string) {
  const sectionIds: Record<string, string> = {
    marketplace_tools: "marketplace-tools-hot",
    marketplace_api: "marketplace-tools-coding",
    marketplace_mcp: "marketplace-tools-office",
    marketplace_model_plaza: "marketplace-tools-model",
  };

  return sectionIds[categoryCode] || "marketplace-tools";
}

function getMarketplaceTabFromHash(hash: string): MarketplaceTabKey | null {
  if (hash === "#marketplace-data") {
    return "data";
  }

  if (hash === "#marketplace-compute") {
    return "compute";
  }

  if (
    hash === "#marketplace-tools" ||
    hash === "#tools-model-plaza" ||
    hash === "#marketplace-tools-hot" ||
    hash === "#marketplace-tools-coding" ||
    hash === "#marketplace-tools-office" ||
    hash === "#marketplace-tools-model"
  ) {
    return "tools";
  }

  return null;
}

function MarketplaceCompactInfoCard({
  title,
  summary,
  metaRows,
  publishDate,
  typeBadge,
  typeBadgeClassName = "border-transparent bg-[rgba(255,237,98,0.26)] text-[#D69A00]",
  featureItems,
  enableFeatureList = false,
  showDividerWithoutFooter = false,
  className = "",
}: {
  title?: string | null;
  summary?: string | null;
  metaRows?: MetaRow[];
  publishDate?: string | null;
  typeBadge?: string | null;
  typeBadgeClassName?: string;
  featureItems?: string[] | null;
  enableFeatureList?: boolean;
  showDividerWithoutFooter?: boolean;
  className?: string;
}) {
  const visibleMetaRows = (metaRows || []).filter((row) => row.label && row.value);
  const primaryMeta = visibleMetaRows[0];
  const secondaryMeta = visibleMetaRows[1];
  const visibleFeatureItems = enableFeatureList ? (featureItems || []).filter(Boolean).slice(0, 3) : [];
  const hasFooter = Boolean(typeBadge || publishDate);
  const shouldShowDivider = hasFooter || showDividerWithoutFooter;
  const summaryClassName = visibleFeatureItems.length > 0
    ? "h-[133px] sm:h-[88px]"
    : "h-[133px] sm:h-[96px]";

  return (
    <div
      className={`group flex h-[320px] flex-col overflow-hidden rounded-[21px] border border-[rgba(226,232,244,1)] bg-[rgba(255,255,255,1)] px-4 pb-4 pt-4 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg sm:h-[290px] sm:px-5 lg:h-[252px] xl:h-[268px] ${className}`}
    >
      {title ? (
        <div className="mb-[10px] sm:mb-3">
          <h3 className="min-w-0 truncate text-[14px] font-semibold leading-[20px] text-[#1F1F1F] sm:text-[16px] sm:leading-[23px]">{title}</h3>
        </div>
      ) : null}

      {visibleMetaRows.length > 0 ? (
        <div className="mb-[10px] flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] leading-[15px] text-[#A7AFBF] sm:mb-3 sm:gap-x-6 sm:gap-y-2 sm:text-[12px] sm:leading-[17px]">
          {primaryMeta ? (
            <div className="flex min-w-0 items-center gap-1.5">
              {primaryMeta.label ? <span className="shrink-0">{primaryMeta.label}</span> : null}
              {primaryMeta.value ? <span className="truncate text-[#6B7A99]">{primaryMeta.value}</span> : null}
            </div>
          ) : null}
          {secondaryMeta ? (
            <div className="flex min-w-0 items-center gap-1.5">
              {secondaryMeta.label ? <span className="shrink-0">{secondaryMeta.label}</span> : null}
              {secondaryMeta.value ? <span className="truncate text-[#6B7A99]">{secondaryMeta.value}</span> : null}
            </div>
          ) : null}
        </div>
      ) : null}

      {summary ? <p className={`${summaryClassName} overflow-hidden text-[12px] leading-[19px] text-[#4B5565] sm:text-[13px] sm:leading-[24px] lg:h-auto lg:line-clamp-3`}>{summary}</p> : null}

      {/* 开关说明：将 enableFeatureList 设为 true，且提供 featureItems 后，才显示下方三条特点介绍。 */}
      {visibleFeatureItems.length > 0 ? (
        <div className="mt-2 space-y-1.5 sm:mt-3 sm:space-y-2 lg:mt-4 lg:space-y-2.5">
          {visibleFeatureItems.map((feature) => (
            <div className="flex items-start gap-2" key={feature}>
              <img alt="特点标签" className="mt-[3px] h-[14px] w-[14px] shrink-0" src="/smalltag.png" />
              <span className="text-[12px] font-medium leading-[19px] text-[#1F1F1F] sm:text-[13px] sm:leading-[21px] lg:leading-[22px]">{feature}</span>
            </div>
          ))}
        </div>
      ) : null}

      {shouldShowDivider ? (
        <div className="mt-auto pt-[8px] sm:pt-3 lg:pt-4">
          <div className="h-px w-full max-w-[320px] rounded-none bg-[#E2E8F4]" />
          {hasFooter ? (
            <div className="mt-2 flex flex-col gap-1.5 sm:mt-3 sm:gap-2 sm:flex-row sm:items-center sm:justify-between lg:mt-4 lg:gap-3">
              {typeBadge ? (
                <span className={`inline-flex h-[24px] min-w-[64px] items-center justify-center rounded-[8px] border px-[8px] text-[10px] font-medium leading-none sm:h-[27px] sm:min-w-[72px] sm:px-3 sm:text-[11px] lg:h-[29px] lg:min-w-[75px] lg:text-[12px] ${typeBadgeClassName}`}>
                  {typeBadge}
                </span>
              ) : (
                <span />
              )}
              {publishDate ? <span className="min-w-0 break-all text-left text-[11px] font-normal leading-[16px] text-[#4B5565] sm:text-[12px] sm:leading-[18px] sm:break-normal lg:text-[13px] lg:leading-[24px]">发布日期:{publishDate}</span> : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function MarketplaceLeftCategoryCard({
  category,
  scale = compactMarketplaceLeftCardScale,
}: {
  category: ResourceCategory;
  scale?: MarketplaceLeftCardScale;
}) {
  return (
    <div
      className={`group relative flex flex-col overflow-hidden rounded-[21px] border border-[rgba(226,232,244,1)] bg-[linear-gradient(145deg,#f8fbff_0%,#eef4ff_45%,#e5efff_100%)] shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_56px_rgba(0,82,255,0.10)] ${scale.heightClass} ${scale.paddingClass}`}
    >
      <div className="pointer-events-none absolute left-0 top-0 h-[140px] w-[140px] rounded-br-[120px] bg-[radial-gradient(circle_at_top_left,rgba(0,82,255,0.16),rgba(0,82,255,0.02)_62%,transparent_72%)]" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-[180px] w-[180px] rounded-tl-[150px] bg-[radial-gradient(circle_at_bottom_right,rgba(0,82,255,0.18),rgba(0,82,255,0.04)_58%,transparent_74%)]" />
      <img
        alt="资源集市分类背景"
        className="pointer-events-none absolute inset-0 h-full w-full object-cover object-[calc(100%+60px)_top]"
        src="/market-left.png"
      />
      <div className="relative z-10 flex h-full flex-col pb-[56px] sm:pb-[65px]">
        <h4 className={`${scale.titleWidthClass} line-clamp-2 font-semibold text-[#000000] ${scale.titleTextClass}`}>{category.name}</h4>
        <p className={`${scale.descriptionClass} text-[#6B7A99] lg:line-clamp-4`}>{category.description}</p>
      </div>

      <div className="absolute bottom-[18px] left-[18px] z-10 flex justify-start sm:bottom-[25px] sm:left-[25px]">
        <ActionButton
          actionType={category.action_type}
          className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#111111] bg-white text-[#111111] transition-transform duration-300 group-hover:translate-x-1 sm:h-8 sm:w-8"
          href={category.action_value}
        >
          <Icons.ArrowRight size={16} strokeWidth={2.8} />
        </ActionButton>
      </div>
    </div>
  );
}

function MarketplaceRightCardGrid({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const items = Children.toArray(children);
  const remainder = items.length % 3;
  const shouldBalanceLastRow = items.length > 3 && remainder !== 0;

  const getPlacementClass = (index: number) => {
    if (!shouldBalanceLastRow) {
      return "";
    }

    if (remainder === 1 && index === items.length - 1) {
      return "xl:col-start-2";
    }

    if (remainder === 2 && index === items.length - 2) {
      return "xl:col-start-2";
    }

    return "";
  };

  return (
    <div className={`grid w-full flex-1 grid-cols-2 gap-4 sm:gap-5 xl:grid-cols-3 ${className}`}>
      {items.map((child, index) => (
        <div className={`min-w-0 [&>*]:block [&>*]:h-full ${getPlacementClass(index)}`} key={`marketplace-right-card-${index}`}>
          {child}
        </div>
      ))}
    </div>
  );
}

function MarketplaceEntryRow({
  category,
  children,
  leftCardScale = compactMarketplaceLeftCardScale,
  isStretch = false,
}: {
  category: ResourceCategory;
  children: ReactNode;
  leftCardScale?: MarketplaceLeftCardScale;
  isStretch?: boolean;
}) {
  return (
    <div className="mb-10">
      <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:hidden [&>*]:min-w-0">
        <MarketplaceLeftCategoryCard category={category} scale={leftCardScale} />
        {children}
      </div>

      <div className={`hidden flex-col gap-6 lg:flex lg:flex-row lg:flex-nowrap ${isStretch ? "lg:items-stretch" : "lg:items-start"}`}>
        <div className={`w-full ${leftCardScale.columnWidthClass} lg:shrink-0`}>
          <MarketplaceLeftCategoryCard category={category} scale={leftCardScale} />
        </div>
        <MarketplaceRightCardGrid>
          {children}
        </MarketplaceRightCardGrid>
      </div>
    </div>
  );
}

function ModelPlazaCard({ item, defaultHref }: { item: ResourceItem; defaultHref?: string }) {
  const meta = item.meta as MarketplaceMeta;
  const tags = getModelTags(item, meta);
  const content = (
    <article className="flex h-[240px] flex-col overflow-hidden rounded-[6px] bg-white px-[12px] py-[12px] transition-all duration-300 hover:-translate-y-[2px] hover:shadow-[0_10px_24px_rgba(15,23,42,0.08)] sm:h-[260px] lg:h-[188px] lg:flex-row lg:px-[14px] lg:py-[14px]">
      <div className="mb-[10px] flex items-center gap-[10px] lg:mb-0 lg:mr-[12px] lg:block">
        <div className="flex h-[34px] w-[34px] shrink-0 items-center justify-center overflow-hidden rounded-[4px] border border-dashed border-[#b9c3d2] bg-white lg:h-[38px] lg:w-[38px]">
          {item.image_url ? (
            <img alt={`${item.title} 头像`} className="h-full w-full object-contain" src={item.image_url} />
          ) : item.icon ? (
            <CmsIcon className="text-[#64748b]" name={item.icon} size={19} strokeWidth={1.8} />
          ) : (
            <span className="text-[12px] font-bold text-[#1f2937]">{getModelAvatarText(item, meta)}</span>
          )}
        </div>
        <h3 className="min-w-0 truncate text-[14px] font-semibold leading-[19px] text-[#2a3038] lg:hidden">{item.title}</h3>
      </div>

      <div className="min-w-0 flex flex-1 flex-col">
        <h3 className="hidden truncate text-[17px] font-semibold leading-[22px] text-[#2a3038] lg:block">{item.title}</h3>
        <p className="min-h-0 flex-1 overflow-hidden text-[12px] leading-[18px] text-[#6b7280] lg:mt-[4px] lg:line-clamp-2">
          {meta.highlight || item.summary}
        </p>
        <div className="mt-auto flex min-h-[18px] flex-nowrap gap-[4px] pt-[10px] lg:mt-[10px] lg:min-h-[20px] lg:flex-wrap lg:gap-[6px] lg:pt-0">
          {tags.slice(0, 2).map((tag, index) => (
            <span
              className={`inline-flex h-[18px] min-w-0 flex-1 items-center justify-center rounded-[4px] px-[4px] text-[8px] font-medium leading-none lg:h-[20px] lg:flex-none lg:px-[8px] lg:text-[10px] ${getModelTagClass(tag, index)}`}
              key={tag}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </article>
  );

  // 项目自身有外部链接时直接跳转，不再套一层 <a>
  if (item.link_type === "external" && item.link_value) {
    return (
      <a className="block h-full" href={item.link_value} rel="noopener noreferrer" target="_blank">
        {content}
      </a>
    );
  }

  if (item.link_type === "internal" && item.link_value) {
    return (
      <ScrollToTopLink className="block h-full" href={item.link_value}>
        {content}
      </ScrollToTopLink>
    );
  }

  // 项目无自定义链接时，使用外部传入的默认跳转地址
  if (defaultHref) {
    return (
      <ScrollToTopLink className="block h-full" href={defaultHref}>
        {content}
      </ScrollToTopLink>
    );
  }

  return content;
}

/** 资源集市主页模型广场预览卡片 — 对应截图样式：标题 + 完整描述 + 黄色背景网址块 */
function ModelPlazaPreviewCard({ item }: { item: ResourceItem }) {
  const body = (
    <article className="flex h-[320px] flex-col overflow-hidden rounded-[8px] border border-[#e8ecf3] bg-white px-5 py-5 transition-all duration-200 hover:border-[#c8d5e8] hover:shadow-[0_4px_16px_rgba(15,23,42,0.07)] sm:h-[290px] lg:h-[252px] xl:h-[268px]">
      <h3 className="mb-[12px] line-clamp-2 min-h-[42px] text-[16px] font-bold leading-[1.3] text-[#1a1f2e]">{item.title}</h3>
      <p className="h-[164px] overflow-hidden text-[13px] leading-[1.75] text-[#6b7280] sm:h-[117px] lg:h-auto lg:flex-1 lg:line-clamp-5 lg:leading-[1.8]">{item.summary}</p>
      {item.link_value && (
        <div className="mt-3 flex items-center rounded-[4px] bg-[#fff9e6] px-3 py-[6px] lg:mt-5">
          <span className="whitespace-nowrap text-[12px] font-medium text-[#b45309]">网址：</span>
          <span className="truncate text-[12px] text-[#d97706]">{item.link_value}</span>
        </div>
      )}
    </article>
  );

  if (item.link_value && item.link_type === "external") {
    return (
      <a className="block h-full" href={item.link_value} rel="noopener noreferrer" target="_blank">
        {body}
      </a>
    );
  }

  if (item.link_value && item.link_type === "internal") {
    return (
      <ScrollToTopLink className="block h-full" href={item.link_value}>
        {body}
      </ScrollToTopLink>
    );
  }

  return body;
}

function ToolHubShowcaseCard({
  item,
  mode,
}: {
  item: ResourceItem;
  mode: "model" | "api" | "mcp" | "tool";
}) {
  const meta = item.meta as MarketplaceMeta;
  const featureItems =
    mode === "mcp"
      ? [...asStringList(meta.items), ...asStringList(meta.tools)].filter(
        (value, index, list) => value && list.indexOf(value) === index
      )
      : [];
  const tags =
    mode === "api"
      ? normalizeApiTags(item.tags).slice(0, 3)
      : mode === "model"
        ? [...asStringList(item.tags), ...asStringList(meta.items)].filter(
          (value, index, list) => value && list.indexOf(value) === index
        ).slice(0, 2)
        : mode === "tool"
          ? asStringList(item.tags).slice(0, 2)
          : [];
  const href = item.link_value || undefined;
  const actionType = item.link_type || "none";
  const footerUrl =
    href && actionType === "external"
      ? href.replace(/^https?:\/\//, "").replace(/\/$/, "")
      : null;

  const card = (
    <article className="group relative flex h-[320px] flex-col overflow-hidden rounded-[8px] border border-[#d8e0ec] bg-white px-6 py-6 shadow-sm transition-all duration-300 hover:-translate-y-[3px] hover:shadow-[0_18px_40px_rgba(0,82,255,0.08)] sm:h-[290px] lg:h-[252px] xl:h-[268px]">
      {item.badge_text ? (
        <div className="absolute right-0 top-0 flex h-[42px] min-w-[86px] items-center justify-center rounded-bl-[28px] bg-[#fff1f3] pl-5 pr-4 text-[16px] font-bold leading-none text-[#f0526e]">
          {item.badge_text}
        </div>
      ) : null}
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden text-[#2f7cf6]">
          {item.image_url ? (
            <img alt={`${item.title} 图标`} className="h-full w-full object-contain" src={item.image_url} />
          ) : (
            <CmsIcon name={item.icon || "Bot"} size={20} strokeWidth={1.8} />
          )}
        </div>
        <h3 className="min-w-0 line-clamp-1 pt-1 text-[17px] font-semibold leading-[24px] text-[#1f2937]">{item.title}</h3>
      </div>
      <p className="mt-3 h-[130px] overflow-hidden text-[13px] leading-[22px] text-[#4f5f75] sm:h-[88px] lg:mt-4 lg:h-auto lg:flex-1 lg:line-clamp-4 lg:text-[14px] lg:leading-[26px]">{item.summary}</p>

      {featureItems.length > 0 ? (
        <div className="mt-3 space-y-1.5 lg:mt-5 lg:space-y-2">
          {featureItems.slice(0, 3).map((feature) => (
            <div className="flex items-start gap-2 text-[11px] leading-[18px] text-[#5a6b83] lg:text-[12px] lg:leading-[20px]" key={feature}>
              <span className="mt-[7px] h-[4px] w-[4px] shrink-0 rounded-full bg-[#2f7cf6] lg:mt-[7px]" />
              <span>{feature}</span>
            </div>
          ))}
        </div>
      ) : null}

      {tags.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-1.5 lg:mt-5 lg:gap-2">
          {tags.map((tag, index) => (
            <span
              className={`inline-flex h-[22px] items-center rounded-[8px] px-[8px] text-[10px] font-medium leading-none lg:h-[24px] lg:px-[10px] lg:text-[11px] ${mode === "api" ? getApiTagClass(tag) : getModelTagClass(tag, index)
                }`}
              key={tag}
            >
              {tag}
            </span>
          ))}
        </div>
      ) : null}

      <div className="mt-auto border-t border-[#e7edf6] pt-3 lg:mt-5 lg:pt-4">
        {footerUrl ? (
          <div className="inline-flex max-w-full items-center rounded-[8px] bg-[#fff7d8] px-2.5 py-1.5 text-[11px] leading-[15px] text-[#d69600] lg:px-3 lg:py-2 lg:text-[12px] lg:leading-[16px]">
            <span className="truncate">网址: {footerUrl}</span>
          </div>
        ) : href && actionType === "internal" ? (
          <div className="inline-flex items-center gap-2 text-[13px] font-medium text-[#0052ff]">
            <span>点击查看</span>
            <Icons.ArrowRight size={14} strokeWidth={2.3} />
          </div>
        ) : (
          <div className="inline-flex items-center gap-2 text-[13px] font-medium text-[#94a3b8]">
            <span>更多内容持续补充中</span>
          </div>
        )}
      </div>
    </article>
  );

  if (item.link_type === "external" && href) {
    return (
      <a className="block h-full" href={href} rel="noopener noreferrer" target="_blank">
        {card}
      </a>
    );
  }

  if (item.link_type === "internal" && href) {
    return (
      <ScrollToTopLink className="block h-full" href={href}>
        {card}
      </ScrollToTopLink>
    );
  }

  return card;
}

export function ModelPlazaPageView({
  category,
  items,
}: {
  category?: ResourceCategory;
  items: ResourceItem[];
}) {
  const sortedItems = [...items].sort((a, b) => a.sort_order - b.sort_order);
  const displayCategory = category ? getToolCategoryDisplay(category) : null;

  return (
    <div className="flex min-h-full flex-col bg-[#f3f6fa]">
      <div className="mx-auto w-full max-w-[1120px] flex-1 px-4 py-6 sm:px-6 lg:px-0 lg:py-8">
        <Breadcrumbs
          items={[
            { label: "首页", href: "/" },
            { label: "资源集市", href: "/marketplace" },
            { label: "产品工具", href: "/marketplace/tools" },
            { label: displayCategory?.name || "大模型服务" },
          ]}
        />

        <div className="mb-[28px] max-w-[880px]">
          <h1 className="route-hero-title font-semibold tracking-[-0.02em] text-[#2b2f36]">
            {displayCategory?.name || "大模型服务"}
          </h1>
          <p className="route-hero-subtitle mt-[8px] text-[#626d7f]">
            {displayCategory?.description || toolCategoryDisplayConfig.marketplace_model_plaza.description}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-[12px] lg:grid-cols-3 xl:grid-cols-4 [&>*]:min-w-0">
          {sortedItems.map((item) => (
            <ModelPlazaCard item={item} key={item.id} />
          ))}
        </div>
      </div>
    </div>
  );
}

export function ProductToolsPageView({
  categories,
  items,
}: {
  categories: ResourceCategory[];
  items: ResourceItem[];
}) {
  const apiCategory = categories.find((item) => item.code === "marketplace_api") || null;
  const mcpCategory = categories.find((item) => item.code === "marketplace_mcp") || null;
  const toolsCategory = categories.find((item) => item.code === "marketplace_tools") || null;
  const modelPlazaCategory = categories.find((item) => item.code === "marketplace_model_plaza") || null;

  const groupedItems = useMemo(() => {
    const sorted = [...items].sort((a, b) => a.sort_order - b.sort_order);
    return {
      tools: sorted.filter((item) => item.category.code === "marketplace_tools"),
      api: sorted.filter((item) => item.category.code === "marketplace_api"),
      mcp: sorted.filter((item) => item.category.code === "marketplace_mcp"),
      modelPlaza: sorted.filter((item) => item.category.code === "marketplace_model_plaza" && item.link_value),
    };
  }, [items]);

  return (
    <div className="flex min-h-full flex-col bg-[#f3f6fa]">
      <div className="mx-auto w-full max-w-[1360px] flex-1 px-4 py-6 sm:px-6 lg:px-0 lg:py-8">
        <Breadcrumbs
          items={[
            { label: "首页", href: "/" },
            { label: "资源集市", href: "/marketplace" },
            { label: "产品工具" },
          ]}
        />

        <div className="mb-8 max-w-[920px]">
          <h1 className="route-hero-title font-semibold tracking-[-0.02em] text-[#2b2f36]">
            产品工具
          </h1>
          <p className="route-hero-subtitle mt-[8px] text-[#626d7f]">
            {toolsCategory?.description || "围绕 OPC 创业者在项目启动、产品路线、运营增长、数据分析与支付接入等环节的实际需求，提供一站式工具支持。"}
          </p>
        </div>

        <div className="space-y-6">
          {toolsCategory && groupedItems.tools.length > 0 && (
            <MarketplaceEntryRow category={getToolCategoryDisplay(toolsCategory)}>
              {groupedItems.tools.map((item) => (
                <ToolHubShowcaseCard item={item} key={item.id} mode="tool" />
              ))}
            </MarketplaceEntryRow>
          )}

          {apiCategory && groupedItems.api.length > 0 && (
            <MarketplaceEntryRow category={getToolCategoryDisplay(apiCategory)}>
              {groupedItems.api.map((item) => (
                <ToolHubShowcaseCard item={item} key={item.id} mode="api" />
              ))}
            </MarketplaceEntryRow>
          )}

          {mcpCategory && groupedItems.mcp.length > 0 && (
            <MarketplaceEntryRow category={getToolCategoryDisplay(mcpCategory)}>
              {groupedItems.mcp.map((item) => (
                <ToolHubShowcaseCard item={item} key={item.id} mode="mcp" />
              ))}
            </MarketplaceEntryRow>
          )}

          {modelPlazaCategory && groupedItems.modelPlaza.length > 0 && (
            <MarketplaceEntryRow
              category={getToolCategoryDisplay(modelPlazaCategory)}
              isStretch={true}
            >
              {groupedItems.modelPlaza.map((item) => (
                <ToolHubShowcaseCard item={item} key={item.id} mode="model" />
              ))}
            </MarketplaceEntryRow>
          )}
        </div>
      </div>
    </div>
  );
}

export function MarketplacePageView({
  categories,
  items,
  sections,
}: {
  categories: ResourceCategory[];
  items: ResourceItem[];
  sections: PageSection[];
}) {
  const dataSection = getSection(sections, "marketplace_group_data");
  const toolsSection = getSection(sections, "marketplace_group_tools");
  const computeSection = getSection(sections, "marketplace_group_compute");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [activeTab, setActiveTab] = useState<MarketplaceTabKey>("tools");
  const [expandedToolCategories, setExpandedToolCategories] = useState<Record<string, boolean>>({});

  const filteredItems = useMemo(
    () => items.filter((item) => matchesKeyword(item, searchKeyword)),
    [items, searchKeyword]
  );

  const categoryItems = (categoryCode: string) =>
    filteredItems.filter((item) => item.category.code === categoryCode).sort((a, b) => a.sort_order - b.sort_order);

  const dataCategories = groupCategories(categories, "data");
  const toolsCategories = groupCategories(categories, "tools").sort(compareToolCategories);
  const computeCategories = groupCategories(categories, "compute");

  const hasDataSection = dataCategories.some((category) => categoryItems(category.code).length > 0);
  const hasToolsSection = toolsCategories.some((category) => categoryItems(category.code).length > 0);
  const hasComputeSection = computeCategories.some((category) => categoryItems(category.code).length > 0);
  const hasAnyResult = hasDataSection || hasToolsSection || hasComputeSection;
  const marketplaceTabs = useMemo(
    () => [
      { key: "tools" as const, label: toolsSection?.title || "产品工具", enabled: hasToolsSection },
      { key: "data" as const, label: dataSection?.title || "数据资源", enabled: hasDataSection },
      { key: "compute" as const, label: normalizeComputePlatformTitle(computeSection?.title), enabled: hasComputeSection },
    ].filter((tab) => tab.enabled),
    [computeSection?.title, dataSection?.title, hasComputeSection, hasDataSection, hasToolsSection, toolsSection?.title]
  );

  useEffect(() => {
    if (marketplaceTabs.length === 0) {
      return;
    }

    if (!marketplaceTabs.some((tab) => tab.key === activeTab)) {
      setActiveTab(marketplaceTabs[0].key);
    }
  }, [activeTab, marketplaceTabs]);

  useEffect(() => {
    const applyHashTab = () => {
      const tabFromHash = getMarketplaceTabFromHash(window.location.hash);
      if (!tabFromHash || !marketplaceTabs.some((tab) => tab.key === tabFromHash)) {
        return;
      }

      setActiveTab(tabFromHash);
      window.setTimeout(() => {
        const targetId = window.location.hash.replace("#", "");
        document.getElementById(targetId)?.scrollIntoView({ block: "start" });
      }, 40);
    };

    applyHashTab();
    window.addEventListener("hashchange", applyHashTab);

    return () => {
      window.removeEventListener("hashchange", applyHashTab);
    };
  }, [marketplaceTabs]);

  return (
    <div className="flex min-h-full flex-col bg-[#f5f7fa]">
      <div className="mx-auto mb-16 flex-1 w-full max-w-[1720px] px-4 pt-8 sm:px-6 lg:px-[90px] lg:pt-10">
        <Breadcrumbs items={[{ label: "首页", href: "/" }, { label: "资源集市" }]} />

        <SharedSearchActionCard
          className="mb-12"
          onChange={(event) => setSearchKeyword(event.target.value)}
          onReset={() => setSearchKeyword("")}
          placeholder="搜索数据、模型、API、工具、算力..."
          value={searchKeyword}
        />

        {!hasAnyResult ? (
          <div className="mb-16 rounded-xl border border-gray-100 bg-white p-20 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-50 text-gray-400">
              <Icons.Search size={24} />
            </div>
            <h4 className="mb-2 font-bold text-gray-900">未找到匹配的资源</h4>
            <p className="text-[14px] text-gray-500">请尝试更换关键词搜索，或浏览以下全部分类。</p>
          </div>
        ) : null}

        {marketplaceTabs.length > 0 ? (
          <div className="sticky top-[60px] z-30 mb-8 rounded-[16px] border border-[#E2E8F4] bg-white/92 p-2 shadow-[0_12px_32px_rgba(15,23,42,0.05)] backdrop-blur-md">
            <div className="grid grid-cols-3 gap-2">
              {marketplaceTabs.map((tab) => (
                <button
                  aria-pressed={activeTab === tab.key}
                  className={`h-[46px] rounded-[12px] px-3 text-[14px] font-semibold transition-all sm:text-[16px] ${
                    activeTab === tab.key
                      ? "bg-[#0052FF] text-white shadow-[0_10px_24px_rgba(0,82,255,0.18)]"
                      : "bg-[#F5F8FF] text-[#3D4B66] hover:bg-[#EAF2FF] hover:text-[#0052FF]"
                  }`}
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  type="button"
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {hasDataSection && activeTab === "data" ? (
          <div className="mb-[20px] scroll-mt-24" id="marketplace-data">
            <MarketplaceSectionHeader title={dataSection?.title || "数据资源"} />
            {dataCategories.map((category) => {
              const list = categoryItems(category.code);
              if (list.length === 0) {
                return null;
              }

              const entryCategory =
                category.code === "marketplace_api"
                  ? { ...category, action_type: "internal" as const, action_value: "/marketplace/tools/API" }
                  : category.code === "marketplace_mcp"
                    ? { ...category, action_type: "internal" as const, action_value: "/marketplace/tools/MCP" }
                    : category;

              return (
                <MarketplaceEntryRow category={entryCategory} key={category.code}>
                  {list.map((item) => {
                    const meta = item.meta as MarketplaceMeta;
                    const href = item.link_value || category.action_value || "#";
                    const isInternal = href.startsWith("/") || item.link_type === "internal" || category.action_type === "internal";
                    const card = (
                      <MarketplaceCompactInfoCard
                        className="cursor-pointer"
                        metaRows={[
                          { label: "资源类型", value: meta.type || category.name },
                          { label: "资源持有方", value: meta.owner || category.name },
                        ]}
                        publishDate={meta.publish_date}
                        summary={item.summary}
                        title={item.title}
                        typeBadge={meta.tag || item.tags[0] || category.name}
                        typeBadgeClassName={
                          category.code === "marketplace_model_center"
                            ? "border-[rgba(80,235,104,0.20)] bg-[rgba(80,235,104,0.08)] text-[rgba(22,163,74,1)]"
                            : category.code === "marketplace_dataset_center"
                              ? "border-[rgba(77,135,255,0.20)] bg-[rgba(77,135,255,0.08)] text-[rgba(0,82,255,1)]"
                              : undefined
                        }
                      />
                    );

                    if (isInternal) {
                      return (
                        <ScrollToTopLink href={href} key={item.id}>
                          {card}
                        </ScrollToTopLink>
                      );
                    }

                    return (
                      <a href={href} key={item.id} rel="noopener noreferrer" target="_blank">
                        {card}
                      </a>
                    );
                  })}
                </MarketplaceEntryRow>
              );
            })}
          </div>
        ) : null}

        {hasToolsSection && activeTab === "tools" ? (
          <div className="mb-[20px] scroll-mt-24" id="marketplace-tools">
            {toolsCategories.map((category) => {
              const list = categoryItems(category.code);
              const isAlwaysExpanded = category.code === "marketplace_tools";
              const isExpanded = isAlwaysExpanded || Boolean(expandedToolCategories[category.code]);
              const visibleList = isExpanded ? list : list.slice(0, TOOL_CATEGORY_COLLAPSED_COUNT);
              const hasHiddenItems = !isAlwaysExpanded && list.length > TOOL_CATEGORY_COLLAPSED_COUNT;
              const displayCategory = getToolCategoryDisplay(category);
              const cardMode =
                category.code === "marketplace_model_plaza"
                  ? "model"
                  : category.code === "marketplace_api"
                    ? "api"
                    : category.code === "marketplace_mcp"
                      ? "mcp"
                      : "tool";

              if (visibleList.length === 0) return null;

              return (
                <div className="mb-10 scroll-mt-28" id={getToolCategorySectionId(category.code)} key={category.code}>
                  <div className="mb-5 flex items-center justify-between gap-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="h-[1em] w-[4px] shrink-0 rounded-[133px] bg-[#0052FF]" />
                      <h4 className="truncate text-[20px] font-semibold leading-[28px] text-[#111827]">{displayCategory.name}</h4>
                    </div>
                    {hasHiddenItems ? (
                      <button
                        className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-[#d6e1f2] bg-white px-4 text-[13px] font-semibold text-[#0052FF] shadow-sm transition-colors hover:border-[#0052FF] hover:bg-[#f5f8ff]"
                        onClick={() => setExpandedToolCategories((current) => ({
                          ...current,
                          [category.code]: !current[category.code],
                        }))}
                        type="button"
                      >
                        {isExpanded ? "收起" : "查看更多"}
                        <Icons.ChevronDown
                          className={`transition-transform ${isExpanded ? "rotate-180" : ""}`}
                          size={15}
                          strokeWidth={2.2}
                        />
                      </button>
                    ) : null}
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-4">
                    {visibleList.map((item) => (
                      <ToolHubShowcaseCard item={item} key={item.id} mode={cardMode} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}

        {hasComputeSection && activeTab === "compute" ? (
          <div className="mb-[20px] scroll-mt-24" id="marketplace-compute">
            <MarketplaceSectionHeader title={normalizeComputePlatformTitle(computeSection?.title)} />
            {computeCategories.map((category) => {
              const list = categoryItems(category.code);
              if (list.length === 0) {
                return null;
              }

              const computeHref = category.action_value || list[0]?.link_value || "https://www.xmcpsp.com/";
              const computeSummaryTitle = normalizeComputePlatformTitle(category.name);
              const computeSummaryDesc = category.description || "";
              const computeSummaryButtonText = category.button_text || "查看更多";

              return (
                <div className="mb-10" key={category.code}>
                  <div className="lg:hidden">
                    <MobileComputeMarketplaceModule
                      cards={list.map((item) => ({
                        title: item.title,
                        price: item.price || "",
                        unitLabel: item.unit_label || "",
                        badgeText: item.badge_text || item.status_text || "",
                        primaryButtonText: item.secondary_button_text || "详情",
                        secondaryButtonText: item.primary_button_text || "购买",
                        primaryHref: computeHref,
                        primaryActionType: "external",
                        secondaryHref: computeHref,
                        secondaryActionType: "external",
                        meta: {
                          region: String(item.meta.region || ""),
                          server: String(item.meta.server || ""),
                          gpu_cards: String(item.meta.gpu_cards || ""),
                          vcpu_cores: String(item.meta.vcpu_cores || ""),
                          memory: String(item.meta.memory || ""),
                          gpu_memory: String(item.meta.gpu_memory || ""),
                          storage: String(item.meta.storage || ""),
                        },
                      }))}
                      summary={{
                        title: computeSummaryTitle,
                        desc: computeSummaryDesc,
                        href: computeHref,
                        actionType: "external",
                        buttonText: computeSummaryButtonText,
                      }}
                    />
                  </div>

                  <div className="hidden flex-col gap-6 lg:flex lg:flex-row lg:flex-nowrap lg:items-start">
                    <a
                      className="group relative flex h-[213px] w-full flex-col overflow-hidden rounded-[21px] border border-[#E2E8F4] bg-white px-[16px] pb-[14px] pt-[16px] opacity-100 transition-all duration-300 hover:-translate-y-[3px] hover:shadow-[0_24px_56px_rgba(0,82,255,0.10)] sm:h-[239px] sm:px-[18px] sm:pb-[16px] sm:pt-[18px] lg:w-[307px] lg:shrink-0"
                      href={computeHref}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      <div className="absolute left-0 top-0 h-[120px] w-[120px] rounded-br-[100px] bg-[radial-gradient(circle_at_top_left,rgba(0,82,255,0.12),rgba(0,82,255,0.015)_62%,transparent_74%)]" />
                      <div className="absolute bottom-0 right-0 h-[150px] w-[150px] rounded-tl-[130px] bg-[radial-gradient(circle_at_bottom_right,rgba(0,82,255,0.12),rgba(0,82,255,0.02)_58%,transparent_76%)]" />
                      <div className="relative z-10 flex h-full flex-col">
                        <div className="w-full max-w-[220px] text-[15px] font-semibold leading-[21px] text-[#000000] sm:w-[188px] sm:text-[17px] sm:leading-[24px]">{computeSummaryTitle}</div>
                        <p className="mt-3 max-w-[240px] text-[12px] leading-[19px] text-[#6B7A99] sm:mt-4 sm:text-[13px] sm:leading-[22px]">{computeSummaryDesc}</p>
                        <span className="mt-auto flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#111111] bg-white text-[#111111] transition-transform duration-300 group-hover:translate-x-1 sm:h-8 sm:w-8">
                          <Icons.ArrowRight size={16} strokeWidth={2.8} />
                        </span>
                      </div>
                    </a>

                    <MarketplaceRightCardGrid className="lg:gap-6">
                      {list.map((item) => (
                        <a
                          className="group relative flex h-[213px] w-full flex-col overflow-hidden rounded-[21px] border border-[rgba(0,186,255,0.5)] bg-[rgba(242,251,255,1)] px-[12px] pb-[10px] pt-[10px] shadow-[inset_0_0_0_1px_rgba(0,186,255,0.5)] transition-all duration-300 hover:-translate-y-[3px] hover:shadow-[inset_0_0_0_1px_rgba(0,186,255,0.5),0_24px_56px_rgba(0,82,255,0.10)] sm:h-[239px] sm:px-[16px] sm:pb-[14px] sm:pt-[14px]"
                          href={computeHref}
                          key={item.id}
                          rel="noopener noreferrer"
                          target="_blank"
                        >
                          <div className="relative z-10 flex items-start justify-between gap-[8px]">
                            <div className="line-clamp-2 pr-[4px] text-[13px] font-semibold leading-[17px] text-[#1F1F1F] sm:pr-[6px] sm:text-[15px] sm:leading-[20px]">
                              {item.title}
                            </div>
                            <span className="shrink-0 rounded-[10px] bg-[#DDF8E8] px-[7px] py-[2px] text-[11px] font-medium leading-[14px] text-[#4FB271] sm:px-[8px] sm:py-[3px] sm:text-[12px] sm:leading-[16px]">
                              {item.badge_text || item.status_text || ""}
                            </span>
                          </div>

                          <div className="relative z-10 mt-[6px] grid grid-cols-2 gap-x-[8px] gap-y-[3px] text-[10px] leading-[13px] text-[#A7AFBF] sm:mt-[8px] sm:gap-x-[10px] sm:gap-y-[4px] sm:text-[11px] sm:leading-[15px]">
                            <div className="flex items-center gap-[4px] whitespace-nowrap">
                              <span>地区</span>
                              <span className="font-semibold text-[#1F1F1F]">{String(item.meta.region || "")}</span>
                            </div>
                            <div className="flex items-center gap-[4px] whitespace-nowrap">
                              <span>服务器</span>
                              <span className="font-semibold text-[#1F1F1F]">{String(item.meta.server || "")}</span>
                            </div>
                          </div>

                          <div
                            className="relative z-10 mt-[7px] flex items-end gap-[3px] sm:mt-[10px] sm:gap-[4px]"
                            style={{ color: "#FF3B30" }}
                          >
                            <span className="text-[20px] font-semibold leading-none tracking-[-0.02em] sm:text-[24px]">
                              {item.price || "--"}
                            </span>
                            <span className="pb-[2px] text-[11px] font-semibold leading-[15px] text-[#1F1F1F]">
                              {item.unit_label || "元/月"}
                            </span>
                          </div>

                          <div className="relative z-10 mt-[6px] w-full border-t border-dashed border-[#E2E8F4] sm:mt-[8px]" />

                          <div className="relative z-10 mt-[6px] grid grid-cols-3 gap-x-[3px] gap-y-[4px] text-center sm:mt-[8px] sm:gap-x-[4px] sm:gap-y-[6px]">
                            <div>
                              <div className="text-[10px] leading-[14px] text-[#A7AFBF]">GPU</div>
                              <div className="mt-[2px] text-[13px] font-semibold leading-[17px] text-[#1F1F1F]">
                                {String(item.meta.gpu_cards || "1")}
                              </div>
                            </div>
                            <div>
                              <div className="text-[10px] leading-[14px] text-[#A7AFBF]">vCPU</div>
                              <div className="mt-[2px] text-[13px] font-semibold leading-[17px] text-[#1F1F1F]">
                                {String(item.meta.vcpu_cores || "12")}
                              </div>
                            </div>
                            <div>
                              <div className="text-[10px] leading-[14px] text-[#A7AFBF]">内存</div>
                              <div className="mt-[2px] text-[13px] font-semibold leading-[17px] text-[#1F1F1F]">
                                {String(item.meta.memory || "90")}
                              </div>
                            </div>
                            <div>
                              <div className="text-[10px] leading-[14px] text-[#A7AFBF]">显存</div>
                              <div className="mt-[2px] text-[13px] font-semibold leading-[17px] text-[#1F1F1F]">
                                {String(item.meta.gpu_memory || "64GB")}
                              </div>
                            </div>
                            <div className="col-span-2">
                              <div className="text-[10px] leading-[14px] text-[#A7AFBF]">存储</div>
                              <div className="mt-[2px] text-[13px] font-semibold leading-[17px] text-[#1F1F1F]">
                                {String(item.meta.storage || "100GB")}
                              </div>
                            </div>
                          </div>

                          <div className="relative z-10 mt-auto flex items-center justify-between gap-[6px] pt-[4px] sm:gap-[8px] sm:pt-[6px]">
                            <div className="inline-flex h-[30px] w-full items-center justify-center rounded-[67px] border border-[#0052FF] bg-white text-[12px] font-medium text-[#0052FF] shadow-[0_10px_24px_rgba(0,82,255,0.08)] transition-all duration-300 hover:-translate-y-[5px] hover:bg-[#0052FF] hover:text-white hover:shadow-[0_24px_56px_rgba(0,82,255,0.18)]">
                              {item.secondary_button_text || "详情"}
                            </div>
                            <div className="inline-flex h-[30px] w-full items-center justify-center rounded-[67px] bg-[#BEEC00] text-[12px] font-semibold text-black shadow-[0_12px_28px_rgba(190,236,0,0.20)] transition-all duration-300 hover:-translate-y-[5px] hover:shadow-[0_24px_56px_rgba(190,236,0,0.32)]">
                              {item.primary_button_text || "购买"}
                            </div>
                          </div>
                        </a>
                      ))}
                    </MarketplaceRightCardGrid>
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function ApiServiceCard({ item }: { item: ResourceItem }) {
  const tags = normalizeApiTags(item.tags);
  const card = (
    <article className="flex h-[170px] flex-col overflow-hidden rounded-[4px] bg-white px-[14px] py-[14px] transition-all duration-300 hover:-translate-y-[2px] hover:shadow-[0_10px_24px_rgba(15,23,42,0.08)] sm:h-[170px] lg:h-[136px]">
      <div className="flex gap-[12px]">
        <div className="flex h-[36px] w-[36px] shrink-0 items-center justify-center rounded-full bg-[#f1f5fa] text-[#b8c4d3]">
          <CmsIcon name={item.icon || "Box"} size={17} strokeWidth={1.8} />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 text-[15px] font-semibold leading-[20px] text-[#1f2937] lg:truncate lg:line-clamp-none">{item.title}</h3>
          <p className="mt-[5px] text-[12px] leading-[18px] text-[#4f5f75] lg:line-clamp-2">{item.summary}</p>
        </div>
      </div>

      <div className="mt-auto flex min-h-[22px] flex-wrap gap-[6px] pt-[14px]">
        {tags.slice(0, 4).map((tag) => (
          <span
            className={`inline-flex h-[20px] items-center rounded-[4px] px-[8px] text-[10px] font-medium leading-none ${getApiTagClass(tag)}`}
            key={tag}
          >
            {tag}
          </span>
        ))}
      </div>
    </article>
  );

  if (item.link_type === "external" && item.link_value) {
    return (
      <a href={item.link_value} rel="noopener noreferrer" target="_blank">
        {card}
      </a>
    );
  }

  if (item.link_type === "internal" && item.link_value) {
    return <ScrollToTopLink href="/marketplace/tools/API">{card}</ScrollToTopLink>;
  }

  return card;
}

function McpServiceCard({ item }: { item: ResourceItem }) {
  const meta = item.meta as MarketplaceMeta;
  const tools = [
    ...asStringList(meta.items),
    ...asStringList(meta.tools),
    ...asStringList(item.tags),
  ].filter((value, index, list) => list.indexOf(value) === index);
  const statusText = item.status_text || meta.status || "未开通";
  const isEnabled = ["已开通", "已启用", "可用", "开放"].some((word) => statusText.includes(word));
  const actionText = item.primary_button_text || meta.button_text || "请先创建MCP服务";
  const hasAction = item.link_type !== "none" && Boolean(item.link_value);
  const actionHref = item.link_type === "internal" ? "/marketplace/tools/MCP" : item.link_value;
  const actionClass = hasAction
    ? "mt-auto inline-flex h-[30px] w-full items-center justify-center rounded-[4px] bg-[#eef5ff] text-[12px] font-medium text-[#0052ff] transition-colors hover:bg-[#0052ff] hover:text-white"
    : "mt-auto inline-flex h-[30px] w-full cursor-not-allowed items-center justify-center rounded-[4px] bg-[#f6f8fb] text-[12px] font-medium text-[#9aa6b8]";

  return (
    <article className="flex h-[260px] flex-col overflow-hidden rounded-[6px] border border-[#eef2f7] bg-white px-[14px] py-[14px] shadow-[0_1px_2px_rgba(15,23,42,0.03)] transition-all duration-300 hover:-translate-y-[2px] hover:shadow-[0_10px_24px_rgba(15,23,42,0.08)] sm:h-[220px] lg:h-[218px]">
      <div className="flex items-start gap-[10px]">
        <div className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full bg-[#eef5ff] text-[#2f7cf6]">
          <CmsIcon name={item.icon || meta.logo_text || "Cable"} size={18} strokeWidth={1.8} />
        </div>
        <div className="min-w-0 pt-[1px]">
          <h3 className="truncate text-[15px] font-semibold leading-[20px] text-[#1f2937]">{item.title}</h3>
          <div className="mt-[4px] inline-flex h-[16px] items-center gap-[4px] rounded-[20px] bg-[#f4f6fa] px-[7px] text-[10px] font-medium text-[#7d8796]">
            <span className={`h-[4px] w-[4px] rounded-full ${isEnabled ? "bg-[#18b76a]" : "bg-[#a8b1c1]"}`} />
            {statusText}
          </div>
        </div>
      </div>

      <p className="mt-[14px] min-h-[40px] text-[13px] leading-[20px] text-[#4f5f75] lg:line-clamp-2">{item.summary}</p>

      <div className="mt-[10px] flex min-h-[44px] flex-wrap content-start gap-[6px]">
        {tools.slice(0, 4).map((tool) => (
          <span
            className="inline-flex h-[22px] items-center gap-[3px] rounded-[2px] border border-[#e5eaf1] bg-white px-[7px] text-[11px] font-medium leading-none text-[#65748a]"
            key={tool}
            title={tool}
          >
            <Icons.Check size={11} strokeWidth={1.8} />
            <span className="max-w-[126px] truncate">{tool}</span>
          </span>
        ))}
      </div>

      <ActionButton actionType={hasAction ? item.link_type : "none"} className={actionClass} href={actionHref}>
        {actionText}
      </ActionButton>
    </article>
  );
}

export function ApiMarketPageView({
  categories,
  items,
  sections,
}: {
  categories: ResourceCategory[];
  items: ResourceItem[];
  sections: PageSection[];
}) {
  const hero = getSection(sections, "hero");
  const sortedCategories = [...categories].sort((a, b) => a.sort_order - b.sort_order);
  const activeCategory = sortedCategories.find((item) => item.code === "api_all") || sortedCategories[0];
  const currentDisplayItems = activeCategory
    ? items.filter((item) => item.category.code === activeCategory.code).sort((a, b) => a.sort_order - b.sort_order)
    : [...items].sort((a, b) => a.sort_order - b.sort_order);
  const heroTitle = toolCategoryDisplayConfig.marketplace_api.name;

  return (
    <div className="flex min-h-full flex-col bg-[#f3f6fa]">
      <div className="mx-auto w-full max-w-[1120px] flex-1 px-4 py-6 sm:px-6 lg:px-0 lg:py-8">
        <Breadcrumbs
          items={[
            { label: "首页", href: "/" },
            { label: "资源集市", href: "/marketplace" },
            { label: "产品工具", href: "/marketplace/tools" },
            { label: "AI编程工具" },
          ]}
        />

        <div className="mb-[28px]">
          <h1 className="route-hero-title font-semibold tracking-[-0.02em] text-[#2b2f36]">
            {heroTitle}
          </h1>
          <p className="route-hero-subtitle mt-[8px] text-[#626d7f]">
            {hero?.subtitle || "聚合常用 API 能力，覆盖电子商务、生活服务与数据智能场景。"}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-[12px] lg:grid-cols-3 xl:grid-cols-4 [&>*]:min-w-0">
          {currentDisplayItems.map((item) => (
            <ApiServiceCard item={item} key={item.id} />
          ))}
        </div>
      </div>
    </div>
  );
}

export function McpMarketPageView({
  sections,
  items,
}: {
  sections: PageSection[];
  items: ResourceItem[];
}) {
  const hero = getSection(sections, "hero");
  const heroTitle = toolCategoryDisplayConfig.marketplace_mcp.name;
  const sortedItems = [...items].sort((a, b) => a.sort_order - b.sort_order);

  return (
    <div className="flex min-h-full flex-col bg-[#f3f6fa]">
      <div className="mx-auto w-full max-w-[1100px] flex-1 px-4 py-6 sm:px-6 lg:px-0 lg:py-8">
        <Breadcrumbs
          items={[
            { label: "首页", href: "/" },
            { label: "资源集市", href: "/marketplace" },
            { label: "产品工具", href: "/marketplace/tools" },
            { label: "AI办公套件" },
          ]}
        />

        <div className="mb-[20px]">
          <h1 className="route-hero-title font-semibold tracking-[-0.02em] text-[#2b2f36]">
            {heroTitle}
          </h1>
          <p className="route-hero-subtitle mt-[8px] text-[#626d7f]">
            {hero?.subtitle || "通过标准化连接能力打通工具、数据与模型，让 AI 应用更充分地协同外界资源。"}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-[12px] lg:grid-cols-3 xl:grid-cols-4 [&>*]:min-w-0">
          {sortedItems.map((item) => (
            <McpServiceCard item={item} key={item.id} />
          ))}
        </div>
      </div>
    </div>
  );
}
