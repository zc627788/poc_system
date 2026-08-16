"use client";

import {
  ArrowRight,
  Banknote,
  Briefcase,
  Building,
  Building2,
  ChevronDown,
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
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent,
  type ReactNode,
  type SyntheticEvent,
  type WheelEvent,
} from "react";
import { NewsBadge } from "@/components/news-badge";
import { ScrollToTopLink } from "@/components/scroll-to-top-link";
import { SharedSearchActionCard } from "@/components/shared-search-action-card";
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

const opcBusinessRegistrationTitle = "OPC工商注册";

function getServiceCardDisplayTitle(item: CardItem) {
  const actionValue = item.action_value?.trim().replace(/\/$/, "");
  return actionValue === "/setup" ? opcBusinessRegistrationTitle : item.title;
}

function getSupportCardIcon(item: CardItem): LucideIcon {
  const actionValue = item.action_value?.trim().replace(/\/$/, "");
  const title = getServiceCardDisplayTitle(item);

  if (actionValue === "/setup" || title.includes("工商")) {
    return FileCheck;
  }

  if (actionValue === "/settlement" || title.includes("安居") || title.includes("落户")) {
    return Home;
  }

  if (actionValue === "/financing" || title.includes("融资")) {
    return Coins;
  }

  return Briefcase;
}

const opcGuideDismissStorageKey = "opc-setup-guide-dismissed";
const setupGuideFormWidth = 1040;
const setupGuideViewportPadding = 16;

type SetupGuideOption = {
  title: string;
  summary: string;
};

type SetupGuideExhibit = {
  alt: string;
  imageClassName: string;
  imageSrc: string;
  mobileStyle?: CSSProperties;
  showArrow?: boolean;
  style: CSSProperties;
};

type SetupGuideExhibitPhase = "hidden" | "entering" | "entered" | "exiting";

const setupGuideOptions: SetupGuideOption[] = [
  { title: "在线办理", summary: "点击在线办理按钮，开始线上便捷化申请" },
  { title: "登记办理", summary: "填写在线OPC工商注册的所需资料" },
  { title: "等待审核结果", summary: "在个人中心查看办理进度，审核通过后收到短信提醒。" },
];

const setupGuideExhibitPosition: CSSProperties = {
  top: "105px",
  right: "90px",
};

const setupGuideExhibitMobilePosition: CSSProperties = {
  top: "280px",
  right: "370px",
};

const setupGuideExhibitSecondPosition: CSSProperties = {
  top: "30px",
  right: "50px",
};

const setupGuideExhibitSecondMobilePosition: CSSProperties = {
  top: "240px",
  right: "360px",
};

const setupGuideExhibitThirdPosition: CSSProperties = {
  top: "90px",
  right: "40px",
};

const setupGuideExhibitThirdMobilePosition: CSSProperties = {
  top: "280px",
  right: "375px",
};

const setupGuideArrowOverlayPosition: CSSProperties = {
  top: "45px",
  right: "100px",
};

const setupGuideArrowOverlayMobilePosition: CSSProperties = {
  top: "45px",
  right: "100px",
};

const setupGuideOptionsMobilePosition: CSSProperties = {
  top: "-100px",
};

const setupGuideExhibits: SetupGuideExhibit[] = [
  {
    alt: "在线办理示意图",
    imageClassName: "h-auto w-[272px] sm:w-[430px]",
    imageSrc: "/service-OPCsetip-director-exhibit1.png",
    mobileStyle: setupGuideExhibitMobilePosition,
    showArrow: true,
    style: setupGuideExhibitPosition,
  },
  {
    alt: "登记办理示意图",
    imageClassName: "h-auto w-[268px] sm:w-[455px]",
    imageSrc: "/service-OPCsetip-director-exhibit2.png",
    mobileStyle: setupGuideExhibitSecondMobilePosition,
    style: setupGuideExhibitSecondPosition,
  },
  {
    alt: "等待审核结果示意图",
    imageClassName: "h-auto w-[285px] sm:w-[487px]",
    imageSrc: "/service-OPCsetip-director-exhibit3.png",
    mobileStyle: setupGuideExhibitThirdMobilePosition,
    style: setupGuideExhibitThirdPosition,
  },
];

function createInitialGuideExhibitPhases(): SetupGuideExhibitPhase[] {
  return setupGuideExhibits.map((_, index) => (index === 0 ? "entered" : "hidden"));
}

function getGuideExhibitMotionClass(phase: SetupGuideExhibitPhase) {
  if (phase === "entered") {
    return "translate-y-0 opacity-100";
  }

  if (phase === "entering") {
    return "-translate-y-2 opacity-0 pointer-events-none";
  }

  return "translate-y-2 opacity-0 pointer-events-none";
}

function getSetupGuideModalStyle(isMobileGuideViewport: boolean): CSSProperties {
  const preferredHeight = isMobileGuideViewport ? 680 : 565;
  const viewportHeight = `calc(100vh - ${setupGuideViewportPadding * 2}px)`;

  return {
    height: `min(${preferredHeight}px, ${viewportHeight})`,
    maxHeight: viewportHeight,
    maxWidth: `calc(100vw - ${setupGuideViewportPadding * 2}px)`,
    width: `min(${setupGuideFormWidth}px, calc(100vw - ${setupGuideViewportPadding * 2}px))`,
  };
}

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

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  const hour = `${date.getHours()}`.padStart(2, "0");
  const minute = `${date.getMinutes()}`.padStart(2, "0");
  const second = `${date.getSeconds()}`.padStart(2, "0");
  return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
}

function swapBrokenImage(event: SyntheticEvent<HTMLImageElement>, fallbackSrc: string) {
  const target = event.currentTarget;
  if (!fallbackSrc || target.dataset.fallbackApplied === "true") {
    return;
  }
  target.dataset.fallbackApplied = "true";
  target.src = fallbackSrc;
}

function articleTag(categoryCode: string) {
  return articleTabs.find((item) => item.code === categoryCode)?.tag || "资讯";
}
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
      <ScrollToTopLink className={className} href={href}>
        {children}
      </ScrollToTopLink>
    );
  }

  return <div className={className}>{children}</div>;
}

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
            <ScrollToTopLink className="transition-colors hover:text-[#0052d9]" href={item.href}>
              {item.label}
            </ScrollToTopLink>
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
  const [newsMenuOpen, setNewsMenuOpen] = useState(false);
  const [keyword, setKeyword] = useState("");

  const currentItems = articlesByTab[activeTab] || [];
  const activeTabMeta = articleTabs.find((tab) => tab.code === activeTab) || articleTabs[0];
  const filteredItems = currentItems.filter((item) =>
    item.title.toLowerCase().includes(keyword.toLowerCase().trim())
  );

  return (
    <div className="min-h-full bg-[#f5f7fa] pb-16">
      <section className="relative mb-8 overflow-hidden border-b border-[#eaf0fb] bg-[#f8fbff] bg-none lg:bg-[url('/feedbackback.png')] lg:bg-cover lg:bg-center lg:bg-no-repeat">
        <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[48%] bg-[radial-gradient(circle_at_center,rgba(81,136,255,0.10)_0%,rgba(81,136,255,0)_72%)] lg:block" />
        <div className="container relative mx-auto px-4">
          <div className="grid min-h-[146px] items-center gap-6 py-8 md:grid-cols-[minmax(0,1fr)_260px] md:gap-8 lg:min-h-[134px] lg:grid-cols-[minmax(0,1fr)_360px] lg:py-[3.75rem] xl:grid-cols-[minmax(0,1fr)_420px]">
            <div className="min-w-0">
              <h1 className="text-[26px] font-black tracking-[0.01em] text-[#0a50d5] sm:text-[32px] lg:text-[36px]">
                {hero?.title || "最新动态"}
              </h1>
              <p className="mt-4 text-[14px] font-semibold tracking-[0.03em] text-[#0e63ea] sm:text-[17px]">
                {hero?.subtitle || "一站掌握人工智能 OPC 创业动态"}
              </p>
            </div>
            <div className="hidden md:block" />
          </div>
        </div>
      </section>

      <div className="container mx-auto flex-1 px-4">
        <Breadcrumbs items={[{ label: "首页", href: "/" }, { label: "最新动态" }]} />

        <SharedSearchActionCard
          onChange={(event) => setKeyword(event.target.value)}
          onReset={() => setKeyword("")}
          placeholder="请输入关键词进行搜索"
          value={keyword}
        />

        <div className="min-h-[400px] rounded-lg bg-white p-6 shadow-sm">
          <div className="mb-6 flex flex-col gap-3 border-b border-gray-100 pb-3 sm:hidden">
            <button
              aria-expanded={newsMenuOpen}
              className="flex h-[44px] items-center justify-between rounded-[14px] border border-[#D6DEEB] bg-white px-4 text-left text-[15px] font-medium text-[#111111]"
              onClick={() => setNewsMenuOpen((value) => !value)}
              type="button"
            >
              <span>{activeTabMeta.name}</span>
              <ChevronDown className={`transition-transform duration-200 ${newsMenuOpen ? "rotate-180" : "rotate-0"}`} size={18} />
            </button>
            {newsMenuOpen ? (
              <div className="space-y-2 rounded-[16px] border border-[#E5EAF3] bg-[#F8FAFF] p-2">
                {articleTabs.map((tab) => {
                  const isActive = activeTab === tab.code;
                  return (
                    <button
                      className={`flex w-full items-center justify-between rounded-[12px] px-3 py-3 text-left text-[14px] transition-colors ${
                        isActive ? "bg-[#E8F0FF] font-medium text-[#0052FF]" : "bg-white text-[#475569]"
                      }`}
                      key={tab.code}
                      onClick={() => {
                        setActiveTab(tab.code);
                        setNewsMenuOpen(false);
                      }}
                      type="button"
                    >
                      <span>{tab.name}</span>
                      {isActive ? <span className="h-[6px] w-[6px] rounded-full bg-[#0052FF]" /> : null}
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>

          <div className="custom-scrollbar -mx-2 mb-6 hidden overflow-x-auto border-b border-gray-100 px-2 sm:block">
            <div className="flex min-w-max gap-5 sm:gap-8 md:gap-10">
              {articleTabs.map((tab) => {
                const isActive = activeTab === tab.code;
                return (
                  <button
                    className={`relative shrink-0 whitespace-nowrap pb-[16px] transition-opacity hover:opacity-70 ${
                      isActive
                        ? "text-[16px] font-medium leading-[23px] text-black sm:text-[19px] sm:leading-[27px]"
                        : "text-[14px] font-normal leading-[20px] text-[#666666] sm:text-[16px] sm:leading-[23px]"
                    }`}
                    key={tab.code}
                    onClick={() => setActiveTab(tab.code)}
                    type="button"
                  >
                    {tab.name}
                    {isActive ? (
                      <span className="absolute bottom-[2px] left-1/2 h-[6px] w-[18px] -translate-x-1/2 rounded-[67px] bg-[#0052FF] sm:h-[7px] sm:w-[21px]" />
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            {filteredItems.length > 0 ? (
              filteredItems.map((item) => (
                <a
                  className="group flex flex-col gap-2 border-b border-[#E5EAF3] px-2 py-4 transition-colors last:border-b-0 hover:bg-gray-50/50 sm:flex-row sm:items-center sm:justify-between"
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

export function LegacyCommunityPageView({ sections }: { sections: PageSection[] }) {
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

export { CommunityPageView } from "@/components/community-page-view";

export function ServicesPageView({ sections }: { sections: PageSection[] }) {
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
      <div className="container mx-auto mb-16 max-w-7xl px-4 pt-8 lg:pt-10">
        <Breadcrumbs items={[{ label: "首页", href: "/" }, { label: "创业服务" }]} compact />

        <SharedSearchActionCard
          className="mb-8"
          onChange={(event) => setSearchKeyword(event.target.value)}
          onReset={() => setSearchKeyword("")}
          placeholder="请输入政策关键词..."
          value={searchKeyword}
        />

        <div className="mb-16 flex flex-col gap-6">
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5 flex flex-col gap-4 border-b border-gray-100 pb-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-2">
                <Filter className="text-[#0052d9]" size={20} />
                <h3 className="text-[17px] font-bold text-gray-900">政策匹配</h3>
              </div>
              <button
                className="inline-flex h-[34px] w-fit items-center justify-center gap-2 rounded-[4px] bg-[#0052FF] px-4 transition-opacity hover:opacity-90"
                onClick={() => {
                  setSelectedTypes([]);
                  setSelectedStages([]);
                  setSearchKeyword("");
                }}
                type="button"
              >
                <RefreshCw className="text-white" size={13} strokeWidth={2} />
                <span className="text-[12px] font-medium leading-[17px] text-white">重置筛选</span>
              </button>
            </div>

            <div className="grid gap-5 lg:grid-cols-2 lg:gap-8">
              <div>
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

              <div>
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
            </div>
          </div>

          <div>
            <div className="mb-5 flex flex-col justify-between gap-4 rounded-xl border border-blue-100 bg-blue-50/50 p-5 sm:flex-row sm:items-center">
              <div>
                <h3 className="mb-1 text-[18px] font-bold text-gray-900">
                  已为您匹配<span className="mx-1 text-[22px] text-[#0052d9]">{filteredPolicies.length}</span> 项适用政策
                </h3>
                <p className="text-[13px] text-gray-500">
                  根据{" "}
                  {activeFilters.length > 0 ? (
                    <span className="font-medium text-blue-600">“{activeFilters.join(" + ")}”</span>
                  ) : (
                    "您的全部条件"
                  )}{" "}
                  {searchKeyword ? <span className="font-medium text-blue-600">及关键词“{searchKeyword}”</span> : null} 推荐
                </p>
              </div>
            </div>

            {filteredPolicies.length > 0 ? (
              <div className="mb-8 flex flex-col gap-4">
                {filteredPolicies.map((item, index) => (
                  <div
                    className="group grid gap-4 rounded-xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:shadow-md lg:grid-cols-[minmax(0,1fr)_220px] lg:items-center lg:p-6"
                    key={`${item.title}-${item.action_value || "policy"}-${index}`}
                  >
                    <div className="min-w-0">
                      <h4 className="mb-2 text-[16px] font-bold text-gray-900 transition-colors group-hover:text-[#0052d9]">
                        {item.title}
                      </h4>
                      <p className="line-clamp-2 text-[13px] leading-relaxed text-gray-500">{item.desc}</p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {(item.tags || []).map((tag) => (
                          <span className="rounded bg-gray-100 px-2 py-1 text-[11px] font-medium text-gray-600" key={tag}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <ActionWrapper
                      actionType={item.action_type}
                      className="flex h-[32px] w-full items-center justify-center rounded-[4px] border border-[#0052FF] bg-white text-center text-[13px] font-medium text-[#0052FF] transition-colors hover:bg-[#F5F9FF]"
                      href={item.action_value}
                    >
                      {item.button_text || "查看详情"}
                    </ActionWrapper>
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
            <h2 className="route-section-title text-gray-900">{getSection(sections, "support_cards")?.title || "创业配套服务"}</h2>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {supportItems.map((item, index) => {
              const Icon = getSupportCardIcon(item);

              return (
                <ActionWrapper
                  actionType={item.action_type}
                  className="group flex cursor-pointer flex-col rounded-xl border border-gray-100 bg-white p-8 shadow-sm transition-all hover:border-blue-200 hover:shadow-md"
                  href={item.action_value}
                  key={`${item.title}-${item.action_value || "support"}-${index}`}
                >
                  <div className="mb-4 flex items-center gap-3">
                    <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#EEF5FF] text-[#0052D9] transition-colors group-hover:bg-[#E4EFFF]">
                      <Icon size={22} strokeWidth={2.2} />
                    </span>
                    <h3 className="text-[18px] font-bold text-gray-900">{getServiceCardDisplayTitle(item)}</h3>
                  </div>
                  <p className="mb-8 flex-1 text-[14px] leading-relaxed text-gray-500">{item.desc}</p>
                  <div className="flex h-[32px] w-full items-center justify-center rounded-[4px] border border-[#0052FF] bg-white text-[13px] font-medium text-[#0052FF] transition-colors group-hover:bg-[#F5F9FF]">
                    <span>查看详情</span>
                  </div>
                </ActionWrapper>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export function SetupPageView({ sections }: { sections: PageSection[] }) {
  const hero = getSection(sections, "hero");
  const journey = parseExtra<SetupJourneyExtra>(getSection(sections, "journey")?.extra_json);
  const [guideOpen, setGuideOpen] = useState(false);
  const [desktopTipOpen, setDesktopTipOpen] = useState(false);
  const [activeGuideSlide, setActiveGuideSlide] = useState(0);
  const [displayedGuideSlide, setDisplayedGuideSlide] = useState(0);
  const [guideExhibitPhases, setGuideExhibitPhases] = useState<SetupGuideExhibitPhase[]>(createInitialGuideExhibitPhases);
  const [isMobileGuideViewport, setIsMobileGuideViewport] = useState(false);
  const [guideViewportReady, setGuideViewportReady] = useState(false);
  const [setupJourneyMobileScale, setSetupJourneyMobileScale] = useState(1);
  const [setupJourneyMobileHeight, setSetupJourneyMobileHeight] = useState(0);
  const setupJourneyViewportRef = useRef<HTMLDivElement | null>(null);
  const setupJourneyContentRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const mediaQuery = window.matchMedia("(max-width: 639px)");
    const syncViewport = (event?: MediaQueryListEvent) => {
      const nextIsMobile = event ? event.matches : mediaQuery.matches;
      setIsMobileGuideViewport(nextIsMobile);
      setGuideViewportReady(true);
    };

    const initialIsMobile = mediaQuery.matches;
    setIsMobileGuideViewport(initialIsMobile);
    setGuideViewportReady(true);

    const dismissed = window.localStorage.getItem(opcGuideDismissStorageKey);
    if (dismissed !== "1") {
      setGuideOpen(true);
    }

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", syncViewport);
      return () => mediaQuery.removeEventListener("change", syncViewport);
    }

    mediaQuery.addListener(syncViewport);
    return () => mediaQuery.removeListener(syncViewport);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !isMobileGuideViewport) {
      setSetupJourneyMobileScale(1);
      setSetupJourneyMobileHeight(0);
      return;
    }

    const syncJourneyScale = () => {
      const viewport = setupJourneyViewportRef.current;
      const content = setupJourneyContentRef.current;
      if (!viewport || !content) {
        return;
      }

      const availableWidth = viewport.clientWidth;
      const contentWidth = content.scrollWidth;
      const contentHeight = content.scrollHeight;
      if (!contentWidth || !contentHeight) {
        return;
      }

      const nextScale = Math.min(1, availableWidth / contentWidth);
      setSetupJourneyMobileScale(nextScale);
      setSetupJourneyMobileHeight(contentHeight * nextScale);
    };

    syncJourneyScale();

    const resizeObserver =
      typeof ResizeObserver !== "undefined" ? new ResizeObserver(() => syncJourneyScale()) : null;

    if (resizeObserver) {
      if (setupJourneyViewportRef.current) {
        resizeObserver.observe(setupJourneyViewportRef.current);
      }
      if (setupJourneyContentRef.current) {
        resizeObserver.observe(setupJourneyContentRef.current);
      }
    }

    window.addEventListener("resize", syncJourneyScale);
    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener("resize", syncJourneyScale);
    };
  }, [isMobileGuideViewport]);

  useEffect(() => {
    const modalOpen = guideOpen || desktopTipOpen;
    if (typeof document === "undefined" || !modalOpen) {
      return;
    }

    const { body, documentElement } = document;
    const scrollY = window.scrollY || window.pageYOffset;
    const previousBodyOverflow = body.style.overflow;
    const previousBodyPaddingRight = body.style.paddingRight;
    const previousBodyPosition = body.style.position;
    const previousBodyTop = body.style.top;
    const previousBodyLeft = body.style.left;
    const previousBodyRight = body.style.right;
    const previousBodyWidth = body.style.width;
    const previousBodyOverscrollBehavior = body.style.overscrollBehavior;
    const previousHtmlOverflow = documentElement.style.overflow;
    const previousHtmlOverscrollBehavior = documentElement.style.overscrollBehavior;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    documentElement.style.overflow = "hidden";
    documentElement.style.overscrollBehavior = "none";
    body.style.overflow = "hidden";
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.left = "0";
    body.style.right = "0";
    body.style.width = "100%";
    body.style.overscrollBehavior = "none";
    if (scrollbarWidth > 0) {
      body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      documentElement.style.overflow = previousHtmlOverflow;
      documentElement.style.overscrollBehavior = previousHtmlOverscrollBehavior;
      body.style.overflow = previousBodyOverflow;
      body.style.paddingRight = previousBodyPaddingRight;
      body.style.position = previousBodyPosition;
      body.style.top = previousBodyTop;
      body.style.left = previousBodyLeft;
      body.style.right = previousBodyRight;
      body.style.width = previousBodyWidth;
      body.style.overscrollBehavior = previousBodyOverscrollBehavior;
      window.scrollTo(0, scrollY);
    };
  }, [guideOpen, desktopTipOpen]);

  useEffect(() => {
    if (activeGuideSlide === displayedGuideSlide) {
      return;
    }

    const previousSlide = displayedGuideSlide;
    const nextSlide = activeGuideSlide;

    setGuideExhibitPhases((prev) =>
      prev.map((_, index) => {
        if (index === previousSlide) {
          return "exiting";
        }
        if (index === nextSlide) {
          return "entering";
        }
        return "hidden";
      })
    );

    const enterFrame = window.requestAnimationFrame(() => {
      setGuideExhibitPhases((prev) =>
        prev.map((phase, index) => {
          if (index === nextSlide) {
            return "entered";
          }
          if (index === previousSlide && phase === "exiting") {
            return "exiting";
          }
          return "hidden";
        })
      );
    });

    const cleanupTimer = window.setTimeout(() => {
      setDisplayedGuideSlide(nextSlide);
      setGuideExhibitPhases((prev) =>
        prev.map((_, index) => (index === nextSlide ? "entered" : "hidden"))
      );
    }, 320);

    return () => {
      window.cancelAnimationFrame(enterFrame);
      window.clearTimeout(cleanupTimer);
    };
  }, [activeGuideSlide, displayedGuideSlide]);

  const handleCloseGuide = () => {
    setGuideOpen(false);
    setActiveGuideSlide(0);
    setDisplayedGuideSlide(0);
    setGuideExhibitPhases(createInitialGuideExhibitPhases());
  };

  const handleCloseGuideWithDesktopTip = () => {
    handleCloseGuide();
    if (isMobileGuideViewport) {
      setDesktopTipOpen(true);
    }
  };

  const handleCloseDesktopTip = () => {
    setDesktopTipOpen(false);
  };

  const handleDismissGuide = () => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(opcGuideDismissStorageKey, "1");
    }
    handleCloseGuide();
    if (isMobileGuideViewport) {
      setDesktopTipOpen(true);
    }
  };

  const handleGuideWheel = (event: WheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (event.deltaY === 0) {
      return;
    }
    setActiveGuideSlide((prev) => {
      if (event.deltaY > 0) {
        return Math.min(prev + 1, setupGuideOptions.length - 1);
      }
      return Math.max(prev - 1, 0);
    });
  };

  const handleGuideTrackClick = (event: MouseEvent<HTMLDivElement>) => {
    const trackRect = event.currentTarget.getBoundingClientRect();
    const clickOffsetY = event.clientY - trackRect.top;
    const nextSlide = Math.floor(clickOffsetY / 80);
    const safeSlide = Math.max(0, Math.min(nextSlide, setupGuideOptions.length - 1));
    setActiveGuideSlide(safeSlide);
  };

  const setupJourneyDiagram = (
    <div className="flex items-stretch justify-center gap-6 px-0 pt-10 sm:px-4 sm:pt-0">
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
  );

  return (
    <>
      {guideOpen ? (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 px-4 backdrop-blur-[2px]"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              handleCloseGuideWithDesktopTip();
            }
          }}
          style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0 }}
        >
          <div
            className="relative overflow-hidden rounded-[16px] bg-[#FFFFFF] p-5 opacity-100 shadow-[0_24px_60px_rgba(0,0,0,0.18)] sm:p-6"
            onWheel={handleGuideWheel}
            style={{
              ...getSetupGuideModalStyle(isMobileGuideViewport),
              backgroundColor: "#FFFFFF",
              backgroundImage: "url('/service-OPCsetup-director-background.png')",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
              backgroundSize: "cover",
            }}
          >
            <button
              className="absolute right-4 top-4 z-20 flex h-7 w-7 items-center justify-center rounded-full text-[#8898b6] transition-colors hover:bg-[#f0f4fb] hover:text-[#4a5b78]"
              onClick={handleCloseGuideWithDesktopTip}
              type="button"
            >
              <X size={16} />
            </button>

            <div className="relative -left-[10px] flex h-full min-h-0 items-center gap-2 sm:left-auto sm:-right-[50px] sm:gap-3">
              <div
                className="relative flex h-full items-center"
                style={isMobileGuideViewport ? setupGuideOptionsMobilePosition : undefined}
              >
                <div className="relative h-[240px] w-[8px] cursor-pointer rounded-[30px] bg-[#EAECF0]" onClick={handleGuideTrackClick}>
                  <span
                    className="absolute left-0 top-0 h-[80px] w-[8px] rounded-[30px] bg-[#BEEC00] transition-transform duration-500"
                    style={{ transform: `translateY(${activeGuideSlide * 80}px)` }}
                  />
                </div>
              </div>

              <div className="relative -ml-2 h-full min-w-0 flex-1 sm:-ml-3">
                <div className="absolute left-0 top-0 min-w-0">
                  <h2
                    className="h-[59px] w-[259px] whitespace-nowrap text-left text-[35px] font-extrabold leading-[50px] text-[#0052D9] sm:text-[42px] sm:leading-[59px]"
                    style={{ fontFamily: "PingFang SC, PingFang SC", fontStyle: "normal", textTransform: "none" }}
                  >
                    OPC工商注册办理指引
                  </h2>
                  <p
                    className="mt-2 h-[24px] w-[408px] text-left text-[13px] font-medium leading-[20px] text-[#1751AE] sm:text-[17px] sm:leading-[24px]"
                    style={{ fontFamily: "PingFang SC, PingFang SC", fontStyle: "normal", textTransform: "none" }}
                  >
                    提供企业注册、税务登记、对公账户等一站式注册服务
                  </p>
                </div>

                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2">
                  <div className="flex h-[240px] w-full items-center gap-4">
                    <div
                      className="relative flex min-w-0 flex-1 flex-col justify-between"
                      style={isMobileGuideViewport ? setupGuideOptionsMobilePosition : undefined}
                    >
                      {setupGuideOptions.map((item, index) => (
                        <button
                          className="flex h-[80px] w-full items-center rounded-[12px] pl-2 pr-4 text-left transition-colors"
                          key={item.title}
                          onClick={() => setActiveGuideSlide(index)}
                          type="button"
                        >
                          <div className="space-y-1">
                            <div
                              className="h-[34px] min-w-[96px] w-fit whitespace-nowrap text-left text-[22px] font-bold text-[#333333] sm:text-[24px]"
                              style={{ fontFamily: "PingFang SC, PingFang SC", fontStyle: "normal", textTransform: "none" }}
                            >
                              {item.title}
                            </div>
                            <div
                              className="h-[20px] w-[252px] text-left text-[12px] font-medium text-[#666666] sm:text-[14px]"
                              style={{ fontFamily: "PingFang SC, PingFang SC", fontStyle: "normal", textTransform: "none" }}
                              title={item.summary}
                            >
                              {item.summary}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>

                    <div className="relative shrink-0 h-[470px] w-[700px] overflow-visible">
                      {setupGuideExhibits.map((exhibit, index) => {
                        const motionClass = getGuideExhibitMotionClass(guideExhibitPhases[index] || "hidden");

                        return (
                          <div
                            className="absolute"
                            key={exhibit.alt}
                            style={isMobileGuideViewport ? exhibit.mobileStyle || exhibit.style : exhibit.style}
                          >
                            <img
                              alt={exhibit.alt}
                              className={`block max-w-none transition-all duration-700 ease-out ${motionClass} ${exhibit.imageClassName}`}
                              src={exhibit.imageSrc}
                            />
                            {exhibit.showArrow ? (
                              <img
                                alt="箭头指示"
                                className={`pointer-events-none absolute z-10 hidden w-[364px] transition-all duration-700 ease-out sm:block sm:w-auto ${motionClass}`}
                                src="/service-OPCsetip-director-arrow.png"
                                style={isMobileGuideViewport ? setupGuideArrowOverlayMobilePosition : setupGuideArrowOverlayPosition}
                              />
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="absolute bottom-[25px] left-1/2 flex w-[274px] -translate-x-1/2 items-center justify-between sm:bottom-[30px] sm:left-0 sm:w-auto sm:translate-x-0 sm:flex-wrap sm:gap-3">
                  <ScrollToTopLink
                    className="inline-flex h-[38px] w-[127px] items-center justify-center rounded-[5px] border border-[#0052FF] bg-white text-[17px] font-medium text-[#0052FF] sm:h-[42px] sm:w-[140px] sm:rounded-[4px] sm:text-[14px]"
                    href="/setup/apply"
                    onClick={handleCloseGuide}
                  >
                    立即办理
                  </ScrollToTopLink>
                  <button
                    className="inline-flex h-[38px] w-[127px] items-center justify-center rounded-[5px] bg-[#BEEC00] text-[17px] font-medium text-black sm:h-[42px] sm:w-[140px] sm:rounded-[4px] sm:text-[14px]"
                    onClick={handleDismissGuide}
                    type="button"
                  >
                    不再提醒
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {desktopTipOpen ? (
        <div className="fixed inset-0 z-[81] flex items-center justify-center bg-slate-950/45 px-4">
          <div className="w-full max-w-[320px] rounded-[18px] bg-white p-6 shadow-[0_24px_64px_rgba(15,23,42,0.18)]">
            <div className="text-center text-[20px] font-black leading-8 text-black">建议电脑端进行OPC办理操作</div>
            <div className="mt-5 flex justify-center">
              <button
                className="inline-flex h-[42px] items-center justify-center rounded-[12px] bg-[#BEEC00] px-6 text-[14px] font-semibold text-black"
                onClick={handleCloseDesktopTip}
                type="button"
              >
                我知道了
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="min-h-full bg-[#f5f7fa] pb-16">
        <div className="mb-8 bg-[#eef3fc] px-4 py-14">
          <div className="container mx-auto flex max-w-6xl flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="route-hero-title mb-3 text-[#0052d9]">{hero?.title || "OPC工商注册全流程指引"}</h1>
              <p className="route-hero-subtitle text-[#0052d9] opacity-90">{hero?.subtitle}</p>
            </div>

            <div className="flex w-full max-w-[292px] items-center justify-between md:w-[292px]">
              <button
                className="inline-flex h-[42px] w-[140px] items-center justify-center rounded-[4px] border border-[#0052FF] bg-white text-[14px] font-bold text-[#0052FF]"
                onClick={() => setGuideOpen(true)}
                type="button"
              >
                办理指引
              </button>
              <ScrollToTopLink
                className="inline-flex h-[42px] w-[140px] items-center justify-center rounded-[4px] bg-[#BEEC00] text-[14px] font-bold text-black"
                href="/setup/apply"
              >
                在线办理
              </ScrollToTopLink>
            </div>
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

          <div className="custom-scrollbar overflow-x-auto rounded-2xl border border-gray-100 bg-white px-[5px] py-8 shadow-sm md:p-12">
            <h2 className="mb-10 px-6 text-center text-2xl font-bold text-gray-800 md:mb-16 md:px-0">{getSection(sections, "journey")?.title}</h2>

            {guideViewportReady ? (
              isMobileGuideViewport ? (
                <div ref={setupJourneyViewportRef} className="w-full overflow-hidden">
                  <div style={{ height: setupJourneyMobileHeight ? `${setupJourneyMobileHeight}px` : undefined }}>
                    <div
                      ref={setupJourneyContentRef}
                      className="origin-top-left"
                      style={{ transform: `scale(${setupJourneyMobileScale})`, width: "max-content" }}
                    >
                      {setupJourneyDiagram}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="min-w-[950px]">{setupJourneyDiagram}</div>
              )
            ) : (
              <div className="h-[320px] w-full" />
            )}
          </div>
        </div>
      </div>
    </>
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
            {items.map((item, index) => (
              <div
                className="flex h-full flex-col rounded-xl border border-transparent bg-white p-7 shadow-sm transition-shadow hover:border-blue-100 hover:shadow-md"
                key={`${item.title}-${item.action_value || "fund"}-${index}`}
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
                onError={(event) => swapBrokenImage(event, "/service-settlement.svg")}
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
            {items.map((item, index) => (
              <ActionWrapper
                actionType={item.action_type}
                className="group flex items-center gap-5 rounded-xl bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
                href={item.action_value}
                key={`${item.title}-${item.action_value || "settlement"}-${index}`}
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
