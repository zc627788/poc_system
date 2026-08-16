"use client";

import { ArrowRight } from "lucide-react";
import { FloatingButton } from "@/components/home-page/shared/floating-button";
import type { ComputeProductItem, ComputeSummaryItem } from "@/components/home-page/home-page-types";
import { ScrollToTopLink } from "@/components/scroll-to-top-link";

type Props = {
  cards: ComputeProductItem[];
  className?: string;
  summary: ComputeSummaryItem;
};

export function MobileComputeMarketplaceModule({ cards, className = "", summary }: Props) {
  return (
    <div className={className}>
      <div className="mb-5 flex flex-col gap-5">
        <ScrollToTopLink
          actionType={summary.actionType}
          className="group relative flex h-[213px] w-full flex-col overflow-hidden rounded-[21px] border border-[#E2E8F4] bg-white px-[16px] pb-[14px] pt-[16px] opacity-100 transition-all duration-300 hover:-translate-y-[3px] hover:shadow-[0_24px_56px_rgba(0,82,255,0.10)] sm:h-[239px] sm:px-[18px] sm:pb-[16px] sm:pt-[18px]"
          href={summary.href}
        >
          {summary.imageUrl ? <img alt={summary.title} className="pointer-events-none absolute inset-0 h-full w-full object-cover object-right" src={summary.imageUrl} /> : null}
          <div className="absolute left-0 top-0 h-[120px] w-[120px] rounded-br-[100px] bg-[radial-gradient(circle_at_top_left,rgba(0,82,255,0.12),rgba(0,82,255,0.015)_62%,transparent_74%)]" />
          <div className="absolute bottom-0 right-0 h-[150px] w-[150px] rounded-tl-[130px] bg-[radial-gradient(circle_at_bottom_right,rgba(0,82,255,0.12),rgba(0,82,255,0.02)_58%,transparent_76%)]" />
          <div className="relative z-10 flex h-full flex-col">
            <div className="w-full max-w-[220px] text-[14px] font-semibold leading-[20px] text-[#000000] sm:w-[188px] sm:text-[17px] sm:leading-[24px]">{summary.title}</div>
            <p className="mt-3 max-w-[240px] text-[11px] leading-[18px] text-[#6B7A99] sm:mt-4 sm:text-[13px] sm:leading-[22px]">{summary.desc}</p>
            <span className="mt-auto flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#111111] bg-white text-[#111111] transition-transform duration-300 group-hover:translate-x-1 sm:h-8 sm:w-8">
              <ArrowRight size={16} strokeWidth={2.8} />
            </span>
          </div>
        </ScrollToTopLink>

        <div className="grid grid-cols-2 gap-3 sm:gap-5 [&>*]:min-w-0">
          {cards.map((gpu) => (
            <div
              key={gpu.title}
              className="group relative flex h-[233px] w-full flex-col overflow-hidden rounded-[21px] border border-[rgba(0,186,255,0.5)] bg-[rgba(242,251,255,1)] px-[12px] pb-[10px] pt-[10px] shadow-[inset_0_0_0_1px_rgba(0,186,255,0.5)] transition-all duration-300 hover:-translate-y-[3px] hover:shadow-[inset_0_0_0_1px_rgba(0,186,255,0.5),0_24px_56px_rgba(0,82,255,0.10)] sm:h-[259px] sm:px-[16px] sm:pb-[14px] sm:pt-[14px]"
            >
              <div className="relative z-10 flex flex-col">
                <div className="truncate text-[12px] font-semibold leading-[16px] text-[#1F1F1F] sm:text-[15px] sm:leading-[20px]">{gpu.title}</div>
                <span className="mt-[5px] self-end whitespace-nowrap rounded-[10px] bg-[#DDF8E8] px-[7px] py-[2px] text-[11px] font-medium leading-[14px] text-[#4FB271] sm:mt-[6px] sm:px-[8px] sm:py-[3px] sm:text-[12px] sm:leading-[16px]">
                  {gpu.badgeText}
                </span>
              </div>

              <div className="relative z-10 mt-[6px] grid grid-cols-2 gap-x-[8px] gap-y-[3px] text-[10px] leading-[13px] text-[#A7AFBF] sm:mt-[8px] sm:gap-x-[10px] sm:gap-y-[4px] sm:text-[11px] sm:leading-[15px]">
                <div className="flex items-center gap-[4px] whitespace-nowrap">
                  <span>地区</span>
                  <span className="font-semibold text-[#1F1F1F]">{gpu.meta.region}</span>
                </div>
                <div className="flex items-center gap-[4px] whitespace-nowrap">
                  <span>服务器</span>
                  <span className="font-semibold text-[#1F1F1F]">{gpu.meta.server}</span>
                </div>
              </div>

              <div className="relative z-10 mt-[7px] flex items-end gap-[3px] text-[#FF6A00] sm:mt-[10px] sm:gap-[4px]">
                <span className="text-[20px] font-semibold leading-none tracking-[-0.02em] sm:text-[24px]">{gpu.price}</span>
                <span className="pb-[2px] text-[11px] font-semibold leading-[15px] text-[#1F1F1F]">{gpu.unitLabel}</span>
              </div>

              <div className="relative z-10 mt-[6px] w-full border-t border-dashed border-[#E2E8F4] sm:mt-[8px]" />

              <div className="relative z-10 mt-[6px] grid grid-cols-3 gap-x-[3px] gap-y-[4px] text-center sm:mt-[8px] sm:gap-x-[4px] sm:gap-y-[6px]">
                <div>
                  <div className="text-[10px] leading-[14px] text-[#A7AFBF]">GPU</div>
                  <div className="mt-[2px] text-[13px] font-semibold leading-[17px] text-[#1F1F1F]">{gpu.meta.gpu_cards}</div>
                </div>
                <div>
                  <div className="text-[10px] leading-[14px] text-[#A7AFBF]">vCPU</div>
                  <div className="mt-[2px] text-[13px] font-semibold leading-[17px] text-[#1F1F1F]">{gpu.meta.vcpu_cores}</div>
                </div>
                <div>
                  <div className="text-[10px] leading-[14px] text-[#A7AFBF]">内存</div>
                  <div className="mt-[2px] text-[13px] font-semibold leading-[17px] text-[#1F1F1F]">{gpu.meta.memory}</div>
                </div>
                <div>
                  <div className="text-[10px] leading-[14px] text-[#A7AFBF]">显存</div>
                  <div className="mt-[2px] text-[13px] font-semibold leading-[17px] text-[#1F1F1F]">{gpu.meta.gpu_memory}</div>
                </div>
                <div className="col-span-2">
                  <div className="text-[10px] leading-[14px] text-[#A7AFBF]">存储</div>
                  <div className="mt-[2px] text-[13px] font-semibold leading-[17px] text-[#1F1F1F]">{gpu.meta.storage}</div>
                </div>
              </div>

              <div className="relative z-10 mt-auto flex items-center justify-between gap-[4px] pb-[5px] pt-[4px] sm:gap-[6px] sm:pt-[6px]">
                <FloatingButton actionType={gpu.primaryActionType} className="h-[28px] flex-1 !text-[11px] font-medium px-0 sm:h-[30px] sm:!text-[12px]" href={gpu.primaryHref} tone="outline">
                  {gpu.primaryButtonText}
                </FloatingButton>
                <FloatingButton actionType={gpu.secondaryActionType} className="h-[28px] flex-1 !text-[11px] font-semibold px-0 sm:h-[30px] sm:!text-[12px]" href={gpu.secondaryHref} tone="lime">
                  {gpu.secondaryButtonText}
                </FloatingButton>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
