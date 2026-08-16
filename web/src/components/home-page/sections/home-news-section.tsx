"use client";

import Link from "next/link";
import { articleTabs } from "@/lib/site-constants";
import { SharedMoreButton } from "@/components/shared-more-button";
import type { NewsItem } from "../home-page-types";

type Props = {
  activeNewsTab: (typeof articleTabs)[number]["code"];
  currentNewsItems: NewsItem[];
  onTabChange: (tabCode: (typeof articleTabs)[number]["code"]) => void;
};

export function HomeNewsSection({ activeNewsTab, currentNewsItems, onTabChange }: Props) {
  return (
    <section className="mx-auto w-full max-w-[1920px] px-4 pb-8 pt-8 sm:px-6 lg:px-10 lg:pb-12 lg:pt-[36px]">
      <div className="mx-auto w-full max-w-[1600px]">
        <h2 className="mb-6 flex items-center gap-3 home-section-title text-[#111111] sm:mb-7">
          <span className="inline-block h-5 w-1 rounded-full bg-[#0052FF] sm:h-[19px] sm:w-[4px]" />
          <Link className="transition-opacity hover:opacity-80" href="/news">
            最新动态
          </Link>
        </h2>
        <div className="rounded-2xl border border-[#E2E8F4] bg-[#F8FBFF] px-4 py-4 sm:px-6 sm:py-5 lg:px-8">
          <div className="mb-2 flex flex-nowrap items-center gap-x-4 overflow-x-auto border-b border-[#DCE6F5] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none'] sm:gap-x-5">
            {articleTabs.map((tab) => (
              <button
                className="relative shrink-0 pb-4 text-[14px] font-medium leading-[20px] text-black transition-opacity hover:opacity-70 sm:text-[16px] sm:leading-[23px]"
                key={tab.code}
                onClick={() => onTabChange(tab.code)}
                type="button"
              >
                {tab.name}
                {activeNewsTab === tab.code ? <span className="absolute bottom-[1px] left-1/2 h-[3px] w-[26px] -translate-x-1/2 rounded-full bg-[#0052FF] sm:bottom-[0px] sm:w-[34px]" /> : null}
              </button>
            ))}
            <div className="ml-auto shrink-0 pb-4 pl-2">
              <SharedMoreButton href="/news" scrollToTop />
            </div>
          </div>

          {currentNewsItems.length > 0 ? (
            currentNewsItems.map((item, index) => {
              const row = (
                <div className="group flex flex-col gap-2 rounded-xl px-3 py-4 transition-colors hover:bg-white/80 sm:flex-row sm:items-center sm:justify-between sm:px-4 lg:px-5">
                  <span className="flex min-w-0 flex-1 items-center gap-3 pr-0 text-black sm:pr-4">
                    <span className="inline-flex h-[24px] shrink-0 items-center rounded-[8px] bg-[#0052FF] px-[10px] text-[13px] font-normal leading-[19px] text-white">
                      {item.tag}
                    </span>
                    <span className="line-clamp-2 text-[14px] font-medium leading-[21px] text-black sm:line-clamp-1 sm:text-[15px] sm:leading-[22px]">{item.title}</span>
                  </span>
                  <span className="whitespace-nowrap pl-0 text-[13px] text-[#4b5563] sm:pl-4 sm:text-sm">{item.date}</span>
                </div>
              );

              return item.target === "_blank" ? (
                <a className="block border-b border-[#E5EAF3] last:border-b-0" href={item.href} key={`${item.title}-${index}`} rel="noopener noreferrer" target="_blank">
                  {row}
                </a>
              ) : (
                <Link className="block border-b border-[#E5EAF3] last:border-b-0" href={item.href} key={`${item.title}-${index}`}>
                  {row}
                </Link>
              );
            })
          ) : (
            <div className="rounded-lg  py-12 text-center text-sm text-black">暂无内容，敬请期待</div>
          )}
        </div>
      </div>
    </section>
  );
}
