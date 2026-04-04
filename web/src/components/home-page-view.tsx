"use client";

import {
  ArrowRight,
  Coins,
  Cpu,
  FileCheck,
  Home,
  Server,
  Shield,
  Wrench
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type MouseEvent, type ReactNode } from "react";
import { articleTabs } from "@/lib/site-constants";
import type { Article, Banner, PageSection, ServiceItem } from "@/types";

type SectionExtra = {
  button_text?: string;
  action_type?: string;
  action_value?: string;
  image_url?: string;
  bg_from?: string;
  bg_to?: string;
};

type HeroSlide = {
  title: string;
  subtitle: string;
  highlightTitle: string;
  description: string;
  imageUrl: string;
  actionType?: string;
  actionValue?: string;
};

type NewsItem = {
  tag: string;
  title: string;
  date: string;
  href: string;
  target: "_self" | "_blank";
};

type ServiceCard = {
  icon: typeof FileCheck;
  title: string;
  desc: string;
  href: string;
  actionType: string;
};

type ScenarioCard = {
  title: string;
  subtitle: string;
  desc: string;
  href: string;
  buttonText: string;
  bgFrom: string;
  bgTo: string;
};

const communityFallbackImage =
  "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=400";

const defaultHeroSlides: HeroSlide[] = [
  {
    title: "数智立信 创见不凡",
    subtitle: "成为一流的数智产业生态构建者",
    highlightTitle: "AI 黑客松大赛",
    description: "48小时极限开发，AIGC与AI Agent双赛道角逐！\n发掘优质项目，搭建“产学研投”融合平台。",
    imageUrl: "/prototype-assets/7.png",
    actionType: "external",
    actionValue: "https://mp.weixin.qq.com/s/Jk_CpIzU5o99-i3jliTJ0w?scene=1&click_id=1"
  },
  {
    title: "数智立信 创见不凡",
    subtitle: "成为一流的数智产业生态构建者",
    highlightTitle: "AI 火炬系列活动",
    description: "厦门赛博龙虾俱乐部 · 唠嗑局 No.2 期\n聚焦行业前沿探索，激发创业创新灵感。",
    imageUrl: "/prototype-assets/火炬系列.png",
    actionType: "external",
    actionValue: "https://mp.weixin.qq.com/s/F-Ze-sn-3lUxorbJyBm-VQ"
  },
  {
    title: "数智立信 创见不凡",
    subtitle: "成为一流的数智产业生态构建者",
    highlightTitle: "厦门OPC社区空间",
    description: "提供空间载体、算力支持、财税辅导等全链条赋能\n助力“一人成军、轻量创业”。",
    imageUrl: "/prototype-assets/社区.png",
    actionType: "internal",
    actionValue: "/community"
  }
];

const defaultNewsByTab: Record<string, NewsItem[]> = {
  activity: [
    {
      tag: "活动",
      title: "「爱XIA创AI黑客松」公众活动",
      date: "2026-03-18",
      href: "https://mp.weixin.qq.com/s/5ZyyYJ9SxSqmVDk7dPmCAg",
      target: "_blank"
    },
    {
      tag: "活动",
      title: "AI 火炬系列活动：厦门赛博龙虾俱乐部 · 唠嗑局 No.2 期",
      date: "2026-03-17",
      href: "https://mp.weixin.qq.com/s/F-Ze-sn-3lUxorbJyBm-VQ",
      target: "_blank"
    },
    {
      tag: "活动",
      title: "AI火炬系列活动——厦门首场OpenClaw聚会",
      date: "2026-03-10",
      href: "https://mp.weixin.qq.com/s/ixud6hSPtDkp6-MZU2eLXQ",
      target: "_blank"
    }
  ],
  policy: [
    {
      tag: "政策",
      title: "厦门市人民政府办公厅关于印发厦门市进一步推动人工智能产业高质量发展若干措施的通知",
      date: "2026-02-28",
      href: "https://www.xm.gov.cn/zwgk/flfg/sfbwj/202602/t20260228_2983172.htm?assistant=true",
      target: "_blank"
    },
    {
      tag: "政策",
      title: "《厦门火炬高新区关于支持人工智能和软件产业发展的若干措施》政策解读",
      date: "2026-03-02",
      href: "https://xmtorch.xm.gov.cn/xxgk/zfxxgkml/zcfg/zcjd/202603/t20260302_2983503.html",
      target: "_blank"
    },
    {
      tag: "政策",
      title: "思明区科技和工信局 思明区财政局关于印发《思明区促进新一代人工智能产业发展若干措施》的通知",
      date: "2024-12-20",
      href: "https://www.siming.gov.cn/zfxxgkzl/gbmxxgk/kjhxxhj/zfxxgkml/zcfg/202412/t20241220_1083000.htm",
      target: "_blank"
    }
  ],
  article: [
    {
      tag: "文章",
      title: "涨知识 | 无安全，不“养虾”！",
      date: "2026-03-20",
      href: "https://mp.weixin.qq.com/s/W84Q1EOdAvL4psAdKYA4Ew",
      target: "_blank"
    }
  ],
  notice: []
};

const defaultServiceCards: ServiceCard[] = [
  { icon: FileCheck, title: "OPC开办", desc: "开办指引一站式办理", href: "/setup", actionType: "internal" },
  { icon: Shield, title: "政策匹配", desc: "按身份匹配近似申报H-list政策", href: "/services", actionType: "internal" },
  { icon: Home, title: "安居落户", desc: "人才安居配套政策信息", href: "/settlement", actionType: "internal" },
  { icon: Coins, title: "融资对接", desc: "对接优质投资机构与资金", href: "/financing", actionType: "internal" }
];

const defaultScenarioCards: ScenarioCard[] = [
  {
    title: "场景机会",
    subtitle: "汇聚真实行业需求 · 发掘合作共赢商机",
    desc: "全面覆盖数字经济、人工智能、智慧物流、全空间无人体系等多元产业领域，提供最前沿的场景开放清单，助力企业快速精准寻找市场契合点。",
    href: "https://xmcj.ixiamen.org.cn/opportunity",
    buttonText: "探索场景机会",
    bgFrom: "#0052d9",
    bgTo: "#60a5fa"
  },
  {
    title: "场景能力",
    subtitle: "展示前沿技术方案 · 赋能千行百业升级",
    desc: "集中展示基于AI大模型、生物技术、清洁能源等前沿科技的场景集成服务能力与解决方案，有效对接优质创新资源，推动新质生产力落地应用。",
    href: "https://xmcj.ixiamen.org.cn/capability",
    buttonText: "查看场景能力",
    bgFrom: "#0052d9",
    bgTo: "#06b6d4"
  },
  {
    title: "场景政策",
    subtitle: "解读权威惠企资讯 · 共享政策扶持红利",
    desc: "实时汇编国家及地方层面的场景创新培育、低空经济发展、人才招引补贴等利好政策，为您提供一站式权威政策资讯与精准的申报导向指引。",
    href: "https://xmcj.ixiamen.org.cn/policy",
    buttonText: "了解场景政策",
    bgFrom: "#0052d9",
    bgTo: "#6366f1"
  }
];

function pickText(value: string | null | undefined, fallback: string) {
  return value && value.trim() ? value : fallback;
}

function parseExtra(extraJson?: string | null): SectionExtra {
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

function formatPublishDate(value: string) {
  return value.replace("T", " ").slice(0, 10);
}

function SmartLink({
  href,
  actionType,
  className,
  children
}: {
  href: string;
  actionType?: string;
  className: string;
  children: ReactNode;
}) {
  if (actionType === "external") {
    return (
      <a className={className} href={href} rel="noopener noreferrer" target="_blank">
        {children}
      </a>
    );
  }

  return (
    <Link className={className} href={href}>
      {children}
    </Link>
  );
}

export function HomePageView({
  articlesByTab,
  banners,
  sections,
  serviceItems
}: {
  articlesByTab: Record<string, Article[]>;
  banners: Banner[];
  sections: PageSection[];
  serviceItems: ServiceItem[];
}) {
  const router = useRouter();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [activeNewsTab, setActiveNewsTab] = useState<(typeof articleTabs)[number]["code"]>("activity");
  const [scenarioSlide, setScenarioSlide] = useState(0);

  const sortedHomeSections = useMemo(
    () => sections.filter((item) => item.page_key === "home").sort((a, b) => a.sort_order - b.sort_order),
    [sections]
  );

  const communitySection = useMemo(
    () => sortedHomeSections.find((item) => item.section_key === "community_intro"),
    [sortedHomeSections]
  );
  const communityExtra = parseExtra(communitySection?.extra_json);

  const marketplaceSection = useMemo(
    () => sortedHomeSections.find((item) => item.section_key === "marketplace_summary"),
    [sortedHomeSections]
  );

  const heroSlides = useMemo(() => {
    const sortedBanners = [...banners].sort((a, b) => a.sort_order - b.sort_order);
    const source = sortedBanners.length > 0 ? sortedBanners : defaultHeroSlides;

    return source.map((item, index) => {
      const fallback = defaultHeroSlides[index] || defaultHeroSlides[0];
      return {
        title: pickText("title" in item ? item.title : fallback.title, fallback.title),
        subtitle: pickText("subtitle" in item ? item.subtitle : fallback.subtitle, fallback.subtitle),
        highlightTitle: pickText(
          "highlight_title" in item ? item.highlight_title : fallback.highlightTitle,
          fallback.highlightTitle
        ),
        description: pickText("description" in item ? item.description : fallback.description, fallback.description),
        imageUrl: ("image_url" in item ? item.image_url : fallback.imageUrl) || fallback.imageUrl,
        actionType: ("action_type" in item ? item.action_type : fallback.actionType) || fallback.actionType,
        actionValue: ("action_value" in item ? item.action_value || undefined : fallback.actionValue) || fallback.actionValue
      } satisfies HeroSlide;
    });
  }, [banners]);

  const newsByTab = useMemo(() => {
    return Object.fromEntries(
      articleTabs.map((tab) => {
        const items = articlesByTab[tab.code] || [];
        if (items.length === 0) {
          return [tab.code, defaultNewsByTab[tab.code] || []];
        }

        return [
          tab.code,
          items.map((item) => ({
            tag: tab.tag,
            title: pickText(item.title, "内容待补充"),
            date: formatPublishDate(item.publish_at),
            href: item.external_url || "/news",
            target: item.link_type === "external" ? "_blank" : "_self"
          }))
        ];
      })
    ) as Record<string, NewsItem[]>;
  }, [articlesByTab]);

  const serviceCards = useMemo(() => {
    const sortedItems = [...serviceItems].sort((a, b) => a.sort_order - b.sort_order);
    if (sortedItems.length === 0) {
      return defaultServiceCards;
    }

    return sortedItems.map((item, index) => {
      const fallback = defaultServiceCards[index] || defaultServiceCards[0];
      return {
        icon: fallback.icon,
        title: pickText(item.title, fallback.title),
        desc: pickText(item.summary, fallback.desc),
        href: item.target_value || fallback.href,
        actionType: item.target_type || fallback.actionType
      } satisfies ServiceCard;
    });
  }, [serviceItems]);

  const scenarioCards = useMemo(() => {
    const source = sortedHomeSections
      .filter((item) => item.section_key.startsWith("scenario_"))
      .sort((a, b) => a.sort_order - b.sort_order);

    if (source.length === 0) {
      return defaultScenarioCards;
    }

    return source.map((item, index) => {
      const fallback = defaultScenarioCards[index] || defaultScenarioCards[0];
      const extra = parseExtra(item.extra_json);
      return {
        title: pickText(item.title, fallback.title),
        subtitle: pickText(item.subtitle, fallback.subtitle),
        desc: pickText(item.content, fallback.desc),
        href: extra.action_value || fallback.href,
        buttonText: pickText(extra.button_text, fallback.buttonText),
        bgFrom: extra.bg_from || fallback.bgFrom,
        bgTo: extra.bg_to || fallback.bgTo
      } satisfies ScenarioCard;
    });
  }, [sortedHomeSections]);

  const currentHero = heroSlides[currentSlide] || defaultHeroSlides[0];
  const currentNewsItems = newsByTab[activeNewsTab] || [];
  const currentScenario = scenarioCards[scenarioSlide] || defaultScenarioCards[0];

  const communityCard = {
    title: pickText(communitySection?.title, "厦门OPC社区"),
    desc: pickText(
      communitySection?.content,
      "聚集人工智能产业生态，为单人创业者提供低成本、高质量的创业环境与服务。助力“一人成军、轻量创业”。"
    ),
    imageUrl: communityExtra.image_url || communityFallbackImage,
    href: communityExtra.action_value || "/community",
    actionType: communityExtra.action_type || "internal"
  };

  const marketplaceTitle = pickText(marketplaceSection?.title, "AI资源集市");
  const marketplaceDesc = pickText(
    marketplaceSection?.content,
    "汇聚前沿数据资源、强劲算力服务与轻量化应用工具包，直达开发者终端，即开即用，加速AI创新落地。"
  );

  useEffect(() => {
    if (heroSlides.length <= 1) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 4000);

    return () => window.clearInterval(timer);
  }, [heroSlides.length]);

  useEffect(() => {
    if (scenarioCards.length <= 1) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setScenarioSlide((prev) => (prev + 1) % scenarioCards.length);
    }, 5000);

    return () => window.clearInterval(timer);
  }, [scenarioCards.length]);

  const handleAction = (actionType?: string, actionValue?: string) => {
    if (!actionValue || actionType === "none") {
      return;
    }

    if (actionType === "external") {
      window.open(actionValue, "_blank", "noopener,noreferrer");
      return;
    }

    router.push(actionValue);
  };

  const handleHeroClick = (event: MouseEvent<HTMLElement>) => {
    const target = event.target as HTMLElement;
    if (target.closest("button")) {
      return;
    }

    handleAction(currentHero.actionType, currentHero.actionValue);
  };

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900">
      <section
        className={`bg-[#0052d9] px-0 py-16 text-white transition-all duration-1000 md:py-28 ${
          currentHero.actionValue ? "cursor-pointer" : ""
        } relative overflow-hidden`}
        onClick={handleHeroClick}
      >
        {heroSlides.map((slide, index) => (
          <div
            key={`${slide.highlightTitle}-${index}`}
            className={`absolute inset-0 h-full w-full overflow-hidden transition-opacity duration-1000 ease-in-out ${
              index === currentSlide ? "z-0 opacity-100" : "pointer-events-none -z-10 opacity-0"
            }`}
          >
            <div
              className={`h-full w-full bg-cover bg-center bg-no-repeat transition-transform duration-[8000ms] ease-out ${
                index === currentSlide ? "scale-105" : "scale-100"
              }`}
              style={{ backgroundImage: `url(${slide.imageUrl})` }}
            />
          </div>
        ))}
        <div className="pointer-events-none absolute inset-0 z-0 w-full bg-gradient-to-r from-[#0052d9]/95 via-[#0052d9]/70 to-transparent md:w-[80%]" />

        <div className="container mx-auto relative z-10 flex min-h-[280px] flex-col items-start justify-center px-4 text-left">
          <div className="relative flex h-[220px] w-full flex-col items-start justify-center md:h-[260px]">
            {heroSlides.map((slide, index) => (
              <div
                key={`${slide.title}-${index}`}
                className={`absolute inset-0 flex flex-col items-start justify-center transition-all duration-700 ease-in-out ${
                  index === currentSlide
                    ? "pointer-events-auto z-10 translate-y-0 opacity-100"
                    : "pointer-events-none -z-10 translate-y-3 opacity-0"
                }`}
              >
                <h1 className="mb-2 text-[36px] font-black leading-tight tracking-[0.1em] drop-shadow-md md:text-[56px]">
                  {slide.title}
                </h1>
                <h2 className="mb-8 text-[14px] font-medium uppercase tracking-[0.2em] text-blue-100 opacity-90 drop-shadow-sm md:mb-10 md:text-[22px]">
                  {slide.subtitle}
                </h2>

                <div className="flex flex-col justify-center border-l-4 border-blue-400 pl-4 md:pl-5">
                  <h3 className="mb-2 flex items-center gap-2 text-[20px] font-bold tracking-wide drop-shadow-sm md:text-[28px]">
                    <span className="mb-1 inline-block h-1.5 w-1.5 rounded-full bg-white opacity-80" />
                    {slide.highlightTitle}
                  </h3>
                  <p className="max-w-3xl whitespace-pre-line text-[14px] font-medium leading-relaxed text-blue-50 opacity-80 drop-shadow-sm md:text-[16px]">
                    {slide.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="relative z-20 mt-8 flex gap-3">
            {heroSlides.map((_, index) => (
              <button
                key={`hero-dot-${index}`}
                aria-label={`Go to slide ${index + 1}`}
                className={`h-1.5 rounded-full shadow-sm transition-all duration-500 ${
                  index === currentSlide ? "w-12 bg-white" : "w-6 bg-white/40 hover:bg-white/70"
                }`}
                onClick={(event) => {
                  event.stopPropagation();
                  setCurrentSlide(index);
                }}
                type="button"
              />
            ))}
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16">
        <h2 className="mb-8 flex items-center gap-3 text-xl font-bold">
          <span className="inline-block h-6 w-1.5 rounded-full bg-blue-600" />
          <Link className="font-bold text-blue-600 hover:underline" href="/news">
            最新动态
          </Link>
        </h2>
        <div className="scrollbar-hide mb-6 flex gap-8 overflow-x-auto whitespace-nowrap border-b border-gray-200">
          {articleTabs.map((tab) => (
            <button
              key={tab.code}
              className={`relative pb-3 text-base font-medium transition-colors ${
                activeNewsTab === tab.code ? "text-blue-600" : "text-gray-500 hover:text-gray-900"
              }`}
              onClick={() => setActiveNewsTab(tab.code)}
              type="button"
            >
              {tab.name}
              {activeNewsTab === tab.code ? (
                <span className="absolute bottom-0 left-0 h-0.5 w-full rounded-t-full bg-blue-600" />
              ) : null}
            </button>
          ))}
          <Link className="ml-auto hidden pt-1 text-sm text-gray-500 hover:text-blue-600 sm:block" href="/news">
            查看更多
          </Link>
        </div>
        <div className="divide-y divide-gray-100">
          {currentNewsItems.length > 0 ? (
            currentNewsItems.map((item, index) => {
              const row = (
                <div className="group flex items-center justify-between rounded-lg px-3 py-4 text-sm transition-colors hover:bg-gray-50">
                  <span className="flex-1 truncate pr-4 transition-colors group-hover:text-blue-600">
                    <span className="mr-2 font-medium text-gray-500">【{item.tag}】</span>
                    {item.title}
                  </span>
                  <span className="ml-4 whitespace-nowrap text-xs text-gray-400 sm:text-sm">{item.date}</span>
                </div>
              );

              return item.target === "_blank" ? (
                <a key={`${item.title}-${index}`} href={item.href} rel="noopener noreferrer" target="_blank">
                  {row}
                </a>
              ) : (
                <Link key={`${item.title}-${index}`} href={item.href}>
                  {row}
                </Link>
              );
            })
          ) : (
            <div className="rounded-lg bg-gray-50 py-12 text-center text-sm text-gray-500">暂无内容，敬请期待</div>
          )}
        </div>
      </section>

      <section className="container mx-auto px-4 pb-16">
        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <h2 className="mb-8 flex items-center gap-3 text-xl font-bold">
              <span className="inline-block h-6 w-1.5 rounded-full bg-blue-600" />
              <Link className="font-bold text-blue-600 hover:underline" href="/community">
                社区简介
              </Link>
            </h2>
            <SmartLink
              actionType={communityCard.actionType}
              className="group flex h-[220px] overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition-all hover:shadow-md"
              href={communityCard.href}
            >
              <div className="relative h-full w-2/5 overflow-hidden">
                <div className="absolute inset-0 z-10 bg-blue-900/10 transition-colors group-hover:bg-transparent" />
                <img
                  alt={communityCard.title}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  src={communityCard.imageUrl}
                />
              </div>
              <div className="flex w-3/5 flex-col justify-center p-6">
                <h3 className="mb-3 text-[17px] font-bold text-blue-600">{communityCard.title}</h3>
                <p className="text-[13px] leading-relaxed text-gray-600">{communityCard.desc}</p>
                <div className="mt-4 inline-flex items-center gap-1 text-[13px] font-medium text-blue-600 group-hover:underline">
                  了解更多 <ArrowRight size={12} className="mt-0.5" />
                </div>
              </div>
            </SmartLink>
          </div>

          <div>
            <h2 className="mb-8 flex items-center gap-3 text-xl font-bold">
              <span className="inline-block h-6 w-1.5 rounded-full bg-blue-600" />
              <Link className="font-bold text-blue-600 hover:underline" href="/services">
                创业服务
              </Link>
            </h2>
            <div className="grid h-[220px] grid-cols-2 gap-4 sm:grid-cols-4">
              {serviceCards.map((card) => (
                <SmartLink
                  key={card.title}
                  actionType={card.actionType}
                  className="group flex h-full w-full cursor-pointer flex-col items-center justify-center rounded-xl border border-gray-100 bg-white p-5 text-center transition-all hover:border-blue-100 hover:shadow-lg"
                  href={card.href}
                >
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600 transition-all group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white">
                    <card.icon size={24} />
                  </div>
                  <div className="mb-1 text-sm font-bold text-gray-800">{card.title}</div>
                  <div className="text-xs text-gray-500">{card.desc}</div>
                </SmartLink>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-gray-100 bg-slate-50 px-4 py-16">
        <div className="container mx-auto mb-10 text-center">
          <h2 className="mb-3 text-2xl font-bold text-gray-900">{marketplaceTitle}</h2>
          <p className="mx-auto max-w-2xl text-[14px] text-gray-500">{marketplaceDesc}</p>
        </div>

        <div className="container mx-auto max-w-6xl space-y-12">
          <div>
            <div className="mb-5 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-[18px] font-bold">
                <span className="inline-block h-5 w-1.5 rounded-full bg-amber-500" /> 数据资源
              </h3>
              <Link className="text-[14px] font-medium text-blue-600 hover:underline" href="/marketplace">
                查看更多 &rarr;
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <a
                className="group flex flex-col rounded-xl border border-[#0052d9]/20 bg-gradient-to-br from-[#eef3fc] to-white p-5 transition-all hover:-translate-y-1 hover:shadow-xl"
                href="https://www.xmdataspace.com/"
                rel="noopener noreferrer"
                target="_blank"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#0052d9] transition-colors group-hover:bg-blue-700">
                  <Server className="text-white" size={22} />
                </div>
                <h4 className="mb-3 text-[16px] font-bold text-[#0052d9]">厦门城市可信数据空间</h4>
                <p className="flex-1 text-[13px] leading-relaxed text-gray-500">
                  立足厦门、面向全国、连接两岸、服务金砖的数据融合开发与流通利用基础设施
                </p>
                <span className="mt-5 inline-block self-start rounded-full bg-[#0052d9] px-4 py-1.5 text-[12px] font-bold text-white shadow-sm transition-colors group-hover:bg-blue-700">
                  进入总平台
                </span>
              </a>
              {[
                { title: "数据资源中心", url: "https://www.xmdataspace.com/portal/dataSource" },
                { title: "模型成果中心", url: "https://www.xmdataspace.com/portal/market" },
                { title: "高质量数据集", url: "https://www.xmdataspace.com/portal/societyMarket" }
              ].map((item) => (
                <a
                  key={item.title}
                  className="group flex flex-col rounded-xl border border-gray-100 bg-white p-5 transition-all hover:-translate-y-1 hover:shadow-xl"
                  href={item.url}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 transition-colors group-hover:bg-amber-100">
                    <Server className="text-amber-600" size={22} />
                  </div>
                  <h4 className="mb-3 text-[16px] font-bold text-gray-800">{item.title}</h4>
                  <p className="flex-1 text-[13px] leading-relaxed text-gray-500">点击查看详情</p>
                  <span className="mt-5 inline-block self-start rounded-full bg-blue-50 px-4 py-1.5 text-[12px] font-medium text-blue-600 transition-colors group-hover:bg-blue-600 group-hover:text-white">
                    查看详情
                  </span>
                </a>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-5 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-[18px] font-bold text-blue-600">
                <span className="inline-block h-5 w-1.5 rounded-full bg-blue-600" /> 轻量工具包
              </h3>
              <Link className="text-[14px] font-medium text-blue-600 hover:underline" href="/marketplace">
                查看更多 &rarr;
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
              {[
                {
                  title: "API 接口能力",
                  desc: "为 OPC 创业者提供生成服务、金融科技、数据智能等多类接口能力，帮助项目快速接入核心功能，降低开发成本，加速产品落地。",
                  href: "/api-market"
                },
                {
                  title: "MCP 标准连接",
                  desc: "通过标准化连接能力打通工具、数据与模型，让 AI 应用更充分地协同外界资源，提升自动化水平与业务闭环效率。",
                  href: "/mcp-market"
                },
                {
                  title: "一站式产品工具",
                  desc: "围绕 OPC 创业者在项目启动、产品路线、运营增长、数据分析与支付接入等环节的实际需求，提供一站式工具支持。",
                  href: "/marketplace"
                }
              ].map((item) => (
                <Link
                  key={item.title}
                  className="group relative flex cursor-pointer flex-col overflow-hidden rounded-xl border border-gray-100 bg-white p-6 transition-shadow hover:shadow-xl"
                  href={item.href}
                >
                  <div className="absolute right-0 top-0 -z-10 h-24 w-24 rounded-bl-[80px] bg-blue-50 transition-colors group-hover:bg-blue-100" />
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-900 shadow-md">
                      <Wrench className="text-white" size={20} />
                    </div>
                    <span className="text-[17px] font-bold text-gray-900">{item.title}</span>
                  </div>
                  <p className="mb-6 flex-1 text-[13px] leading-relaxed text-gray-600">{item.desc}</p>
                  <div className="self-start rounded-lg bg-gray-900 px-6 py-2 text-center text-[13px] font-medium text-white shadow-sm transition-colors group-hover:bg-gray-800">
                    了解更多
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-5 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-[18px] font-bold">
                <span className="inline-block h-5 w-1.5 rounded-full bg-emerald-500" /> 普惠算力
              </h3>
              <a
                className="text-[14px] font-medium text-blue-600 hover:underline"
                href="https://www.xmcpsp.com/"
                rel="noopener noreferrer"
                target="_blank"
              >
                查看更多 &rarr;
              </a>
            </div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <a
                className="block cursor-pointer rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 p-6 text-white shadow-md transition-all hover:-translate-y-1 hover:shadow-xl"
                href="https://www.xmcpsp.com/"
                rel="noopener noreferrer"
                target="_blank"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                  <Cpu className="text-white" size={24} />
                </div>
                <h4 className="mb-3 text-[17px] font-bold">厦门市公共算力服务平台</h4>
                <p className="flex-1 text-[13px] leading-relaxed text-emerald-50">
                  提供优质计算能力和应用、算力闭环等服务，覆盖人工智能产业高质量发展所需。
                </p>
              </a>

              {[
                { name: "MetaX C550 64GB", price: "4,320" },
                { name: "Nvidia A800 80GB", price: "55,000" },
                { name: "Iluvatar BI-V150 64GB", price: "3,960" }
              ].map((gpu) => (
                <a
                  key={gpu.name}
                  className="group flex cursor-pointer flex-col rounded-xl border border-gray-100 bg-white p-6 shadow-sm transition-shadow hover:shadow-xl"
                  href="https://www.xmcpsp.com/"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  <div className="mb-5 flex items-start justify-between">
                    <span className="pr-2 text-[15px] font-bold leading-tight text-gray-800">{gpu.name}</span>
                    <span className="whitespace-nowrap rounded-full bg-red-100 px-2.5 py-1 text-[11px] font-bold text-red-600">
                      可租赁
                    </span>
                  </div>
                  <div className="mb-6 flex-1 text-3xl font-black text-orange-500">
                    <span className="mr-1 text-lg font-bold">¥</span>
                    {gpu.price}
                    <span className="ml-1 text-[14px] font-normal text-gray-500">/ 月</span>
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
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16">
        <h2 className="mb-8 flex items-center gap-3 text-xl font-bold">
          <span className="inline-block h-6 w-1.5 rounded-full bg-blue-600" /> 场景供需对接
        </h2>

        <a
          className="group relative block cursor-pointer overflow-hidden rounded-2xl p-8 text-white shadow-xl transition-colors duration-1000 hover:shadow-2xl md:p-12"
          href={currentScenario.href}
          rel="noopener noreferrer"
          style={{
            backgroundImage: `linear-gradient(to right, ${currentScenario.bgFrom}, ${currentScenario.bgTo})`
          }}
          target="_blank"
        >
          <div className="pointer-events-none absolute right-0 top-0 h-64 w-64 translate-x-1/2 -translate-y-1/2 rounded-full bg-white/5 blur-3xl transition-all duration-1000" />
          <div className="pointer-events-none absolute bottom-0 left-0 h-48 w-48 -translate-x-1/2 translate-y-1/2 rounded-full bg-white/5 blur-3xl transition-all duration-1000" />

          <div className="pointer-events-none opacity-0 md:w-2/3">
            <span className="mb-4 inline-block px-3 py-1 text-xs">Placeholder</span>
            <h3 className="mb-4 text-3xl font-bold md:text-[32px]">Placeholder</h3>
            <p className="mb-8 max-w-2xl text-base leading-relaxed md:text-[15px]">
              全面覆盖数字经济、人工智能、智慧物流、全空间无人体系等多元产业领域，提供最前沿的场景开放清单，助力企业快速精准寻找市场契合点。
            </p>
            <div className="px-8 py-3 text-sm">Btn</div>
          </div>

          <div className="absolute inset-0 z-10 flex items-center p-8 md:p-12">
            <div className="relative flex h-full w-full items-center">
              {scenarioCards.map((item, index) => (
                <div
                  key={`${item.title}-${index}`}
                  className={`absolute w-full transition-all duration-700 ease-in-out ${
                    index === scenarioSlide ? "z-10 translate-x-0 opacity-100" : "pointer-events-none -z-10 translate-x-8 opacity-0"
                  }`}
                >
                  <div className="md:w-2/3">
                    <span className="mb-4 inline-block rounded border border-white/20 bg-white/10 px-3 py-1 text-[13px] tracking-wide text-blue-50 shadow-sm backdrop-blur-sm">
                      {item.subtitle}
                    </span>
                    <h3 className="mb-4 text-2xl font-bold tracking-wide md:text-[34px]">{item.title}</h3>
                    <p className="mb-8 max-w-2xl text-[14px] font-medium leading-relaxed text-white/80 md:text-[15px]">
                      {item.desc}
                    </p>
                    <div className="inline-flex items-center justify-center gap-2 rounded-full bg-[#0052d9] px-8 py-3.5 text-[14px] font-bold text-white transition-all group-hover:bg-blue-500 group-hover:shadow-lg group-hover:shadow-blue-500/30">
                      {item.buttonText}
                      <ArrowRight size={14} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="absolute bottom-8 right-8 z-20 flex gap-2 md:right-12">
            {scenarioCards.map((_, index) => (
              <button
                key={`scenario-dot-${index}`}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  index === scenarioSlide ? "w-8 bg-white" : "w-4 bg-white/30 hover:bg-white/60"
                }`}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  setScenarioSlide(index);
                }}
                type="button"
              />
            ))}
          </div>
        </a>
      </section>
    </div>
  );
}
