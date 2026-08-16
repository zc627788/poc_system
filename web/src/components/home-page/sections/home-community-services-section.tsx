"use client";

import Link from "next/link";
import { ScrollToTopLink } from "@/components/scroll-to-top-link";
import { SharedMoreButton } from "@/components/shared-more-button";
import { HomeCmsIcon } from "../shared/home-cms-icon";
import type { CommunityCard, ServiceCard } from "../home-page-types";

type Props = {
  communityCard: CommunityCard;
  serviceCards: ServiceCard[];
};

export function HomeCommunityServicesSection({ communityCard, serviceCards }: Props) {
  const hasCommunityCard = Boolean(communityCard.title || communityCard.desc || communityCard.imageUrl);
  const hasServiceCards = serviceCards.length > 0;

  if (!hasCommunityCard && !hasServiceCards) {
    return null;
  }

  return (
    <section className="mx-auto w-full max-w-[1920px] px-4 pb-16 pt-6 sm:px-6 lg:px-10 lg:pb-[96px] lg:pt-6">
      <div className="mx-auto grid w-full max-w-[1600px] gap-8 xl:grid-cols-[580px_minmax(0,1fr)] xl:items-start">
        {hasCommunityCard ? (
        <div>
          <h2 className="mb-6 flex items-center gap-3 text-[21px] font-bold leading-[29px] text-[#111111] sm:mb-[28px]">
            <span className="inline-block h-5 w-1 rounded-[133px] bg-[#0052FF] sm:h-[19px] sm:w-[4px]" />
            <Link className="transition-opacity hover:opacity-80" href="/community">
              社区简介
            </Link>
          </h2>
          <ScrollToTopLink actionType={communityCard.actionType} className="group relative block min-h-[220px] overflow-hidden rounded-[21px] bg-[#0052FF] sm:min-h-[248px]" href={communityCard.href}>
            {communityCard.imageUrl ? <img alt={communityCard.title} className="absolute inset-0 h-full w-full object-cover object-right transition-transform duration-500 group-hover:scale-[1.03]" src={communityCard.imageUrl} /> : null}
            <div className="relative z-10 flex h-full max-w-[420px] flex-col justify-center px-5 py-8 sm:px-[43px]">
              <h3 className="text-[24px] font-semibold leading-[1.35] tracking-[0] text-white sm:text-[32px] sm:leading-[45px]">{communityCard.title}</h3>
              <p className="mt-4 text-[14px] leading-[24px] tracking-[0] text-white/95 sm:mt-[22px] sm:text-[16px] sm:leading-[28px]">{communityCard.desc}</p>
            </div>
          </ScrollToTopLink>
        </div>
        ) : null}

        {hasServiceCards ? (
        <div>
          <div className="mb-6 flex items-center justify-between gap-4 sm:mb-[28px] sm:gap-[16px]">
            <h2 className="flex items-center gap-3 text-[21px] font-bold leading-[29px] text-[#111111]">
              <span className="inline-block h-5 w-1 rounded-[133px] bg-[#0052FF] sm:h-[19px] sm:w-[4px]" />
              <Link className="transition-opacity hover:opacity-80" href="/services">
                创业服务
              </Link>
            </h2>
            <SharedMoreButton className="w-fit shrink-0" href="/services" scrollToTop />
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 xl:grid-cols-4 xl:gap-[14px]">
            {serviceCards.map((card) => (
              <ScrollToTopLink key={card.title} actionType={card.actionType} className="group flex min-h-[192px] min-w-0 flex-col items-center rounded-[18px] border border-[#E2E8F4] bg-white px-3 pb-4 pt-4 text-center transition-all duration-300 hover:-translate-y-[2px] hover:shadow-[0_18px_40px_rgba(0,82,255,0.08)] sm:min-h-[248px] sm:px-[22px] sm:pb-[24px] sm:pt-[26px]" href={card.href}>
                <div className="flex h-[72px] w-[72px] items-center justify-center rounded-full border border-[#E2E8F4] bg-white transition-transform duration-300 group-hover:scale-105 sm:h-[96px] sm:w-[96px]">
                  {card.imageSrc ? (
                    <img alt={card.title} className="h-[72px] w-[72px] rounded-full object-cover sm:h-[96px] sm:w-[96px]" src={card.imageSrc} />
                  ) : card.iconName ? (
                    <HomeCmsIcon className="text-[#0052FF] sm:h-[42px] sm:w-[42px]" name={card.iconName} size={36} strokeWidth={1.9} />
                  ) : (
                    <card.icon size={36} className="text-[#0052FF] sm:h-[42px] sm:w-[42px]" />
                  )}
                </div>
                <div className="mt-3 text-[15px] font-bold leading-[22px] text-black sm:mt-[22px] sm:text-[19px]">{card.title}</div>
                <div className="mt-2 max-w-[187px] text-[12px] leading-[18px] text-[#6B7A99] sm:mt-[10px] sm:text-[16px] sm:leading-[24px]">{card.desc}</div>
              </ScrollToTopLink>
            ))}
          </div>
        </div>
        ) : null}
      </div>
    </section>
  );
}
