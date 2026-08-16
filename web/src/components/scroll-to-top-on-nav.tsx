"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

export const SCROLL_TO_TOP_STORAGE_KEY = "opc-scroll-to-top-after-nav";

export function markScrollToTopAfterNav() {
  try {
    window.sessionStorage.setItem(SCROLL_TO_TOP_STORAGE_KEY, "1");
  } catch {
    // Ignore storage failures; normal navigation can continue.
  }
}

export function scrollPageToTop() {
  window.scrollTo({ left: 0, top: 0, behavior: "auto" });
  const scrollingElement = document.scrollingElement || document.documentElement;
  scrollingElement.scrollTop = 0;
  document.body.scrollTop = 0;
}

export function schedulePageScrollToTop() {
  scrollPageToTop();
  window.requestAnimationFrame(scrollPageToTop);
  window.setTimeout(scrollPageToTop, 80);
}

export function ScrollToTopOnNav() {
  const pathname = usePathname();

  useEffect(() => {
    let shouldScroll = false;
    try {
      shouldScroll = window.sessionStorage.getItem(SCROLL_TO_TOP_STORAGE_KEY) === "1";
      window.sessionStorage.removeItem(SCROLL_TO_TOP_STORAGE_KEY);
    } catch {
      shouldScroll = false;
    }

    if (!shouldScroll) {
      return;
    }
    schedulePageScrollToTop();
  }, [pathname]);

  return null;
}
