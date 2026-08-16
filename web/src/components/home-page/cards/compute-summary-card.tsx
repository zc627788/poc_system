"use client";

import { ArrowRight } from "lucide-react";
import { ScrollToTopLink } from "@/components/scroll-to-top-link";
import type { ComputeSummaryItem } from "../home-page-types";

type Props = {
  item: ComputeSummaryItem;
};

export function ComputeSummaryCard({ item }: Props) {
  return (
    <ScrollToTopLink
      actionType={item.actionType}
      className="group relative flex min-h-[300px] w-full flex-col overflow-hidden rounded-[21px] border border-[#E2E8F4] bg-white px-5 pb-5 pt-5 opacity-100 transition-all duration-300 hover:-translate-y-[3px] hover:shadow-[0_24px_56px_rgba(0,82,255,0.10)] sm:min-h-[350px] sm:px-[32px] sm:pb-[28px] sm:pt-[32px]"
      href={item.href}
    >
      {item.imageUrl ? <img alt={item.title} className="pointer-events-none absolute inset-0 h-full w-full object-cover object-right" src={item.imageUrl} /> : null}
      <div className="relative z-10 max-w-[290px] text-[15px] font-semibold leading-[22px] text-[#111111] sm:text-[20px] sm:leading-[29px]">{item.title}</div>
      <p className="relative z-10 mt-4 max-w-[384px] text-[12px] font-normal leading-[1.45] text-[#6B7A99] sm:mt-[25px] sm:text-[16px] sm:leading-[1.45]">{item.desc}</p>
      <div className="relative z-10 mt-auto flex items-center justify-end gap-4 pt-6">
        <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#111111] bg-white text-[#111111] transition-transform duration-300 group-hover:translate-x-1">
          <ArrowRight size={16} strokeWidth={2.8} />
        </span>
      </div>
    </ScrollToTopLink>
  );
}
