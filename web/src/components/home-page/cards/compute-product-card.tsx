"use client";

import { FloatingButton } from "../shared/floating-button";
import type { ComputeProductItem } from "../home-page-types";

type Props = {
  gpu: ComputeProductItem;
};

export function ComputeProductCard({ gpu }: Props) {
  return (
    <div className="group relative flex min-h-[300px] flex-col overflow-hidden rounded-[21px] border border-[rgba(0,186,255,0.5)] bg-[rgba(242,251,255,1)] px-4 pb-5 pt-5 shadow-[inset_0_0_0_1px_rgba(0,186,255,0.5)] transition-all duration-300 hover:-translate-y-[3px] hover:shadow-[inset_0_0_0_1px_rgba(0,186,255,0.5),0_24px_56px_rgba(0,82,255,0.10)] sm:min-h-[350px] sm:px-[22px] sm:pb-[24px] sm:pt-[26px]">
      <div className="relative z-10 flex flex-col">
        <div className="truncate text-[15px] font-semibold leading-[22px] text-[#111111] sm:text-[20px] sm:leading-[29px]">
          {gpu.title}
        </div>
        <span className="mt-2 self-end whitespace-nowrap rounded-[12px] bg-[#DDF8E8] px-[10px] py-[4px] text-[11px] font-medium leading-[16px] text-[#4FB271] sm:mt-3 sm:px-[12px] sm:py-[5px] sm:text-[13px] sm:leading-[18px]">
          {gpu.badgeText}
        </span>
      </div>

      <div className="relative z-10 mt-3 flex flex-wrap gap-3 text-[12px] leading-[18px] text-[#A7AFBF] sm:mt-[16px] sm:gap-[26px] sm:text-[14px] sm:leading-[20px]">
        <div className="flex items-center gap-[8px] whitespace-nowrap">
          <span>所属地区</span>
          <span className="font-semibold text-[#1F1F1F]">{gpu.meta.region}</span>
        </div>
        <div className="flex items-center gap-[8px] whitespace-nowrap">
          <span>所属服务器</span>
          <span className="font-semibold text-[#1F1F1F]">{gpu.meta.server}</span>
        </div>
      </div>

      <div className="relative z-10 mt-4 flex items-end gap-[8px] text-[#FF6A00] sm:mt-[22px]">
        <span className="text-[32px] font-semibold leading-none tracking-[-0.02em] sm:text-[40px]">{gpu.price}</span>
        <span className="pb-[2px] text-[13px] font-semibold leading-[18px] text-[#1F1F1F] sm:pb-[4px] sm:text-[15px] sm:leading-[20px]">
          {gpu.unitLabel}
        </span>
      </div>

      <div className="relative z-10 mt-[18px] w-full border-t-2 border-dashed border-[#E2E8F4]" />

      <div className="relative z-10 mt-4 grid grid-cols-2 gap-y-4 text-center sm:mt-[18px] sm:grid-cols-3 sm:gap-y-[18px]">
        <div>
          <div className="text-[11px] leading-[16px] text-[#A7AFBF] sm:text-[13px] sm:leading-[18px]">GPU卡数</div>
          <div className="mt-1 text-[15px] font-semibold leading-[21px] text-[#1F1F1F] sm:mt-[6px] sm:text-[17px] sm:leading-[23px]">{gpu.meta.gpu_cards}</div>
        </div>
        <div>
          <div className="text-[11px] leading-[16px] text-[#A7AFBF] sm:text-[13px] sm:leading-[18px]">vCPU核数</div>
          <div className="mt-1 text-[15px] font-semibold leading-[21px] text-[#1F1F1F] sm:mt-[6px] sm:text-[17px] sm:leading-[23px]">{gpu.meta.vcpu_cores}</div>
        </div>
        <div>
          <div className="text-[11px] leading-[16px] text-[#A7AFBF] sm:text-[13px] sm:leading-[18px]">内存(GB)</div>
          <div className="mt-1 text-[15px] font-semibold leading-[21px] text-[#1F1F1F] sm:mt-[6px] sm:text-[17px] sm:leading-[23px]">{gpu.meta.memory}</div>
        </div>
        <div>
          <div className="text-[11px] leading-[16px] text-[#A7AFBF] sm:text-[13px] sm:leading-[18px]">GPU显存</div>
          <div className="mt-1 text-[15px] font-semibold leading-[21px] text-[#1F1F1F] sm:mt-[6px] sm:text-[17px] sm:leading-[23px]">{gpu.meta.gpu_memory}</div>
        </div>
        <div className="col-span-2">
          <div className="text-[11px] leading-[16px] text-[#A7AFBF] sm:text-[13px] sm:leading-[18px]">默认存储</div>
          <div className="mt-1 text-[15px] font-semibold leading-[21px] text-[#1F1F1F] sm:mt-[6px] sm:text-[17px] sm:leading-[23px]">{gpu.meta.storage}</div>
        </div>
      </div>

      <div className="relative z-10 mt-[12px] flex flex-col gap-3 pt-[6px] sm:flex-row sm:items-center sm:justify-between sm:gap-[18px]">
        <FloatingButton
          actionType={gpu.primaryActionType}
          className="h-[40px] w-full text-[12px] sm:h-[42px] sm:w-[140px] sm:text-[13px]"
          href={gpu.primaryHref}
          tone="outline"
        >
          立即咨询
        </FloatingButton>
        <FloatingButton
          actionType={gpu.secondaryActionType}
          className="h-[40px] w-full text-[12px] font-semibold sm:h-[42px] sm:w-[140px] sm:text-[13px]"
          href={gpu.secondaryHref}
          tone="lime"
        >
          立即购买
        </FloatingButton>
      </div>
    </div>
  );
}
