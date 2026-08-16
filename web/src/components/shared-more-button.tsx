import Link from "next/link";
import type { ReactNode } from "react";
import { ScrollToTopLink } from "./scroll-to-top-link";

type SharedMoreButtonProps = {
  href: string;
  children?: ReactNode;
  className?: string;
  scrollToTop?: boolean;
};

function joinClasses(...values: Array<string | undefined>) {
  return values.filter(Boolean).join(" ");
}

export function SharedMoreButton({
  href,
  children = "查看更多",
  className,
  scrollToTop = false,
}: SharedMoreButtonProps) {
  const buttonClassName = joinClasses(
    "inline-flex shrink-0 items-center gap-[3px] whitespace-nowrap text-[12px] font-medium leading-none text-[#0052FF] transition-opacity duration-300 hover:opacity-80 sm:text-[13px]",
    className
  );
  const content = (
    <>
      <span className="inline-flex items-center">{children}</span>
      <span className="inline-flex items-center text-[12px] leading-none sm:text-[13px]">
        <span className="inline-flex items-center">&gt;</span>
        <span className="-ml-[4px] inline-flex items-center">&gt;</span>
      </span>
    </>
  );

  if (scrollToTop) {
    return (
      <ScrollToTopLink className={buttonClassName} href={href}>
        {content}
      </ScrollToTopLink>
    );
  }

  return (
    <Link className={buttonClassName} href={href}>
      {content}
    </Link>
  );
}
