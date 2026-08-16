"use client";

import { ArrowRight } from "lucide-react";
import { ScrollToTopLink } from "@/components/scroll-to-top-link";
import type { DataResourceSummaryItem } from "../home-page-types";

type Props = {
  item: DataResourceSummaryItem;
};

export function DataResourceSummaryCard({ item }: Props) {
  return (
    <ScrollToTopLink
      actionType={item.actionType}
      className="group relative flex min-h-[188px] min-w-0 flex-col overflow-hidden rounded-[18px] bg-[linear-gradient(180deg,#f7f9ff_0%,#edf2ff_100%)] p-4 transition-all hover:-translate-y-1 hover:shadow-[0_24px_48px_rgba(20,82,240,0.12)] sm:min-h-[243px] sm:p-8"
      href={item.href}
    >
      {item.imageUrl ? (
        <>
          <div
            className="pointer-events-none absolute inset-0 bg-cover bg-right-bottom bg-no-repeat opacity-[0.92]"
            style={{ backgroundImage: `url("${item.imageUrl}")` }}
          />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(247,249,255,0.86)_0%,rgba(237,242,255,0.62)_54%,rgba(237,242,255,0.24)_100%)]" />
        </>
      ) : null}
      <div className="relative z-10 flex h-full min-w-0 flex-col">
        <h4 className="max-w-[188px] min-w-0 text-[15px] font-semibold leading-[22px] text-[#111111] sm:text-[20px] sm:leading-[29px]">
          {item.title}
        </h4>
        <p className="mt-3 max-w-[301px] text-[12px] leading-[1.45] text-[#6B7A99] sm:mt-[25px] sm:text-[16px] sm:leading-[1.45]">
          {item.desc}
        </p>
        <div className="mt-auto flex justify-end pt-6">
          <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#111111] bg-white text-[#111111] transition-transform duration-300 group-hover:translate-x-1">
            <ArrowRight size={16} strokeWidth={2.8} />
          </span>
        </div>
      </div>
    </ScrollToTopLink>
  );
}
