"use client";

import {
  Building2,
  ChevronRight,
  FileBadge2,
  Loader2,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Sparkles,
  type LucideIcon,
  UserCheck,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState, type SyntheticEvent } from "react";
import { ViewportModal } from "@/components/viewport-modal";
import { fetchCurrentSiteUser, getCachedSiteUser, hasSiteAuthSession, redirectToIxiaMenLogin, submitCommunityJoinApplication } from "@/lib/site-auth";
import type { PageSection, SiteUserProfile } from "@/types";

type BasicExtra = Record<string, unknown>;

type CommunityIntroExtra = {
  image_url?: string;
  image_alt?: string;
};

type CommunityStatsExtra = {
  items?: { value: string; label: string }[];
  background_image_url?: string;
};

type CommunityBaseExtra = {
  address?: string;
  phone?: string;
  email?: string;
  detail_url?: string;
  button_text?: string;
  action_type?: string;
  action_value?: string;
  image_url?: string;
  alt?: string;
  reverse?: boolean;
};

type CommunityRequirementItem = {
  text: string;
  icon?: string;
};

type CommunityRequirementsExtra = {
  items?: Array<string | CommunityRequirementItem>;
  image_url?: string;
  image_alt?: string;
  ribbon_image_url?: string;
};

type BreadcrumbItem = {
  label: string;
  href?: string;
};

type JoinModalStep = "confirm" | "loading" | "success" | "error";

type JoinModalState = {
  campus: string;
  step: JoinModalStep;
  errorMessage?: string;
};

const pageContainerClass = "mx-auto max-w-[1320px] px-5 sm:px-6 lg:px-8 xl:px-10";

const communityIntroImageFallback = "/community-intro-building.png";
const communityStatsWaveFallback = "/community-stats-wave.png";
const communityBaseImageFallbacks: Record<string, string> = {
  base_soft2: "/community-base-soft2.png",
  base_soft3: "/community-base-soft3.png",
};
const legacyCommunityAssetMap: Record<string, string> = {
  "/community-base-soft6.png": "/community-base-soft3.png",
  "/opc-community-mark.png": "/site-logo-opc-community.png",
};
const communityRequirementsImageFallback = "/community-requirements-decor.png";
const communityRequirementsRibbonFallback = "/community-requirements-ribbon.png";

const requirementIconMap: Record<string, LucideIcon> = {
  Users,
  Sparkles,
  FileBadge2,
  Building2,
  ShieldCheck,
  UserCheck,
};

function getSection(sections: PageSection[], sectionKey: string) {
  return sections.find((item) => item.section_key === sectionKey);
}
function parseExtra<T extends BasicExtra>(extraJson?: string | null): T {
  if (!extraJson) {
    return {} as T;
  }

  try {
    return JSON.parse(extraJson) as T;
  } catch (error) {
    console.error("Failed to parse community section extra_json", error);
    return {} as T;
  }
}

function normalizeRequirementItems(items?: Array<string | CommunityRequirementItem>) {
  if (!items || items.length === 0) {
    return [];
  }

  return items.map((item) => {
    if (typeof item === "string") {
      return {
        text: item,
      };
    }

    return {
      text: item.text,
      icon: item.icon,
    };
  });
}

function swapBrokenImage(event: SyntheticEvent<HTMLImageElement>, fallbackSrc: string) {
  const target = event.currentTarget;
  if (!fallbackSrc || target.dataset.fallbackApplied === "true") {
    return;
  }
  target.dataset.fallbackApplied = "true";
  target.src = fallbackSrc;
}

function CommunityBreadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <div className="mb-5 flex flex-wrap items-center gap-2 text-[12px] font-medium text-[#8898b6] sm:mb-6">
      {items.map((item, index) => (
        <div className="flex items-center gap-2" key={`${item.label}-${index}`}>
          {item.href ? (
            <Link className="transition-colors hover:text-[#0052d9]" href={item.href}>
              {item.label}
            </Link>
          ) : (
            <span className="text-[#0052d9]">{item.label}</span>
          )}
          {index < items.length - 1 ? <ChevronRight size={14} /> : null}
        </div>
      ))}
    </div>
  );
}

function CommunityActionButton({
  actionType,
  href,
  children,
}: {
  actionType?: string;
  href?: string | null;
  children: string;
}) {
  const className =
    "inline-flex h-11 min-w-[112px] items-center justify-center rounded-[2px] bg-[#e8edf5] px-6 text-[13px] font-bold tracking-[0.01em] text-[#3a5a8c] transition-all hover:-translate-y-[1px] hover:bg-[#d5dfee]";

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

  return <span className={`${className} cursor-default`}>{children}</span>;
}

function normalizeCommunityAssetUrl(url?: string | null) {
  const trimmed = url?.trim() || "";
  return legacyCommunityAssetMap[trimmed] || trimmed;
}

function CommunityPrimaryActionButton({
  children,
  onClick,
}: {
  children: string;
  onClick?: () => void;
}) {
  const className =
    "inline-flex h-11 min-w-[112px] items-center justify-center rounded-[2px] bg-[#beec00] px-6 text-[13px] font-bold tracking-[0.01em] text-[#13213f] transition-all hover:-translate-y-[1px] hover:shadow-[0_12px_24px_rgba(190,236,0,0.24)]";

  return (
    <button className={className} onClick={onClick} type="button">
      {children}
    </button>
  );
}

function CommunityJoinModal({
  state,
  onConfirm,
  onClose,
}: {
  state: JoinModalState;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <ViewportModal
      contentClassName="relative w-full max-w-[420px] rounded-[16px] bg-white p-7 shadow-[0_24px_60px_rgba(0,0,0,0.18)]"
      onClose={onClose}
      open
    >
      <button
        className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full text-[#8898b6] transition-colors hover:bg-[#f0f4fb] hover:text-[#4a5b78]"
        onClick={onClose}
        type="button"
      >
        <X size={16} />
      </button>

      {state.step === "confirm" && (
        <>
          <div className="mb-5 text-[18px] font-bold text-[#13213f]">申请入驻</div>
          <p className="mb-7 text-[14px] leading-[1.8] text-[#4a5b78]">
            是否确认申请入驻 <span className="font-bold text-[#0f49b6]">{state.campus}</span>？
          </p>
          <div className="flex justify-end gap-3">
            <button
              className="h-9 rounded-[4px] border border-[#dfe8f5] px-5 text-[13px] font-medium text-[#445673] transition-colors hover:bg-[#f5f8ff]"
              onClick={onClose}
              type="button"
            >
              取消
            </button>
            <button
              className="h-9 rounded-[4px] bg-[#beec00] px-5 text-[13px] font-bold text-[#13213f] transition-all hover:-translate-y-[1px] hover:shadow-[0_8px_18px_rgba(190,236,0,0.28)]"
              onClick={onConfirm}
              type="button"
            >
              确认申请
            </button>
          </div>
        </>
      )}

      {state.step === "loading" && (
        <div className="flex flex-col items-center gap-4 py-6">
          <Loader2 className="animate-spin text-[#0f49b6]" size={32} />
          <p className="text-[14px] text-[#4a5b78]">正在提交申请...</p>
        </div>
      )}

      {state.step === "success" && (
        <>
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#eafff0]">
            <svg fill="none" height="24" viewBox="0 0 24 24" width="24">
              <path d="M5 13l4 4L19 7" stroke="#22c55e" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" />
            </svg>
          </div>
          <div className="mb-3 text-[17px] font-bold text-[#13213f]">申请已提交</div>
          <p className="mb-7 text-[14px] leading-[1.8] text-[#4a5b78]">
            您的申请我们已经收到，会在 <span className="font-semibold text-[#0f49b6]">5 个工作日</span>内给您回复。
          </p>
          <div className="flex justify-end">
            <button
              className="h-9 rounded-[4px] bg-[#0f49b6] px-6 text-[13px] font-bold text-white transition-all hover:-translate-y-[1px]"
              onClick={onClose}
              type="button"
            >
              知道了
            </button>
          </div>
        </>
      )}

      {state.step === "error" && (
        <>
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#fff1f0]">
            <X size={22} className="text-[#f5222d]" />
          </div>
          <div className="mb-3 text-[17px] font-bold text-[#13213f]">提交失败</div>
          <p className="mb-7 text-[14px] leading-[1.8] text-[#4a5b78]">{state.errorMessage}</p>
          <div className="flex justify-end">
            <button
              className="h-9 rounded-[4px] border border-[#dfe8f5] px-5 text-[13px] font-medium text-[#445673] transition-colors hover:bg-[#f5f8ff]"
              onClick={onClose}
              type="button"
            >
              关闭
            </button>
          </div>
        </>
      )}
    </ViewportModal>
  );
}

function RequirementIcon({ name }: { name?: string }) {
  const Icon = (name && requirementIconMap[name]) || Sparkles;
  return (
    <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(180deg,#2b95ff_0%,#0f67e7_100%)] text-white shadow-[0_8px_18px_rgba(15,103,231,0.22)]">
      <Icon size={17} strokeWidth={2.4} />
    </span>
  );
}

export function CommunityPageView({ sections }: { sections: PageSection[] }) {
  const [joinModal, setJoinModal] = useState<JoinModalState | null>(null);
  const [currentUser, setCurrentUser] = useState<SiteUserProfile | null>(null);

  useEffect(() => {
    setCurrentUser(getCachedSiteUser());
    void fetchCurrentSiteUser()
      .then(setCurrentUser)
      .catch(() => setCurrentUser(null));
  }, []);

  const handleJoinClick = useCallback((section: PageSection) => {
    if (!currentUser?.id && !hasSiteAuthSession()) {
      const returnTo = typeof window !== "undefined" ? window.location.pathname : "/community";
      if (typeof window !== "undefined") {
        redirectToIxiaMenLogin(returnTo);
      }
      return;
    }
    const campus = section.title || "园区";
    setJoinModal({ campus, step: "confirm" });
  }, [currentUser?.id]);

  const handleJoinConfirm = useCallback(async () => {
    if (!joinModal) return;
    const campus = joinModal.campus;
    setJoinModal((prev) => prev ? { ...prev, step: "loading" } : null);
    try {
      await submitCommunityJoinApplication(campus);
      setJoinModal({ campus, step: "success" });
    } catch (err) {
      const message = err instanceof Error ? err.message : "提交失败，请稍后重试。";
      setJoinModal({ campus, step: "error", errorMessage: message });
    }
  }, [joinModal]);

  const intro = getSection(sections, "intro");
  const statsSection = getSection(sections, "stats");
  const requirementsSection = getSection(sections, "requirements");

  const introExtra = parseExtra<CommunityIntroExtra>(intro?.extra_json);
  const statsExtra = parseExtra<CommunityStatsExtra>(statsSection?.extra_json);
  const requirementsExtra = parseExtra<CommunityRequirementsExtra>(requirementsSection?.extra_json);

  const bases = sections
    .filter((item) => item.section_key.startsWith("base_"))
    .sort((a, b) => a.sort_order - b.sort_order || a.id - b.id)
    .map((section) => ({
      section,
      extra: parseExtra<CommunityBaseExtra>(section.extra_json),
    }));

  const introDecorUrl = normalizeCommunityAssetUrl(introExtra.image_url) || communityIntroImageFallback;
  const statsItems = (statsExtra.items || []).filter((item) => item.value && item.label);
  const requirementItems = normalizeRequirementItems(requirementsExtra.items);
  const introHtml = intro?.content || "";

  return (
    <div className="min-h-full bg-[linear-gradient(180deg,#f7faff_0%,#ffffff_24%,#f5f8ff_100%)] pb-16">
      <div className={`${pageContainerClass} pt-8 lg:pt-10`}>
        <CommunityBreadcrumbs items={[{ label: "首页", href: "/" }, { label: "社区简介" }]} />
      </div>

      <section className="w-full pt-2 lg:pt-3">
        <div className={`${pageContainerClass} flex flex-col gap-5 lg:gap-8`}>
          <div className="relative overflow-visible rounded-[28px] bg-transparent lg:min-h-[470px]">
            <div className="relative z-10 w-full max-w-[620px] rounded-[24px] border border-[#e4ebf7] bg-white px-5 py-6 shadow-[0_24px_60px_rgba(15,73,182,0.12)] sm:px-7 sm:py-8 lg:min-h-[360px] lg:px-9 lg:py-10">
              <div className="inline-flex max-w-full flex-col">
                <h1 className="text-[28px] font-black leading-[1.08] tracking-[-0.02em] text-[#0f49b6] sm:text-[40px] lg:text-[52px]">
                    {intro?.title || ""}
                </h1>
                <div className="mt-5 flex items-center gap-3">
                  <div className="h-[2px] w-full max-w-[560px] bg-[linear-gradient(90deg,#7ea5e8_0%,#7ea5e8_88%,rgba(126,165,232,0)_100%)]" />
                </div>
              </div>

              <div
                className="mt-7 max-w-[600px] text-[13px] leading-[1.9] text-[#4a5b78] [&_p]:mb-5 [&_span]:font-bold [&_span]:text-[#0f49b6] sm:text-[15px]"
                dangerouslySetInnerHTML={{ __html: introHtml }}
              />
            </div>

            <div
              aria-label={introExtra.image_alt || intro?.title || "厦门OPC社区楼宇形象"}
              className="relative -mt-6 h-[300px] overflow-hidden rounded-[28px] bg-no-repeat sm:-mt-8 sm:h-[360px] lg:absolute lg:inset-x-0 lg:top-[54px] lg:mt-0 lg:h-[392px]"
              style={{
                backgroundImage: `url("${introDecorUrl}")`,
                backgroundPosition: "right bottom",
                backgroundRepeat: "no-repeat",
                backgroundSize: "cover",
              }}
            >
              <div className="pointer-events-none absolute inset-x-[18%] bottom-[3%] h-[18%] rounded-full bg-[radial-gradient(circle,rgba(63,121,238,0.16)_0%,rgba(63,121,238,0)_72%)] blur-2xl" />
            </div>
          </div>
        </div>
      </section>

      <section className="mt-4 bg-[radial-gradient(170.9%_125.29%_at_40.76%_20.11%,#3174FF_0%,#1850C6_47.59%,#003075_100%)] text-white">
        <div className={pageContainerClass}>
          <div className="relative overflow-hidden">
            <img
              alt="社区统计底纹"
              className="pointer-events-none absolute bottom-0 left-1/2 w-[165%] min-w-[860px] max-w-none -translate-x-1/2 opacity-45 sm:w-[120%] sm:min-w-0 lg:w-[1000px] lg:max-w-[1000px]"
              onError={(event) => swapBrokenImage(event, communityStatsWaveFallback)}
              src={normalizeCommunityAssetUrl(statsExtra.background_image_url) || communityStatsWaveFallback}
            />

            <div className="relative z-10 grid grid-cols-2 gap-y-6 py-7 sm:grid-cols-4 sm:gap-0 lg:py-8">
              {statsItems.map((item, index, array) => (
                <div
                  className={`flex min-h-[110px] flex-col items-center justify-center px-3 text-center lg:min-h-[126px] ${index < array.length - 1 ? "sm:border-r sm:border-white/28" : ""
                    }`}
                  key={`${item.label}-${index}`}
                >
                  <div className="text-[36px] font-black tracking-[0.12em] sm:text-[42px] lg:text-[48px]">
                    {item.value}
                  </div>
                  <div className="mt-2 text-[13px] font-medium tracking-[0.14em] text-white/82 sm:text-[14px]">
                    {item.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className={`${pageContainerClass} pt-12 lg:pt-14`}>
        <section className="space-y-12 lg:space-y-14">
          {bases.map(({ section, extra }) => {
            const isReverse = Boolean(extra.reverse);
            const descriptionText = section.content?.trim() || "";
            const contacts = [
              { icon: MapPin, label: "地址", value: extra.address || "-" },
              { icon: Phone, label: "电话", value: extra.phone || "-" },
              { icon: Mail, label: "邮箱", value: extra.email || "-" },
            ];
            const fallbackImageUrl =
              communityBaseImageFallbacks[section.section_key] || communityBaseImageFallbacks.base_soft2;
              const normalizedImageUrl =
                extra.image_url && !["/community-base-soft2.png", "/community-base-soft3.png"].includes(extra.image_url)
                  ? normalizeCommunityAssetUrl(extra.image_url)
                  : fallbackImageUrl;

            return (
              <div
                className="grid items-center gap-8 rounded-[18px] border border-[#E5ECF7] bg-white p-5 shadow-[0_18px_48px_rgba(33,78,154,0.08)] sm:p-6 lg:grid-cols-2 lg:gap-12 lg:p-8"
                key={section.section_key}
              >
                <div className={`${isReverse ? "lg:order-2" : "lg:order-1"} flex min-h-[248px] flex-col justify-center`}>
                  <h2 className="text-[22px] font-bold leading-[1.35] text-[#223350] sm:text-[28px]">
                    {section.title}
                  </h2>
                  {descriptionText ? (
                    <p className="mt-5 text-[14px] leading-[1.85] text-[#5B6B86] sm:text-[15px]">
                      {descriptionText}
                    </p>
                  ) : null}
                  <div className="mt-6 space-y-3 rounded-[12px] bg-[#F7FAFF] px-4 py-4 text-[15px] leading-[1.85] text-[#445673]">
                    {contacts.map(({ icon: Icon, label, value }) => (
                      <div className="flex items-start gap-3" key={label}>
                        <span className="mt-[5px] inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-[#0052D9] shadow-[0_6px_16px_rgba(0,82,217,0.08)]">
                          <Icon size={14} strokeWidth={2.2} />
                        </span>
                        <span>
                          <span className="font-semibold text-[#223350]">{label}：</span>
                          {value}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-8 flex flex-wrap gap-3">
                    <CommunityActionButton actionType={extra.action_type} href={extra.detail_url || extra.action_value}>
                      查看详情
                    </CommunityActionButton>
                    <CommunityPrimaryActionButton onClick={() => handleJoinClick(section)}>
                      申请入驻
                    </CommunityPrimaryActionButton>
                  </div>
                </div>

                <div className={`${isReverse ? "lg:order-1" : "lg:order-2"} flex h-full items-center`}>
                  <div className="w-full overflow-hidden rounded-[6px] bg-[linear-gradient(135deg,#0d57df_0%,#23a0ff_100%)] shadow-[0_16px_36px_rgba(18,80,186,0.14)]">
                    <img
                      alt={extra.alt || section.title}
                      className="aspect-[16/9] w-full object-cover"
                      onError={(event) => swapBrokenImage(event, fallbackImageUrl)}
                      src={normalizedImageUrl}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </section>

        <section className="relative mt-14 overflow-visible lg:mt-16">
          <div className="mb-4 inline-flex items-center rounded-[4px] bg-[#0d5fe4] px-4 py-2 text-[15px] font-bold text-white shadow-[0_12px_26px_rgba(13,95,228,0.18)] md:hidden">
            {requirementsSection?.title || "入驻条件"}
          </div>

          <div className="relative">
            <div className="relative z-10 grid min-h-[150px] max-w-[1240px] items-stretch overflow-hidden rounded-[8px] border border-[#dfe8f5] bg-white shadow-[0_10px_28px_rgba(23,83,183,0.08)] lg:grid-cols-[minmax(0,1fr)_360px]">
              <div className="grid gap-x-6 gap-y-5 px-5 py-6 md:grid-cols-2 md:pl-[178px] md:pr-7 lg:py-7 lg:pl-[188px] lg:pr-8">
                {requirementItems.map((item, index) => (
                  <div className="flex min-h-[48px] items-center gap-3" key={`${item.text}-${index}`}>
                    <RequirementIcon name={item.icon} />
                    <div className="whitespace-nowrap text-[13px] font-medium leading-[1.6] text-[#334766] sm:text-[14px]">
                      {item.text}
                    </div>
                  </div>
                ))}
              </div>

              <div
                aria-label={requirementsExtra.image_alt || "入驻条件辅助图"}
                className="relative hidden h-full lg:block"
                role="img"
                style={{
                    backgroundImage: `url("${normalizeCommunityAssetUrl(requirementsExtra.image_url) || communityRequirementsImageFallback}")`,
                  backgroundPosition: "center right",
                  backgroundRepeat: "no-repeat",
                  backgroundSize: "cover",
                }}
              >
                <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.18)_0%,rgba(255,255,255,0)_52%)]" />
              </div>
            </div>

            <div className="pointer-events-none absolute left-[24px] top-1/2 z-20 hidden -translate-y-1/2 md:block lg:left-[28px]">
              <div className="relative">
                <img
                  alt="入驻条件左侧装饰"
                  className="h-[238px] w-auto drop-shadow-[0_14px_22px_rgba(16,86,214,0.18)] lg:h-[252px]"
                  onError={(event) => swapBrokenImage(event, communityRequirementsRibbonFallback)}
                  src={normalizeCommunityAssetUrl(requirementsExtra.ribbon_image_url) || communityRequirementsRibbonFallback}
                />
                <div className="absolute left-0 top-[28px] flex w-[112px] flex-col items-center text-center text-white lg:w-[120px]">
                  <div className="whitespace-nowrap text-[18px] font-bold leading-[1.15] tracking-[0.02em] lg:text-[19px]">
                    {requirementsSection?.title || "入驻条件"}
                  </div>
                  <div className="mt-2 whitespace-nowrap text-[12px] font-medium leading-[1.2]">Admission</div>
                  <div className="whitespace-nowrap text-[12px] font-medium leading-[1.2]">Criteria</div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
      {joinModal ? (
        <CommunityJoinModal
          state={joinModal}
          onConfirm={() => { void handleJoinConfirm(); }}
          onClose={() => setJoinModal(null)}
        />
      ) : null}
    </div>
  );
}
