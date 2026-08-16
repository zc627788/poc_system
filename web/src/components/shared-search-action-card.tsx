"use client";

import type { ChangeEventHandler } from "react";

const actionButtonTextStyle = {
  fontFamily: "PingFang SC, PingFang SC",
  fontWeight: 500,
  fontSize: "14px",
  lineHeight: "20px",
  fontStyle: "normal",
  textTransform: "none",
} as const;

function joinClasses(...values: Array<string | undefined | false>) {
  return values.filter(Boolean).join(" ");
}

type SharedSearchActionCardProps = {
  value: string;
  placeholder: string;
  onChange: ChangeEventHandler<HTMLInputElement>;
  onReset: () => void;
  onSearch?: () => void;
  className?: string;
  inputClassName?: string;
};

export function SharedSearchActionCard({
  value,
  placeholder,
  onChange,
  onReset,
  onSearch,
  className = "mb-6",
  inputClassName,
}: SharedSearchActionCardProps) {
  return (
    <div className={`${className} flex flex-col gap-3 rounded-lg bg-white p-4 shadow-sm md:flex-row md:items-center md:gap-4 md:p-6`}>
      <input
        className={joinClasses(
          "route-search-input w-full md:flex-1 shrink-0 rounded-[5px] border border-[#D6DEEB] px-4 text-[14px] text-[#111111] placeholder:text-[#AAB4C8] focus:border-[#0052FF] focus:outline-none focus:ring-1 focus:ring-[#0052FF]",
          inputClassName
        )}
        onChange={onChange}
        placeholder={placeholder}
        value={value}
      />
      <div className="flex w-full gap-3 sm:w-auto sm:gap-4">
        <button
          className="route-search-button inline-flex flex-1 transform-gpu items-center justify-center rounded-[5px] bg-[#BEEC00] px-5 text-black transition-all duration-300 will-change-transform hover:-translate-y-[5px] hover:opacity-95 active:translate-y-0 sm:w-[113px] sm:flex-none"
          onClick={onSearch}
          style={actionButtonTextStyle}
          type="button"
        >
          搜索
        </button>
        <button
          className="route-search-button inline-flex flex-1 transform-gpu items-center justify-center rounded-[5px] border border-[#0052FF] bg-white px-5 text-[#0052FF] transition-all duration-300 will-change-transform hover:-translate-y-[5px] hover:bg-[#F5F9FF] active:translate-y-0 sm:w-[113px] sm:flex-none"
          onClick={onReset}
          style={actionButtonTextStyle}
          type="button"
        >
          重置
        </button>
      </div>
    </div>
  );
}
