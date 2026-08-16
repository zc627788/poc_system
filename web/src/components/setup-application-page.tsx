"use client";

import { ChevronRight } from "lucide-react";
import { OpcSetupApplicationSection } from "@/components/opc-setup-application-view";
import { ScrollToTopLink } from "@/components/scroll-to-top-link";

export function SetupApplicationPageView() {
  return (
    <div className="min-h-full bg-[#f5f7fa] pb-16">
      <section className="mb-8 bg-[#eef3fc] px-4 py-14">
        <div className="container mx-auto flex max-w-6xl flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="route-hero-title mb-3 text-[#0052d9]">OPC 在线工商注册</h1>
            <p className="route-hero-subtitle text-[#0052d9] opacity-90">请填写工商注册申请表单，并按要求上传材料后提交。</p>
          </div>

          <div className="flex w-full max-w-[292px] items-center justify-between md:w-[292px]">
            <ScrollToTopLink
              className="inline-flex h-[42px] w-[140px] items-center justify-center rounded-[4px] border border-[#0052FF] bg-white text-[14px] font-bold text-[#0052FF]"
              href="/setup"
            >
              办理指引
            </ScrollToTopLink>
            <ScrollToTopLink
              className="inline-flex h-[42px] w-[140px] items-center justify-center rounded-[4px] bg-[#BEEC00] text-[14px] font-bold text-black"
              href="/setup/apply"
            >
              在线办理
            </ScrollToTopLink>
          </div>
        </div>
      </section>

      <div className="container mx-auto mb-16 max-w-6xl px-4">
        <div className="mb-8 flex items-center gap-2 text-[13px] font-medium text-gray-500">
          <ScrollToTopLink className="transition-colors hover:text-[#0052d9]" href="/">
            首页
          </ScrollToTopLink>
          <ChevronRight size={14} />
          <ScrollToTopLink className="transition-colors hover:text-[#0052d9]" href="/services">
            创业服务
          </ScrollToTopLink>
          <ChevronRight size={14} />
          <ScrollToTopLink className="transition-colors hover:text-[#0052d9]" href="/setup">
            OPC工商注册
          </ScrollToTopLink>
          <ChevronRight size={14} />
          <span className="text-[#0052d9]">在线办理</span>
        </div>

        <OpcSetupApplicationSection />
      </div>
    </div>
  );
}
