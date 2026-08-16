"use client";

import type { MouseEvent, ReactNode } from "react";
import { ScrollToTopLink } from "@/components/scroll-to-top-link";
import { joinClasses } from "../home-page-helpers";

export type FloatingButtonTone = "outline" | "blue" | "lime";
export type FloatingButtonElement = "button" | "span";

const floatingButtonToneClassMap: Record<FloatingButtonTone, string> = {
  outline:
    "border border-[#0052FF] bg-white text-[#0052FF] shadow-[0_10px_24px_rgba(0,82,255,0.08)] hover:bg-[#0052FF] hover:text-white hover:shadow-[0_24px_56px_rgba(0,82,255,0.18)]",
  blue:
    "bg-[#0052FF] text-white shadow-[0_12px_28px_rgba(0,82,255,0.18)] hover:shadow-[0_24px_56px_rgba(0,82,255,0.26)]",
  lime:
    "bg-[#BEEC00] text-black shadow-[0_12px_28px_rgba(190,236,0,0.20)] hover:shadow-[0_24px_56px_rgba(190,236,0,0.32)]"
};

const floatingButtonBaseClass =
  "inline-flex transform-gpu items-center justify-center rounded-[67px] text-[13px] font-medium transition-all duration-300 will-change-transform hover:-translate-y-[5px] active:translate-y-0 sm:text-[14px]";

type FloatingButtonProps = {
  actionType?: string;
  children: ReactNode;
  className?: string;
  href?: string;
  onClick?: (event: MouseEvent<HTMLElement>) => void;
  tone: FloatingButtonTone;
  type?: "button" | "submit" | "reset";
  as?: FloatingButtonElement;
};

export function FloatingButton({
  actionType,
  children,
  className,
  href,
  onClick,
  tone,
  type = "button",
  as = "button"
}: FloatingButtonProps) {
  const buttonClassName = joinClasses(floatingButtonBaseClass, floatingButtonToneClassMap[tone], className);

  if (href) {
    return (
      <ScrollToTopLink actionType={actionType} className={buttonClassName} href={href}>
        {children}
      </ScrollToTopLink>
    );
  }

  if (as === "span") {
    return <span className={buttonClassName}>{children}</span>;
  }

  return (
    <button className={buttonClassName} onClick={onClick} type={type}>
      {children}
    </button>
  );
}
