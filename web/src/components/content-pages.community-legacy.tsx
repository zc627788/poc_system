"use client";

import {
  ArrowRight,
  Banknote,
  Briefcase,
  Building,
  Building2,
  ChevronRight,
  Coins,
  Droplets,
  FileCheck,
  FileText,
  Filter,
  Home,
  MapPin,
  Monitor,
  Receipt,
  RefreshCw,
  ScrollText,
  Search,
  Shield,
  Ticket,
  TrendingUp,
  User,
  UserCheck,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { NewsBadge } from "@/components/news-badge";
import { articleTabs } from "@/lib/site-constants";
import type { Article, PageSection } from "@/types";

type BasicExtra = Record<string, unknown>;

type CommunityStatsExtra = {
  items?: { value: string; label: string }[];
};

type CommunityBaseExtra = {
  address?: string;
  phone?: string;
  email?: string;
  button_text?: string;
  action_type?: string;
  action_value?: string;
  image_url?: string;
  alt?: string;
  reverse?: boolean;
};

type FiltersExtra = {
  type_options?: string[];
  stage_options?: string[];
  default_types?: string[];
  default_stages?: string[];
};

type CardItem = {
  icon?: string;
  title: string;
  desc: string;
  button_text?: string;
  action_type?: string;
  action_value?: string;
  tags?: string[];
};

type ItemsExtra = {
  items?: CardItem[];
};

type HeroTagsExtra = {
  tags?: string[];
};

type SetupJourneyExtra = {
  start?: { icon?: string; title?: string };
  top_service?: { text?: string };
  application_options?: { icon?: string; title?: string; desc?: string }[];
  multi_cert_text?: string;
  steps?: { icon?: string; title?: string; subtitle?: string | null }[];
  result?: { icon?: string; title?: string; desc?: string };
};

type SettlementIntroExtra = {
  image_url?: string;
};

const iconMap: Record<string, LucideIcon> = {
  ArrowRight,
  Banknote,
  Briefcase,
  Building,
  Building2,
  Coins,
  Droplets,
  FileCheck,
  FileText,
  Filter,
  Home,
  MapPin,
  Monitor,
  Receipt,
  RefreshCw,
  Search,
  Shield,
  Stamp: ScrollText,
  Ticket,
  TrendingUp,
  User,
  UserCheck,
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
  const Icon = (name && iconMap[name]) || FileText;
  return <Icon className={className} size={size} strokeWidth={strokeWidth} />;
}

function parseExtra<T extends BasicExtra>(extraJson?: string | null): T {
  if (!extraJson) {
    return {} as T;
  }

  try {
    return JSON.parse(extraJson) as T;
  } catch (error) {
    console.error("Failed to parse section extra_json", error);
    return {} as T;
  }
}

function getSection(sections: PageSection[], sectionKey: string) {
  return sections.find((item) => item.section_key === sectionKey);
}

function formatDate(value: string) {
  return value.replace("T", " ").slice(0, 10);
}

function articleTag(categoryCode: string) {
  return articleTabs.find((item) => item.code === categoryCode)?.tag || "资讯";
}

function ActionWrapper({
  href,
  actionType,
  className,
  children,
}: {
  href?: string | null;
  actionType?: string | null;
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

  return <div className={className}>{children}</div>;
}

const newsActionButtonTextStyle: CSSProperties = {
  fontFamily: "PingFang SC, PingFang SC",
  fontWeight: 500,
  fontSize: "16px",
  lineHeight: "23px",
  fontStyle: "normal",
  textTransform: "none",
};

function Breadcrumbs({
  items,
  compact = false,
}: {
  items: { label: string; href?: string }[];
  compact?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-2 font-medium text-gray-900 ${compact ? "mb-8 text-[13px]" : "mb-6 text-sm"}`}
    >
      {items.map((item, index) => (
        <div className="flex items-center gap-2" key={`${item.label}-${index}`}>
          {item.href ? (
            <Link className="transition-colors hover:text-[#0052d9]" href={item.href}>
              {item.label}
            </Link>
          ) : (
            <span className="text-[#0052d9]">{item.label}</span>
          )}
          {index < items.length - 1 ? <ChevronRight className="text-gray-400" size={compact ? 14 : 16} /> : null}
        </div>
      ))}
    </div>
  );
}

export function NewsPageView({
  articlesByTab,
  sections,
}: {
  articlesByTab: Record<string, Article[]>;
  sections: PageSection[];
}) {
  const hero = getSection(sections, "hero");
  const [activeTab, setActiveTab] = useState<(typeof articleTabs)[number]["code"]>("activity");
  const [keyword, setKeyword] = useState("");

  const currentItems = articlesByTab[activeTab] || [];
  const filteredItems = currentItems.filter((item) =>
    item.title.toLowerCase().includes(keyword.toLowerCase().trim())
  );

  return (
    <div className="min-h-full bg-[#f5f7fa] pb-16">
      <div className="mb-8 bg-[#eef3fc] px-4 py-12">
        <div className="container mx-auto">
          <h1 className="mb-3 text-[28px] font-bold text-[#0052d9]">{hero?.title || "最新动态"}</h1>
          <p className="text-lg text-[#0052d9]">{hero?.subtitle || "一站掌握人工智能OPC创业动态"}</p>
        </div>
      </div>

      <div className="container mx-auto flex-1 px-4">
        <Breadcrumbs items={[{ label: "首页", href: "/" }, { label: "最新动态" }]} />

        <div className="mb-6 flex flex-col gap-4 rounded-lg bg-white p-6 shadow-sm md:flex-row md:items-center">
          <input
            className="h-[43px] flex-1 rounded-[5px] border border-[#D6DEEB] px-4 text-sm text-[#111111] placeholder:text-[#AAB4C8] focus:border-[#0052FF] focus:outline-none focus:ring-1 focus:ring-[#0052FF]"
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="请输入关键词进行搜索"
            value={keyword}
          />
          <button
            className="inline-flex h-[43px] w-[113px] transform-gpu items-center justify-center rounded-[5px] bg-[#BEEC00] text-black transition-all duration-300 will-change-transform hover:-translate-y-[5px] hover:opacity-95 active:translate-y-0"
            style={newsActionButtonTextStyle}
            type="button"
          >
            搜索
          </button>
          <button
            className="inline-flex h-[43px] w-[113px] transform-gpu items-center justify-center rounded-[5px] border border-[#0052FF] bg-white text-[#0052FF] transition-all duration-300 will-change-transform hover:-translate-y-[5px] hover:bg-[#F5F9FF] active:translate-y-0"
            onClick={() => setKeyword("")}
            style={newsActionButtonTextStyle}
            type="button"
          >
            重置
          </button>
        </div>

        <div className="min-h-[400px] rounded-lg bg-white p-6 shadow-sm">
          <div className="mb-6 flex gap-10 border-b border-gray-100">
            {articleTabs.map((tab) => {
              const isActive = activeTab === tab.code;

              return (
                <button
                  className={`relative pb-[16px] transition-opacity hover:opacity-70 ${
                    isActive
                      ? "text-[19px] font-medium leading-[27px] text-black"
                      : "text-[16px] font-normal leading-[23px] text-[#666666]"
                  }`}
                  key={tab.code}
                  onClick={() => setActiveTab(tab.code)}
                  type="button"
                >
                  {tab.name}
                  {isActive ? (
                    <span className="absolute bottom-[2px] left-1/2 h-[7px] w-[21px] -translate-x-1/2 rounded-[67px] bg-[#0052FF]" />
                  ) : null}
                </button>
              );
            })}
          </div>

          <div className="space-y-1">
            {filteredItems.length > 0 ? (
              filteredItems.map((item) => (
                <a
                  className="group flex flex-col gap-2 rounded px-2 py-4 transition-colors hover:bg-gray-50/50 sm:flex-row sm:items-center sm:justify-between"
                  href={item.external_url || "#"}
                  key={item.id}
                  rel="noopener noreferrer"
                  target={item.link_type === "external" ? "_blank" : undefined}
                >
                  <span className="text-[15px] text-gray-800 transition-colors group-hover:text-blue-600">
                    <span className="mr-3 inline-flex align-middle">
                      <NewsBadge tag={articleTag(item.category.code)} />
                    </span>
                    {item.title}
                  </span>
                  <span className="whitespace-nowrap text-sm text-gray-500">{formatDate(item.publish_at)}</span>
                </a>
              ))
            ) : (
              <div className="py-16 text-center text-sm text-gray-400">暂无匹配内容</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function CommunityPageView({ sections }: { sections: PageSection[] }) {
  const hero = getSection(sections, "hero");
  const intro = getSection(sections, "intro");
  const stats = parseExtra<CommunityStatsExtra>(getSection(sections, "stats")?.extra_json);
  const bases = ["base_soft2", "base_soft3"]
    .map((key) => {
      const section = getSection(sections, key);
      return section
        ? {
            section,
            extra: parseExtra<CommunityBaseExtra>(section.extra_json),
          }
        : null;
    })
    .filter(Boolean) as { section: PageSection; extra: CommunityBaseExtra }[];
  const requirements = parseExtra<{ items?: string[] }>(getSection(sections, "requirements")?.extra_json);
  const heroTags = parseExtra<HeroTagsExtra>(hero?.extra_json);

  return (
    <div className="min-h-full bg-[#f5f7fa] pb-16">
      <div className="mb-8 bg-[#eef3fc] px-4 py-12 text-center">
        <h1 className="mb-6 text-3xl font-bold text-[#0052d9]">{hero?.title || "专业化智创社区"}</h1>
        <div className="flex justify-center gap-4">
          {(heroTags.tags || []).map((tag) => (
            <span
              className="rounded-full bg-gray-200/80 px-6 py-1.5 text-[13px] font-medium text-gray-700"
              key={tag}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="container mx-auto max-w-5xl px-4">
        <Breadcrumbs items={[{ label: "首页", href: "/" }, { label: "社区简介" }]} />

        <div className="mb-12 rounded-2xl border border-gray-100 bg-white p-8 shadow-sm md:p-10">
          <p
            className="text-[16px] leading-loose text-gray-700 text-justify"
            dangerouslySetInnerHTML={{ __html: intro?.content || "" }}
          />
        </div>

        <div className="mb-20 grid grid-cols-2 gap-6 md:grid-cols-4">
          {(stats.items || []).map((item) => (
            <div
              className="group rounded-2xl border border-gray-100 bg-white py-8 text-center shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
              key={item.label}
            >
              <div className="mb-2 origin-bottom text-[32px] font-black text-[#0052d9] transition-transform group-hover:scale-110">
                {item.value}
              </div>
              <div className="text-sm font-medium text-gray-500">{item.label}</div>
            </div>
          ))}
        </div>

        {bases.map(({ section, extra }) => (
          <div
            className={`mb-20 flex flex-col items-center gap-10 ${extra.reverse ? "md:flex-row-reverse" : "md:flex-row"}`}
            key={section.section_key}
          >
            <div className="flex flex-1 flex-col items-start text-[#0052d9]">
              <h3 className="mb-8 text-[17px] font-bold">{section.title}</h3>
              <div className="mb-10 space-y-3 text-[14px]">
                <p>地址：{extra.address}</p>
                <p>电话：{extra.phone}</p>
                <p>邮箱：{extra.email}</p>
              </div>
              <button
                className="rounded-sm bg-gray-300/80 px-10 py-2.5 text-sm font-medium text-gray-800 shadow-sm transition-colors hover:bg-gray-300"
                type="button"
              >
                {extra.button_text || "申请入驻"}
              </button>
            </div>
            <div className="w-full flex-1">
              <img
                alt={extra.alt || section.title}
                className="h-64 w-full rounded-lg object-cover shadow-md"
                src={extra.image_url}
              />
            </div>
          </div>
        ))}

        <div className="rounded-xl border border-gray-100 bg-white p-8 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
          <h3 className="mb-4 text-[15px] font-bold text-[#0052d9]">{getSection(sections, "requirements")?.title}</h3>
          <ul className="space-y-2.5 text-[14px] text-[#0052d9]">
            {(requirements.items || []).map((item) => (
              <li key={item}>• {item}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export function ServicesPageView({ sections }: { sections: PageSection[] }) {
  const hero = getSection(sections, "hero");
  const filterOptions = parseExtra<FiltersExtra>(getSection(sections, "policy_filters")?.extra_json);
  const policyItems = parseExtra<ItemsExtra>(getSection(sections, "policy_cards")?.extra_json).items || [];
  const supportItems = parseExtra<ItemsExtra>(getSection(sections, "support_cards")?.extra_json).items || [];

  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedStages, setSelectedStages] = useState<string[]>([]);
  const [searchKeyword, setSearchKeyword] = useState("");

  const activeFilters = useMemo(() => [...selectedTypes, ...selectedStages], [selectedStages, selectedTypes]);
  const filteredPolicies = useMemo(
    () =>
      policyItems.filter((item) => {
        const tags = item.tags || [];
        const matchTag = activeFilters.length === 0 || tags.some((tag) => activeFilters.includes(tag));
        const keyword = searchKeyword.trim().toLowerCase();
        const matchKeyword =
          keyword.length === 0 ||
          item.title.toLowerCase().includes(keyword) ||
          item.desc.toLowerCase().includes(keyword);
        return matchTag && matchKeyword;
      }),
    [activeFilters, policyItems, searchKeyword]
  );

  const toggleValue = (value: string, selected: string[], setSelected: (items: string[]) => void) => {
    if (selected.includes(value)) {
      setSelected(selected.filter((item) => item !== value));
      return;
    }
    setSelected([...selected, value]);
  };

  return (
    <div className="min-h-full bg-[#f5f7fa] pb-16">
      <div className="mb-8 bg-[#eef3fc] px-4 py-14">
        <div className="container mx-auto">
          <h1 className="mb-3 text-[32px] font-bold text-[#0052d9]">{hero?.title || "厦门OPC专属创业政策服务"}</h1>
          <p className="text-lg text-[#0052d9] opacity-90">{hero?.subtitle || "个性化、精准化匹配"}</p>
        </div>
      </div>

      <div className="container mx-auto mb-16 max-w-7xl px-4">
        <Breadcrumbs items={[{ label: "首页", href: "/" }, { label: "创业服务" }]} compact />

        <div className="mb-8 flex flex-col gap-4 rounded-lg border border-gray-100 bg-white p-6 shadow-sm md:flex-row">
          <input
            className="flex-1 rounded border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            onChange={(event) => setSearchKeyword(event.target.value)}
            placeholder="请输入政策关键字..."
            value={searchKeyword}
          />
          <button className="flex items-center justify-center gap-2 rounded bg-[#0052d9] px-10 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700">
            <Search size={16} /> 搜索
          </button>
          <button
            className="rounded border border-gray-300 bg-white px-8 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            onClick={() => setSearchKeyword("")}
            type="button"
          >
            重置
          </button>
        </div>

        <div className="mb-16 flex flex-col gap-6 lg:flex-row">
          <div className="w-full shrink-0 lg:w-[280px]">
            <div className="sticky top-24 rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
              <div className="mb-6 flex items-center gap-2 border-b border-gray-100 pb-4">
                <Filter className="text-[#0052d9]" size={20} />
                <h3 className="text-[17px] font-bold text-gray-900">政策匹配</h3>
              </div>

              <div className="mb-6">
                <h4 className="mb-3 text-[13px] font-bold text-gray-500">创业者类型</h4>
                <div className="flex flex-wrap gap-2">
                  {(filterOptions.type_options || []).map((option) => (
                    <button
                      className={`rounded px-3 py-1.5 text-[13px] font-medium transition-colors ${
                        selectedTypes.includes(option)
                          ? "bg-[#0052d9] text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                      key={option}
                      onClick={() => toggleValue(option, selectedTypes, setSelectedTypes)}
                      type="button"
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-8">
                <h4 className="mb-3 text-[13px] font-bold text-gray-500">创业方向/阶段</h4>
                <div className="flex flex-wrap gap-2">
                  {(filterOptions.stage_options || []).map((option) => (
                    <button
                      className={`rounded px-3 py-1.5 text-[13px] font-medium transition-colors ${
                        selectedStages.includes(option)
                          ? "bg-[#0052d9] text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                      key={option}
                      onClick={() => toggleValue(option, selectedStages, setSelectedStages)}
                      type="button"
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>

              <button
                className="flex w-full items-center justify-center gap-2 rounded border border-gray-300 py-2.5 text-[13px] font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900"
                onClick={() => {
                  setSelectedTypes([]);
                  setSelectedStages([]);
                  setSearchKeyword("");
                }}
                type="button"
              >
                <RefreshCw size={14} />
                重置筛选
              </button>
            </div>
          </div>

          <div className="flex-1">
            <div className="mb-6 flex flex-col justify-between gap-4 rounded-xl border border-blue-100 bg-blue-50/50 p-5 sm:flex-row sm:items-center">
              <div>
                <h3 className="mb-1 text-[18px] font-bold text-gray-900">
                  已为您匹配 <span className="mx-1 text-[22px] text-[#0052d9]">{filteredPolicies.length}</span> 项适用政策
                </h3>
                <p className="text-[13px] text-gray-500">
                  根据{" "}
                  {activeFilters.length > 0 ? (
                    <span className="font-medium text-blue-600">“{activeFilters.join(" + ")}”</span>
                  ) : (
                    "您的全部条件"
                  )}{" "}
                  {searchKeyword ? <span className="font-medium text-blue-600">及关键字 “{searchKeyword}”</span> : null} 推荐
                </p>
              </div>
            </div>

            {filteredPolicies.length > 0 ? (
              <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2">
                {filteredPolicies.map((item) => (
                  <div
                    className="group flex flex-col rounded-xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:shadow-md"
                    key={item.title}
                  >
                    <h4 className="mb-3 text-[16px] font-bold text-gray-900 transition-colors group-hover:text-[#0052d9]">
                      {item.title}
                    </h4>
                    <p className="mb-5 flex-1 line-clamp-2 text-[13px] leading-relaxed text-gray-500">{item.desc}</p>
                    <div className="mb-5 flex flex-wrap gap-2">
                      {(item.tags || []).map((tag) => (
                        <span className="rounded bg-gray-100 px-2 py-1 text-[11px] font-medium text-gray-600" key={tag}>
                          {tag}
                        </span>
                      ))}
                    </div>
                    <button
                      className="w-full rounded bg-blue-50 py-2 text-center text-[13px] font-medium text-blue-600 transition-colors hover:bg-[#0052d9] hover:text-white"
                      type="button"
                    >
                      {item.button_text || "查看详情"}
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-gray-100 bg-white p-16 text-center shadow-sm">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-50 text-gray-400">
                  <Filter size={24} />
                </div>
                <h4 className="mb-2 font-bold text-gray-900">暂无完全匹配的政策</h4>
                <p className="text-[14px] text-gray-500">您可以尝试减少筛选条件或重置筛选。</p>
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-gray-200 pt-8">
          <div className="mb-8 flex items-center">
            <span className="mr-3 inline-block h-6 w-1.5 rounded-sm bg-blue-600" />
            <h2 className="text-[20px] font-bold text-gray-900">{getSection(sections, "support_cards")?.title || "创业配套服务"}</h2>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {supportItems.map((item) => (
              <ActionWrapper
                actionType={item.action_type}
                className="group flex cursor-pointer flex-col rounded-xl border border-gray-100 bg-white p-8 shadow-sm transition-all hover:border-blue-200 hover:shadow-md"
                href={item.action_value}
                key={item.title}
              >
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 shadow-sm transition-all group-hover:scale-110 group-hover:bg-[#0052d9] group-hover:text-white">
                  <CmsIcon name={item.icon} size={26} />
                </div>
                <h3 className="mb-3 text-[18px] font-bold text-gray-900">{item.title}</h3>
                <p className="mb-8 flex-1 text-[14px] leading-relaxed text-gray-500">{item.desc}</p>
                <div className="flex w-full items-center justify-between rounded-lg bg-gray-50 px-5 py-3 text-[14px] font-medium text-gray-700 transition-colors group-hover:bg-[#0052d9] group-hover:text-white">
                  <span>查看详情</span>
                  <ArrowRight size={16} />
                </div>
              </ActionWrapper>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function SetupPageView({ sections }: { sections: PageSection[] }) {
  const hero = getSection(sections, "hero");
  const journey = parseExtra<SetupJourneyExtra>(getSection(sections, "journey")?.extra_json);

  return (
    <div className="min-h-full bg-[#f5f7fa] pb-16">
      <div className="mb-8 bg-[#eef3fc] px-4 py-14">
        <div className="container mx-auto max-w-6xl">
          <h1 className="mb-3 text-[32px] font-bold text-[#0052d9]">{hero?.title || "OPC工商注册全流程指引"}</h1>
          <p className="text-lg text-[#0052d9] opacity-90">{hero?.subtitle}</p>
        </div>
      </div>

      <div className="container mx-auto mb-16 max-w-6xl px-4">
        <Breadcrumbs
          compact
          items={[
            { label: "首页", href: "/" },
            { label: "创业服务", href: "/services" },
            { label: "OPC工商注册" },
          ]}
        />

        <div className="custom-scrollbar overflow-x-auto rounded-2xl border border-gray-100 bg-white p-8 shadow-sm md:p-12">
          <h2 className="mb-16 text-center text-2xl font-bold text-gray-800">{getSection(sections, "journey")?.title}</h2>

          <div className="flex min-w-[950px] items-stretch justify-center gap-6 px-4">
            <div className="flex flex-col justify-center">
              <div className="relative w-40 rounded-xl bg-[#2b90fa] p-6 text-center text-white shadow-md">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white/20">
                  <CmsIcon name={journey.start?.icon} size={24} />
                </div>
                <h3 className="text-[16px] font-bold leading-snug whitespace-pre-line">{journey.start?.title}</h3>
              </div>
            </div>

            <div className="flex items-center text-[#93c5fd]">
              <ArrowRight size={28} />
            </div>

            <div className="relative mt-6 flex flex-col justify-center gap-4">
              <div className="absolute -top-14 left-1/2 z-10 flex w-52 -translate-x-1/2 items-center justify-center gap-1 rounded-full bg-[#52c1f5] px-4 py-3 text-center text-[13px] font-medium text-white shadow-sm">
                <span className="whitespace-pre-line">{journey.top_service?.text}</span>
                <div className="ml-1 flex h-5 w-5 items-center justify-center rounded-full border border-white/40">
                  <ChevronRight size={14} />
                </div>
              </div>
              <div className="absolute -top-4 left-1/2 h-10 w-[2px] -translate-x-1/2 border-l-2 border-dashed border-[#93c5fd]" />

              <div className="relative flex w-56 flex-col gap-5 rounded-2xl border-2 border-dashed border-[#a3d4f7] bg-blue-50/40 p-5">
                {(journey.application_options || []).map((item, index) => (
                  <div
                    className="relative flex h-[164px] w-full cursor-pointer flex-col items-center justify-center rounded-xl border border-blue-100 bg-white p-4 text-center shadow-sm transition-shadow hover:shadow-md"
                    key={`${item.title}-${index}`}
                  >
                    {index === 0 ? (
                      <CmsIcon className="mb-2 text-[#2b90fa]" name={item.icon} size={32} strokeWidth={1.5} />
                    ) : (
                      <div className="mb-2 flex h-10 w-10 items-center justify-center rounded bg-[#e0f2fe] text-[#2b90fa]">
                        <CmsIcon name={item.icon} size={24} strokeWidth={2} />
                      </div>
                    )}
                    <h4 className="mb-1.5 text-[16px] font-bold text-[#2b90fa]">{item.title}</h4>
                    <p className="whitespace-pre-line text-[12px] leading-snug text-gray-500">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="w-10 shrink-0" />

            <div className="relative mt-6 flex flex-col justify-center gap-3">
              <div className="absolute -top-14 left-1/2 z-10 flex w-[280px] -translate-x-1/2 items-center justify-center gap-1 rounded-full bg-[#52c1f5] px-4 py-3 text-center text-[13px] font-medium text-white shadow-sm">
                <span className="whitespace-pre-line">{journey.multi_cert_text}</span>
                <div className="ml-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-white/40">
                  <ChevronRight size={14} />
                </div>
              </div>
              <div className="absolute -top-4 left-1/2 h-10 w-[2px] -translate-x-1/2 border-l-2 border-dashed border-[#93c5fd]" />

              <div className="mt-6 flex flex-col gap-3">
                {(journey.steps || []).map((item, index) => (
                  <div
                    className="relative flex w-[260px] cursor-pointer items-center justify-between rounded-full bg-[#2b90fa] px-5 py-3 text-white shadow-sm transition-colors hover:bg-[#1a7bed]"
                    key={`${item.title}-${index}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="shrink-0 rounded bg-white/20 p-1.5 text-white">
                        <CmsIcon name={item.icon} size={18} />
                      </div>
                      <div className="text-left">
                        <div className="text-[15px] font-bold tracking-wide">{item.title}</div>
                        {item.subtitle ? <div className="text-[11px] opacity-90">{item.subtitle}</div> : null}
                      </div>
                    </div>
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-white/40">
                      <ChevronRight size={14} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="ml-16 flex flex-col justify-center">
              <div className="relative w-44 rounded-2xl border border-orange-200 bg-[#fff8ed] p-8 text-center text-orange-800 shadow-sm">
                <div className="mx-auto mb-3 text-orange-400">
                  <CmsIcon className="mx-auto" name={journey.result?.icon} size={42} strokeWidth={1.5} />
                </div>
                <h3 className="mb-3 text-[18px] font-bold text-orange-600">{journey.result?.title}</h3>
                <p className="whitespace-pre-line text-[13px] font-medium leading-relaxed opacity-80">{journey.result?.desc}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function FinancingPageView({ sections }: { sections: PageSection[] }) {
  const hero = getSection(sections, "hero");
  const intro = getSection(sections, "intro");
  const items = parseExtra<ItemsExtra>(getSection(sections, "fund_cards")?.extra_json).items || [];

  return (
    <div className="min-h-full bg-[#f4f7fc] pb-16">
      <div className="relative overflow-hidden bg-gradient-to-r from-[#0052d9] to-[#3b82f6] px-4 pb-12 pt-14">
        <div className="pointer-events-none absolute bottom-0 left-1/2 h-32 w-[800px] -translate-x-1/2 rounded-full bg-white/10 blur-[80px]" />
        <div className="container relative z-10 mx-auto max-w-6xl">
          <h1 className="mb-4 text-[32px] font-bold tracking-wide text-white">{hero?.title || "融资对接"}</h1>
          <p className="text-[15px] font-medium text-white/90">{hero?.subtitle}</p>
        </div>
      </div>

      <div className="border-b border-gray-200 bg-[#eef2f6] px-4 py-3">
        <div className="container mx-auto flex max-w-6xl items-center gap-2 text-[13px] font-medium text-gray-500">
          <MapPin className="mb-[1px]" size={14} />
          <Link className="transition-colors hover:text-[#0052d9]" href="/">
            首页
          </Link>
          <ChevronRight className="text-gray-400" size={14} />
          <Link className="transition-colors hover:text-[#0052d9]" href="/services">
            创业服务
          </Link>
          <ChevronRight className="text-gray-400" size={14} />
          <span className="text-gray-800">融资对接</span>
        </div>
      </div>

      <div className="container mx-auto flex-1 max-w-6xl px-4 py-10">
        <div className="rounded-2xl border border-blue-50 bg-[#f8fbff] p-8 shadow-sm md:p-10">
          <h2 className="mb-4 text-[20px] font-bold text-gray-800">{intro?.title}</h2>
          <p className="mb-10 text-[14px] leading-relaxed text-gray-500 text-justify">{intro?.content}</p>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {items.map((item) => (
              <div
                className="flex h-full flex-col rounded-xl border border-transparent bg-white p-7 shadow-sm transition-shadow hover:border-blue-100 hover:shadow-md"
                key={item.title}
              >
                <div className="mb-4 flex items-start gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-500 shadow-inner">
                    <CmsIcon name={item.icon} size={28} strokeWidth={1.5} />
                  </div>
                  <div>
                    <h3 className="mb-2 text-[17px] font-bold text-gray-800">{item.title}</h3>
                    <p className="text-[12px] leading-relaxed text-gray-500">{item.desc}</p>
                  </div>
                </div>
                <div className="mt-auto pl-[72px] pt-4">
                  <button
                    className="flex items-center justify-center gap-1.5 rounded-lg bg-[#2b7cff] px-5 py-2 text-[13px] font-medium text-white shadow-md shadow-blue-500/20 transition-colors hover:bg-[#1d65db]"
                    type="button"
                  >
                    {item.button_text || "立即申请"}
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function SettlementPageView({ sections }: { sections: PageSection[] }) {
  const hero = getSection(sections, "hero");
  const intro = getSection(sections, "intro");
  const introExtra = parseExtra<SettlementIntroExtra>(intro?.extra_json);
  const items = parseExtra<ItemsExtra>(getSection(sections, "housing_cards")?.extra_json).items || [];

  return (
    <div className="min-h-full bg-[#f4f7fc] pb-16">
      <div className="relative overflow-hidden bg-gradient-to-r from-[#0052d9] to-[#3b82f6] px-4 pb-12 pt-14">
        <div className="pointer-events-none absolute bottom-0 left-1/2 h-32 w-[800px] -translate-x-1/2 rounded-full bg-white/10 blur-[80px]" />
        <div className="container relative z-10 mx-auto max-w-6xl">
          <h1 className="mb-4 text-[32px] font-bold tracking-wide text-white">{hero?.title || "安居落户"}</h1>
          <p className="text-[15px] font-medium text-white/90">{hero?.subtitle}</p>
        </div>
      </div>

      <div className="border-b border-gray-200 bg-[#eef2f6] px-4 py-3">
        <div className="container mx-auto flex max-w-6xl items-center gap-2 text-[13px] font-medium text-gray-500">
          <MapPin className="mb-[1px]" size={14} />
          <Link className="transition-colors hover:text-[#0052d9]" href="/">
            首页
          </Link>
          <ChevronRight className="text-gray-400" size={14} />
          <Link className="transition-colors hover:text-[#0052d9]" href="/services">
            创业服务
          </Link>
          <ChevronRight className="text-gray-400" size={14} />
          <span className="text-gray-800">安居落户</span>
        </div>
      </div>

      <div className="container mx-auto flex-1 max-w-6xl px-4 py-10">
        <div className="relative mt-8 rounded-2xl bg-[#eef5ff] p-8 shadow-sm md:p-10">
          {introExtra.image_url ? (
            <div className="absolute -top-12 right-10 z-10 hidden h-36 w-36 md:block">
              <img
                alt=""
                className="h-full w-full rotate-6 rounded-2xl border-4 border-white object-cover shadow-md transition-transform duration-500 hover:rotate-0"
                src={introExtra.image_url}
              />
            </div>
          ) : null}

          <div className="relative z-20 mb-8">
            <h2 className="flex items-center gap-3 text-[18px] font-bold text-[#0052d9]">
              {intro?.title}
              <span className="font-normal text-gray-300">|</span>
              <span className="text-[15px] font-medium text-gray-600">{intro?.subtitle}</span>
            </h2>
          </div>

          <div className="relative z-20 grid grid-cols-1 gap-5 md:grid-cols-2">
            {items.map((item) => (
              <ActionWrapper
                actionType={item.action_type}
                className="group flex items-center gap-5 rounded-xl bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
                href={item.action_value}
                key={item.title}
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-500 transition-colors group-hover:bg-[#0052d9] group-hover:text-white">
                  <CmsIcon name={item.icon} size={22} strokeWidth={1.5} />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="mb-1.5 text-[16px] font-bold text-gray-800 transition-colors group-hover:text-[#0052d9]">
                    {item.title}
                  </h3>
                  <p className="line-clamp-2 pr-2 text-[12px] leading-relaxed text-gray-500">{item.desc}</p>
                </div>
                <div className="shrink-0 text-gray-300 transition-colors group-hover:text-[#0052d9]">
                  <ArrowRight size={18} />
                </div>
              </ActionWrapper>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
