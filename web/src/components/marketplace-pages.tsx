"use client";

import * as Icons from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { PageSection, ResourceCategory, ResourceItem } from "@/types";

type BreadcrumbItem = {
  label: string;
  href?: string;
};

type MarketplaceMeta = {
  type?: string;
  owner?: string;
  tag?: string;
  publish_date?: string;
  label?: string;
  items?: string[];
  logo_text?: string;
  sub_text?: string;
};

function CmsIcon({
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

function getSection(sections: PageSection[], sectionKey: string) {
  return sections.find((item) => item.section_key === sectionKey);
}

function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <div className="mb-8 flex items-center gap-2 text-[13px] font-medium text-gray-900">
      {items.map((item, index) => (
        <div className="flex items-center gap-2" key={`${item.label}-${index}`}>
          {item.href ? (
            <Link className="transition-colors hover:text-[#0052d9]" href={item.href}>
              {item.label}
            </Link>
          ) : (
            <span className="text-[#0052d9]">{item.label}</span>
          )}
          {index < items.length - 1 ? <Icons.ChevronRight className="text-gray-400" size={14} /> : null}
        </div>
      ))}
    </div>
  );
}

function ActionButton({
  actionType,
  href,
  className,
  children,
}: {
  actionType?: string;
  href?: string | null;
  className: string;
  children: ReactNode;
}) {
  if (actionType === "external" && href) {
    return (
      <a className={className} href={href} rel="noopener noreferrer" target="_blank">
        {children}
      </a>
    );
  }

  if (actionType === "internal" && href) {
    return (
      <Link className={className} href={href}>
        {children}
      </Link>
    );
  }

  return <span className={className}>{children}</span>;
}

function matchesKeyword(item: ResourceItem, keyword: string) {
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

function MarketplaceSectionHeader({
  title,
  icon,
}: {
  title: string;
  icon: string;
}) {
  return (
    <div className="mb-6 flex items-center justify-between border-b border-gray-100 pb-3">
      <h3 className="flex items-center gap-2 text-[20px] font-bold text-gray-900">
        <CmsIcon className="text-amber-500" name={icon} size={24} />
        {title}
      </h3>
      <span className="text-[14px] font-medium text-blue-600">查看更多 &rarr;</span>
    </div>
  );
}

function MarketplaceEntryRow({
  category,
  children,
}: {
  category: ResourceCategory;
  children: ReactNode;
}) {
  return (
    <div className="mb-10 flex flex-col gap-6 lg:flex-row">
      <div className="w-full lg:w-1/4">
        <div className="group flex h-full flex-col rounded-xl border border-transparent bg-gray-100/80 p-6 transition-all hover:border-blue-200 hover:shadow-md">
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-gray-900 text-white shadow-sm transition-colors group-hover:bg-blue-600">
            <CmsIcon name={category.icon} size={24} />
          </div>
          <h4 className="mb-3 text-[17px] font-bold text-gray-900">{category.name}</h4>
          <p className="mb-6 flex-1 text-[14px] leading-relaxed text-gray-500">{category.description}</p>
          <ActionButton
            actionType={category.action_type}
            className="block rounded-lg bg-gray-900 py-2.5 text-center text-[14px] font-medium text-white shadow-sm transition-colors hover:bg-blue-600"
            href={category.action_value}
          >
            {category.button_text || "查看详情"}
          </ActionButton>
        </div>
      </div>
      <div className="grid w-full grid-cols-1 gap-5 sm:grid-cols-2 lg:w-3/4 lg:grid-cols-3">{children}</div>
    </div>
  );
}

function groupCategories(categories: ResourceCategory[], groupKey: string) {
  return categories
    .filter((item) => item.group_key === groupKey)
    .sort((a, b) => a.sort_order - b.sort_order);
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
  const hero = getSection(sections, "hero");
  const [searchKeyword, setSearchKeyword] = useState("");

  const filteredItems = useMemo(
    () => items.filter((item) => matchesKeyword(item, searchKeyword)),
    [items, searchKeyword]
  );

  const categoryItems = (categoryCode: string) =>
    filteredItems.filter((item) => item.category.code === categoryCode).sort((a, b) => a.sort_order - b.sort_order);

  const dataCategories = groupCategories(categories, "data");
  const toolsCategories = groupCategories(categories, "tools");
  const computeCategories = groupCategories(categories, "compute");

  const hasDataSection = dataCategories.some((category) => categoryItems(category.code).length > 0);
  const hasToolsSection = toolsCategories.some((category) => categoryItems(category.code).length > 0);
  const hasComputeSection = computeCategories.some((category) => categoryItems(category.code).length > 0);
  const hasAnyResult = hasDataSection || hasToolsSection || hasComputeSection;

  return (
    <div className="flex min-h-full flex-col bg-[#f5f7fa]">
      <div className="mb-8 bg-[#eef3fc] px-4 py-14">
        <div className="container mx-auto">
          <h1 className="mb-3 text-[32px] font-bold text-[#0052d9]">{hero?.title || "厦门OPC专属资源集市服务"}</h1>
          <p className="text-lg text-[#0052d9] opacity-90">{hero?.subtitle || "协助创业者快速进行资源检索"}</p>
        </div>
      </div>

      <div className="container mx-auto mb-16 flex-1 max-w-7xl px-4">
        <Breadcrumbs items={[{ label: "首页", href: "/" }, { label: "资源集市" }]} />

        <div className="mb-12 flex flex-col gap-4 rounded-lg border border-gray-100 bg-white p-6 shadow-sm md:flex-row">
          <input
            className="flex-1 rounded border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            onChange={(event) => setSearchKeyword(event.target.value)}
            placeholder="搜索数据、模型、API、工具、算力..."
            value={searchKeyword}
          />
          <button className="flex items-center justify-center gap-2 rounded bg-[#0052d9] px-10 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700">
            <Icons.Search size={16} /> 搜索
          </button>
          <button
            className="rounded border border-gray-300 bg-white px-8 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            onClick={() => setSearchKeyword("")}
            type="button"
          >
            重置
          </button>
        </div>

        {!hasAnyResult ? (
          <div className="mb-16 rounded-xl border border-gray-100 bg-white p-20 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-50 text-gray-400">
              <Icons.Search size={24} />
            </div>
            <h4 className="mb-2 font-bold text-gray-900">未找到匹配的资源</h4>
            <p className="text-[14px] text-gray-500">请尝试更换关键词搜索，或浏览以下全部分类。</p>
          </div>
        ) : null}

        {hasDataSection ? (
          <div className="mb-16">
            <MarketplaceSectionHeader icon="Database" title="数据" />
            {dataCategories.map((category) => {
              const list = categoryItems(category.code);
              if (list.length === 0) {
                return null;
              }

              return (
                <MarketplaceEntryRow category={category} key={category.code}>
                  {list.map((item) => {
                    const meta = item.meta as MarketplaceMeta;
                    const isGradient = category.code !== "marketplace_data_center";
                    const gradientClass =
                      category.code === "marketplace_model_center"
                        ? "from-[#1a56db] to-[#3f83f8]"
                        : "from-[#4f46e5] to-[#6366f1]";

                    return category.code === "marketplace_data_center" ? (
                      <a
                        className="group relative block cursor-pointer overflow-hidden rounded-xl border border-blue-100 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
                        href={item.link_value || category.action_value || "#"}
                        key={item.id}
                        rel="noopener noreferrer"
                        target="_blank"
                      >
                        <div className="bg-gradient-to-r from-[#5a80f8] to-[#80a4ff] px-4 py-3">
                          <h5 className="truncate text-[14px] font-bold text-white">{item.title}</h5>
                        </div>
                        <div className="pointer-events-none absolute bottom-10 right-0 -mb-4 -mr-4 h-24 w-24 rounded-full bg-blue-50 opacity-50" />
                        <CmsIcon
                          className="pointer-events-none absolute bottom-12 right-2 text-blue-100 opacity-40"
                          name="Box"
                          size={64}
                        />
                        <div className="relative z-10 flex flex-1 flex-col p-4">
                          <p className="mb-4 flex-1 text-[12px] leading-relaxed text-gray-600">{item.summary}</p>
                          <div className="mb-2 space-y-2">
                            <p className="text-[12px] font-bold text-[#0052d9]">
                              资源类型：<span className="font-medium">{meta.type}</span>
                            </p>
                            <p className="text-[12px] font-bold text-[#0052d9]">
                              资源持有方：<span className="font-medium text-gray-700">{meta.owner}</span>
                            </p>
                          </div>
                        </div>
                        <div className="z-10 flex items-center justify-between bg-[#6b8cff] px-4 py-2.5 text-white">
                          <span className="text-[12px] font-medium">{meta.tag}</span>
                          <span className="text-[11px] opacity-90">发布日期: {meta.publish_date}</span>
                        </div>
                      </a>
                    ) : (
                      <a
                        className={`group relative block cursor-pointer overflow-hidden rounded-xl bg-gradient-to-br ${gradientClass} p-6 text-white shadow-md transition-all hover:-translate-y-1 hover:shadow-lg`}
                        href={item.link_value || category.action_value || "#"}
                        key={item.id}
                        rel="noopener noreferrer"
                        target="_blank"
                      >
                        <div className="absolute -right-6 -top-6 text-white/10 transition-colors group-hover:text-white/20">
                          <CmsIcon name={category.icon} size={100} />
                        </div>
                        <h5 className="relative z-10 mb-3 text-[17px] font-bold">{item.title}</h5>
                        <p className="relative z-10 mb-6 flex-1 line-clamp-3 text-[13px] leading-relaxed text-white/80">
                          {item.summary}
                        </p>
                        <div className="relative z-10">
                          <span className="mb-4 inline-block rounded bg-white/20 px-3 py-1 text-[11px] font-medium backdrop-blur-sm">
                            {meta.label}
                          </span>
                          <div className="flex w-full items-center justify-between border-t border-white/20 pt-3 text-[12px]">
                            <div className="flex items-center gap-1.5 overflow-hidden pr-2">
                              <span className="shrink-0 text-white/60">标签:</span>
                              <span className="truncate font-medium text-white">{item.tags[0]}</span>
                            </div>
                            <div className="flex shrink-0 items-center gap-1.5 text-white/90">
                              <span className="text-white/60">发布:</span>
                              <span className="font-medium">{meta.publish_date}</span>
                            </div>
                          </div>
                        </div>
                      </a>
                    );
                  })}
                </MarketplaceEntryRow>
              );
            })}
          </div>
        ) : null}

        {hasToolsSection ? (
          <div className="mb-16">
            <MarketplaceSectionHeader icon="Wrench" title="工具包" />
            {toolsCategories.map((category) => {
              const list = categoryItems(category.code);
              if (list.length === 0) {
                return null;
              }

              return (
                <MarketplaceEntryRow category={category} key={category.code}>
                  {list.map((item) => {
                    const meta = item.meta as MarketplaceMeta;

                    if (category.code === "marketplace_api") {
                      return (
                        <Link
                          className="group flex h-full cursor-pointer flex-col rounded-xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:shadow-md"
                          href={item.link_value || "/api-market"}
                          key={item.id}
                        >
                          <div className="mb-4 flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition-colors group-hover:bg-blue-600 group-hover:text-white">
                              <CmsIcon name="Zap" size={20} />
                            </div>
                            <h5 className="text-[17px] font-bold text-gray-900">{item.title}</h5>
                          </div>
                          <p className="mb-5 flex-1 text-[13px] leading-relaxed text-gray-500">{item.summary}</p>
                          <span className="inline-flex w-max items-center gap-1 rounded-full bg-gray-50 px-3 py-1 text-[12px] font-medium text-gray-500">
                            {item.tags[0]}
                          </span>
                        </Link>
                      );
                    }

                    if (category.code === "marketplace_mcp") {
                      return (
                        <Link
                          className="group flex h-full cursor-pointer flex-col rounded-xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:shadow-md"
                          href={item.link_value || "/mcp-market"}
                          key={item.id}
                        >
                          <div className="mb-4 flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition-colors group-hover:bg-blue-600 group-hover:text-white">
                              <CmsIcon name="Workflow" size={20} />
                            </div>
                            <h5 className="text-[17px] font-bold text-gray-900">{item.title}</h5>
                          </div>
                          <ul className="space-y-2 text-[13px] leading-relaxed text-gray-500">
                            {(meta.items || []).map((bullet) => (
                              <li className="flex items-start gap-2" key={bullet}>
                                <span className="mt-[6px] h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                                <span>{bullet}</span>
                              </li>
                            ))}
                          </ul>
                        </Link>
                      );
                    }

                    return (
                      <a
                        className="group block h-full cursor-pointer rounded-xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:shadow-md"
                        href={item.link_value || "#"}
                        key={item.id}
                        rel="noopener noreferrer"
                        target="_blank"
                      >
                        <div className="mb-4 flex items-start justify-between gap-3">
                          <div>
                            <div className="text-[24px] font-black leading-none text-[#0052d9]">{meta.logo_text}</div>
                            <div className="mt-1 text-[11px] font-medium uppercase tracking-[0.16em] text-gray-400">
                              {meta.sub_text}
                            </div>
                          </div>
                          <div className="rounded-full border border-blue-100 bg-blue-50 p-2 text-blue-600">
                            <CmsIcon name="ArrowUpRight" size={14} />
                          </div>
                        </div>
                        <p className="text-[13px] leading-relaxed text-gray-500">{item.summary}</p>
                      </a>
                    );
                  })}
                </MarketplaceEntryRow>
              );
            })}
          </div>
        ) : null}

        {hasComputeSection ? (
          <div className="mb-16">
            <MarketplaceSectionHeader icon="Cpu" title="算力" />
            {computeCategories.map((category) => {
              const list = categoryItems(category.code);
              if (list.length === 0) {
                return null;
              }
              return (
                <MarketplaceEntryRow category={category} key={category.code}>
                  {list.map((item) => (
                    <a
                      className="group flex h-full cursor-pointer flex-col rounded-xl border border-gray-100 bg-white p-6 shadow-sm transition-shadow hover:shadow-xl"
                      href={item.link_value || category.action_value || "#"}
                      key={item.id}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      <div className="mb-5 flex items-start justify-between">
                        <span className="pr-2 text-[15px] font-bold leading-tight text-gray-800">{item.title}</span>
                        <span className="whitespace-nowrap rounded-full bg-red-100 px-2.5 py-1 text-[11px] font-bold text-red-600">
                          {item.badge_text || "可租赁"}
                        </span>
                      </div>
                      <div className="mb-6 flex-1 text-3xl font-black text-orange-500">
                        <span className="mr-1 text-lg font-bold">￥</span>
                        {item.price}
                        <span className="ml-1 text-[14px] font-normal text-gray-500">{item.unit_label || "/ 月"}</span>
                      </div>
                      <div className="mt-auto flex gap-3">
                        <div className="flex-1 rounded-lg bg-blue-50 py-2 text-center text-[13px] font-medium text-blue-700 transition-colors group-hover:bg-[#0052d9] group-hover:text-white">
                          立即使用
                        </div>
                        <div className="flex-1 rounded-lg border border-gray-200 py-2 text-center text-[13px] font-medium text-gray-600 transition-colors group-hover:bg-gray-50">
                          详情
                        </div>
                      </div>
                    </a>
                  ))}
                </MarketplaceEntryRow>
              );
            })}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function getTagStyle(tag: string) {
  if (tag.includes("低至") || tag.includes("付费")) return "text-[#ff5a5f] bg-[#fff0f0] border-[#ff5a5f]/20";
  if (tag === "免费") return "text-[#00a870] bg-[#e6f6f0] border-[#00a870]/20";
  if (tag === "企业专用") return "text-[#0052d9] bg-[#eef3fc] border-[#0052d9]/20";
  if (tag === "个人高级认证") return "text-[#722ed1] bg-[#f9f0ff] border-[#722ed1]/20";
  if (tag === "支持MCP") return "text-[#165dff] bg-[#e8f3ff] border-[#165dff]/20";
  return "border-gray-200 bg-gray-50 text-gray-600";
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
  const [activeCategoryCode, setActiveCategoryCode] = useState(sortedCategories[0]?.code || "");
  const activeCategory = sortedCategories.find((item) => item.code === activeCategoryCode) || sortedCategories[0];
  const currentDisplayItems = items.filter((item) => item.category.code === activeCategoryCode);

  return (
    <div className="flex min-h-full flex-col bg-[#f5f7fa]">
      <div className="container mx-auto flex-1 max-w-[1400px] px-4 py-10">
        <Breadcrumbs
          items={[
            { label: "首页", href: "/" },
            { label: "资源集市", href: "/marketplace" },
            { label: "API服务" },
          ]}
        />

        <div className="flex gap-6">
          <div className="w-52 shrink-0">
            <div className="custom-scrollbar sticky top-24 max-h-[calc(100vh-140px)] overflow-y-auto rounded-lg border border-gray-100 bg-white p-2 shadow-sm">
              <div className="flex flex-col gap-1">
                {sortedCategories.map((category) => (
                  <button
                    className={`rounded-md px-4 py-3 text-left text-[14px] font-medium transition-all ${
                      activeCategoryCode === category.code
                        ? "relative bg-blue-50 text-[#0052d9] before:absolute before:bottom-2.5 before:left-0 before:top-2.5 before:w-[3px] before:rounded-r-md before:bg-[#0052d9]"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                    key={category.code}
                    onClick={() => setActiveCategoryCode(category.code)}
                    type="button"
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <div className="mb-6 flex items-center justify-between border-b border-gray-200 pb-4">
              <div>
                <div className="mb-1 text-[12px] font-medium text-gray-400">{hero?.title || "API 服务市场"}</div>
                <h2 className="relative pl-3 text-[18px] font-bold text-gray-900 before:absolute before:bottom-1 before:left-0 before:top-1 before:w-[4px] before:rounded-sm before:bg-[#0052d9]">
                  {activeCategory?.name || "全部"}
                </h2>
              </div>
              <div className="flex items-center gap-6 text-[13px] text-gray-600">
                <button className="flex items-center gap-1.5 transition-colors hover:text-[#0052d9]" type="button">
                  排序: 综合 <Icons.ChevronDown size={14} />
                </button>
                <button className="flex items-center gap-1.5 transition-colors hover:text-[#0052d9]" type="button">
                  付费类型: 全部 <Icons.ChevronDown size={14} />
                </button>
              </div>
            </div>

            <div className="mb-4 text-[13px] leading-relaxed text-gray-400">{hero?.subtitle}</div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {currentDisplayItems.map((item) => (
                <div
                  className="group flex h-full cursor-pointer flex-col rounded-lg border border-gray-100 bg-white p-5 transition-all hover:border-blue-100 hover:shadow-lg"
                  key={item.id}
                >
                  <div className="mb-4 flex gap-4">
                    <div className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full border border-gray-100 bg-gray-50 text-gray-400 transition-colors group-hover:border-blue-100 group-hover:bg-blue-50 group-hover:text-[#0052d9]">
                      <CmsIcon name={item.icon} size={20} strokeWidth={1.5} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="mb-1.5 truncate text-[15px] font-bold text-gray-900 transition-colors group-hover:text-[#0052d9]">
                        {item.title}
                      </h3>
                      <p className="line-clamp-2 text-[12px] leading-relaxed text-gray-500">{item.summary}</p>
                    </div>
                  </div>
                  <div className="mt-auto flex flex-wrap gap-2 pt-4">
                    {item.tags.map((tag) => (
                      <span
                        className={`rounded border px-2 py-0.5 text-[10px] font-medium ${getTagStyle(tag)}`}
                        key={tag}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-10 text-center text-[13px] text-gray-400">没有更多内容了</div>
          </div>
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

  return (
    <div className="flex min-h-full flex-col bg-[#f5f7fa]">
      <div className="container mx-auto flex-1 max-w-[1400px] px-4 py-10">
        <Breadcrumbs
          items={[
            { label: "首页", href: "/" },
            { label: "资源集市", href: "/marketplace" },
            { label: "MCP服务" },
          ]}
        />

        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="mb-2 text-[24px] font-bold text-gray-900">{hero?.title || "MCP 标准连接服务"}</h2>
            <p className="text-[14px] text-gray-500">
              {hero?.subtitle || "通过标准化连接能力打通工具、数据与模型，让 AI 应用更充分地协同外界资源。"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((item) => (
            <div
              className="group flex h-full flex-col rounded-xl border border-gray-100 bg-white p-6 transition-all hover:border-blue-100 hover:shadow-lg"
              key={item.id}
            >
              <div className="mb-4 flex gap-4">
                <div className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full border border-blue-100/50 bg-blue-50 text-[#0052d9]">
                  <CmsIcon name={item.icon} size={22} strokeWidth={1.5} />
                </div>
                <div className="flex min-w-0 flex-1 flex-col justify-center gap-1.5">
                  <h3 className="truncate text-[15px] font-bold text-gray-900">{item.title}</h3>
                  <span className="inline-flex w-max items-center gap-1.5 rounded border border-gray-100 bg-gray-50 px-2 py-0.5 text-[11px] text-gray-500">
                    <span className="h-1.5 w-1.5 rounded-full bg-gray-300" />
                    {item.status_text || "未开通"}
                  </span>
                </div>
              </div>
              <p className="mb-5 flex-1 text-[13px] leading-relaxed text-gray-600">{item.summary}</p>
              <div className="mb-6 flex flex-wrap gap-2">
                {item.tags.map((tag) => (
                  <span
                    className="flex items-center gap-1 whitespace-nowrap rounded border border-gray-200 bg-white px-2 py-1 text-[11px] text-gray-500"
                    key={tag}
                  >
                    <Icons.Check className="text-gray-400" size={12} />
                    {tag}
                  </span>
                ))}
              </div>
              <button
                className="w-full cursor-not-allowed rounded-lg border border-gray-100 bg-gray-50 py-2.5 text-[13px] font-medium text-gray-400 transition-colors hover:bg-gray-100"
                type="button"
              >
                请先创建MCP服务
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
