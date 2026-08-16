"use client";

import { ArrowRight } from "lucide-react";
import { ScrollToTopLink } from "@/components/scroll-to-top-link";
import type { DataResourceFeaturedItem } from "../home-page-types";

type Props = {
  item: DataResourceFeaturedItem;
};

export function DataResourceFeaturedCard({ item }: Props) {
  return (
    <ScrollToTopLink
      actionType={item.actionType}
      className="group relative flex min-h-[188px] min-w-0 flex-col overflow-hidden rounded-[18px] border border-[#D6E4FF] bg-[linear-gradient(180deg,#fbfdff_0%,#edf4ff_100%)] p-4 shadow-[0_10px_30px_rgba(0,82,255,0.06)] transition-all hover:-translate-y-1 hover:shadow-[0_24px_48px_rgba(20,82,240,0.12)] sm:min-h-[243px] sm:p-8"
      href={item.href}
    >
      <div className="pointer-events-none absolute inset-y-0 right-0 w-[56%] bg-[linear-gradient(90deg,rgba(255,255,255,0)_0%,rgba(222,237,255,0.82)_100%)]" />
      {item.imageUrl ? (
        <>
          <div
            className="pointer-events-none absolute bottom-0 right-0 h-[74%] w-[58%] bg-contain bg-right-bottom bg-no-repeat opacity-[0.76] transition-transform duration-500 group-hover:scale-105"
            style={{ backgroundImage: `url("${item.imageUrl}")` }}
          />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.58)_0%,rgba(237,244,255,0.42)_56%,rgba(237,244,255,0.16)_100%)]" />
        </>
      ) : null}
      <div className="relative z-10 flex h-full min-w-0 flex-col">
        <div className="flex min-w-0 items-center gap-3 sm:gap-[20px]">
          <h4 className="min-w-0 flex-1 text-[15px] font-semibold leading-[22px] text-[#111111] sm:text-[20px] sm:leading-[29px]">{item.title}</h4>
        </div>
        <p className="mt-3 max-w-[397px] text-[12px] leading-[1.45] text-[#6B7A99] sm:mt-[24px] sm:text-[16px] sm:leading-[1.45]">{item.desc}</p>
        <div className="mt-auto flex justify-end pt-6">
          <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#111111] bg-white text-[#111111] transition-transform duration-300 group-hover:translate-x-1">
            <ArrowRight size={16} strokeWidth={2.8} />
          </span>
        </div>
      </div>
    </ScrollToTopLink>
  );
}
