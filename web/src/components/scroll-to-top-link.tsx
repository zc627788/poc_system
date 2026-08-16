"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { MouseEvent, ReactNode } from "react";
import { markScrollToTopAfterNav, schedulePageScrollToTop } from "./scroll-to-top-on-nav";

type ScrollToTopLinkProps = {
  href: string;
  actionType?: string;
  className?: string;
  children: ReactNode;
  onClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
};

function shouldLetBrowserHandleClick(event: MouseEvent<HTMLAnchorElement>) {
  return event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
}

function getPathnameFromHref(href: string) {
  try {
    return new URL(href, window.location.origin).pathname;
  } catch {
    return href.split(/[?#]/)[0] || href;
  }
}

export function ScrollToTopLink({ href, actionType, className, children, onClick }: ScrollToTopLinkProps) {
  const pathname = usePathname();
  const resolvedHref = href.replace("#tools-model-plaza", "#marketplace-tools-model");
  const hasHash = resolvedHref.includes("#");

  if (actionType === "external") {
    return (
      <a className={className} href={href} onClick={onClick} rel="noopener noreferrer" target="_blank">
        {children}
      </a>
    );
  }

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);
    if (shouldLetBrowserHandleClick(event)) {
      return;
    }

    if (hasHash) {
      return;
    }

    markScrollToTopAfterNav();
    if (getPathnameFromHref(resolvedHref) === pathname) {
      window.setTimeout(schedulePageScrollToTop, 0);
    }
  };

  return (
    <Link className={className} href={resolvedHref} onClick={handleClick} scroll>
      {children}
    </Link>
  );
}
