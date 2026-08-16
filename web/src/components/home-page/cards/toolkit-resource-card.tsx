"use client";

import { ArrowRight, BrainCircuit, BriefcaseBusiness, Code2, Flame, type LucideIcon } from "lucide-react";
import { ScrollToTopLink } from "@/components/scroll-to-top-link";
import type { ToolkitResourceItem } from "../home-page-types";
import { FloatingButton } from "../shared/floating-button";

type Props = {
  item: ToolkitResourceItem;
};

const toolkitIconMap: Record<string, LucideIcon> = {
  热门推荐: Flame,
  AI编程工具: Code2,
  AI办公套件: BriefcaseBusiness,
  大模型服务: BrainCircuit,
};

export function ToolkitResourceCard({ item }: Props) {
  const Icon = toolkitIconMap[item.title] || BrainCircuit;

  return (
    <ScrollToTopLink
      actionType={item.actionType}
      className="group relative flex h-[196px] flex-col overflow-hidden rounded-[18px] border border-[#E8EEF8] bg-white px-4 pb-4 pt-4 transition-all duration-300 hover:-translate-y-[3px] hover:shadow-[0_24px_56px_rgba(0,82,255,0.10)] sm:h-[273px] sm:px-[32px] sm:pb-[28px] sm:pt-[32px]"
      href={item.href}
    >
      <div className="pointer-events-none absolute inset-y-0 right-0 w-[48%] bg-[linear-gradient(90deg,rgba(255,255,255,0)_0%,rgba(230,240,255,0.72)_100%)]" />
      <Icon
        aria-hidden="true"
        className="pointer-events-none absolute right-[-18px] top-[42px] h-[110px] w-[110px] rotate-[-8deg] text-[#0052FF]/[0.07] transition-transform duration-500 group-hover:scale-105 sm:right-[-24px] sm:top-[56px] sm:h-[150px] sm:w-[150px]"
        strokeWidth={1.5}
      />

      <div className="relative z-10 flex items-center gap-3 sm:gap-[12px]">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px] bg-[#EFF5FF] text-[#0052FF] sm:h-8 sm:w-8">
          <Icon aria-hidden="true" size={18} strokeWidth={2.2} />
        </span>
        <div className="line-clamp-2 text-[15px] font-semibold leading-[22px] text-[#111111] sm:text-[20px] sm:leading-[29px]">{item.title}</div>
      </div>

      <p className="relative z-10 mt-3 line-clamp-4 text-[12px] leading-[1.45] text-[#6B7A99] sm:mt-[20px] sm:line-clamp-5 sm:text-[16px] sm:leading-[1.45]">{item.desc}</p>

      <div className="relative z-10 mt-auto flex justify-end">
        <FloatingButton as="span" className="group/cta h-[30px] px-[14px] text-[12px] sm:h-[33px] sm:px-[20px]" tone="outline">
          <span>了解更多</span>
          <ArrowRight className="transition-colors duration-300" size={16} strokeWidth={2.2} />
        </FloatingButton>
      </div>
    </ScrollToTopLink>
  );
}
