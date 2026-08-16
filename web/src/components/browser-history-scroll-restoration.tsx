"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from "react";

const STORAGE_KEY = "opc-browser-history-scroll-positions";
const RESTORE_CHECK_INTERVAL_MS = 80;
const MAX_WAIT_FOR_LAYOUT_MS = 2000;
const STABLE_LAYOUT_CHECKS_REQUIRED = 2;
const ROUTE_SETTLE_DELAY_MS = 120;

type ScrollPosition = {
  left: number;
  top: number;
};

type StoredScrollPosition = ScrollPosition & {
  maxLeft?: number;
  maxTop?: number;
  viewportHeight?: number;
  viewportWidth?: number;
};

type ScrollPositionMap = Record<string, StoredScrollPosition>;

function getElementMaxScrollPosition(element: Element) {
  return {
    left: Math.max(0, element.scrollWidth - element.clientWidth),
    top: Math.max(0, element.scrollHeight - element.clientHeight),
  };
}

function getRootScrollElement() {
  const candidates = [
    document.scrollingElement,
    document.documentElement,
    document.body,
  ].filter((element): element is Element => Boolean(element));

  return candidates.reduce((best, element) => {
    const bestMax = getElementMaxScrollPosition(best);
    const currentMax = getElementMaxScrollPosition(element);
    const bestScrollableDistance = bestMax.top + bestMax.left;
    const currentScrollableDistance = currentMax.top + currentMax.left;

    if (currentScrollableDistance > bestScrollableDistance) {
      return element;
    }

    const currentPosition = element.scrollTop + element.scrollLeft;
    const bestPosition = best.scrollTop + best.scrollLeft;
    return currentPosition > bestPosition ? element : best;
  }, candidates[0]);
}

function getCurrentScrollPosition() {
  const scrollElement = getRootScrollElement();

  return {
    element: scrollElement,
    position: {
      left: scrollElement.scrollLeft,
      top: scrollElement.scrollTop,
    },
  };
}

function getScrollEventTargets() {
  const targets: EventTarget[] = [
    window,
    document,
    document.documentElement,
    document.body,
  ];

  if (document.scrollingElement) {
    targets.push(document.scrollingElement);
  }

  return Array.from(new Set(targets));
}

function buildRouteKey(pathname: string, search: string) {
  return search ? `${pathname}?${search}` : pathname;
}

function readPositions() {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {} satisfies ScrollPositionMap;
    }

    const parsed = JSON.parse(raw) as ScrollPositionMap;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {} satisfies ScrollPositionMap;
  }
}

function writePosition(routeKey: string, position: ScrollPosition) {
  try {
    const positions = readPositions();
    positions[routeKey] = enrichScrollPosition(position);
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(positions));
  } catch {
    // Ignore storage failures so navigation behavior is unaffected.
  }
}

function readPosition(routeKey: string) {
  const positions = readPositions();
  return positions[routeKey];
}

function getMaxScrollPosition() {
  return getElementMaxScrollPosition(getRootScrollElement());
}

function enrichScrollPosition(position: ScrollPosition): StoredScrollPosition {
  const maxPosition = getMaxScrollPosition();
  return {
    ...position,
    maxLeft: maxPosition.left,
    maxTop: maxPosition.top,
    viewportHeight: window.innerHeight,
    viewportWidth: window.innerWidth,
  };
}

function resolveScrollPosition(position: StoredScrollPosition) {
  const maxPosition = getMaxScrollPosition();
  const storedMaxLeft = position.maxLeft;
  const storedMaxTop = position.maxTop;
  const shouldScaleTop =
    typeof storedMaxTop === "number" &&
    storedMaxTop > 0 &&
    Math.abs(storedMaxTop - maxPosition.top) > 2;
  const shouldScaleLeft =
    typeof storedMaxLeft === "number" &&
    storedMaxLeft > 0 &&
    Math.abs(storedMaxLeft - maxPosition.left) > 2;

  return {
    left: shouldScaleLeft ? (position.left / storedMaxLeft) * maxPosition.left : position.left,
    top: shouldScaleTop ? (position.top / storedMaxTop) * maxPosition.top : position.top,
  };
}

function getNavigationType() {
  const [navigationEntry] = performance.getEntriesByType("navigation") as PerformanceNavigationTiming[];
  return navigationEntry?.type;
}

function restoreScroll(position: StoredScrollPosition) {
  const scrollElement = getRootScrollElement();
  const maxPosition = getMaxScrollPosition();
  const targetPosition = resolveScrollPosition(position);
  const appliedPosition = {
    left: Math.min(targetPosition.left, maxPosition.left),
    top: Math.min(targetPosition.top, maxPosition.top),
  };

  scrollElement.scrollTo({
    left: appliedPosition.left,
    top: appliedPosition.top,
    behavior: "auto",
  });

  // In this app the visible root scroll can live on body while
  // document.scrollingElement still reports the html element.
  document.documentElement.scrollLeft = appliedPosition.left;
  document.documentElement.scrollTop = appliedPosition.top;
  document.body.scrollLeft = appliedPosition.left;
  document.body.scrollTop = appliedPosition.top;
  window.scrollTo({ left: appliedPosition.left, top: appliedPosition.top, behavior: "auto" });
}

function waitForLayoutAndRestore(position: StoredScrollPosition) {
  let cancelled = false;
  let timeoutId = 0;
  let frameId = 0;
  let settleTimerId = 0;
  let stableChecks = 0;
  let lastMaxTop = -1;
  let lastMaxLeft = -1;
  const startedAt = Date.now();
  const routeContainer = document.querySelector("main") || document.body;

  const clearScheduledWork = () => {
    if (timeoutId) {
      window.clearTimeout(timeoutId);
      timeoutId = 0;
    }
    if (frameId) {
      window.cancelAnimationFrame(frameId);
      frameId = 0;
    }
    if (settleTimerId) {
      window.clearTimeout(settleTimerId);
      settleTimerId = 0;
    }
  };

  const finish = () => {
    cancelled = true;
    clearScheduledWork();
    resizeObserver.disconnect();
    mutationObserver.disconnect();
  };

  const scheduleNextCheck = () => {
    if (cancelled) {
      return;
    }
    timeoutId = window.setTimeout(() => {
      frameId = window.requestAnimationFrame(checkLayout);
    }, RESTORE_CHECK_INTERVAL_MS);
  };

  const scheduleSettledCheck = () => {
    if (cancelled) {
      return;
    }
    if (settleTimerId) {
      window.clearTimeout(settleTimerId);
    }
    settleTimerId = window.setTimeout(() => {
      frameId = window.requestAnimationFrame(checkLayout);
    }, ROUTE_SETTLE_DELAY_MS);
  };

  const checkLayout = () => {
    if (cancelled) {
      return;
    }

    const maxPosition = getMaxScrollPosition();
    const targetPosition = resolveScrollPosition(position);
    const canReachSavedTop = maxPosition.top + 2 >= targetPosition.top;
    const canReachSavedLeft = maxPosition.left + 2 >= targetPosition.left;
    const layoutChanged = Math.abs(maxPosition.top - lastMaxTop) > 2 || Math.abs(maxPosition.left - lastMaxLeft) > 2;

    stableChecks = layoutChanged ? 0 : stableChecks + 1;
    lastMaxTop = maxPosition.top;
    lastMaxLeft = maxPosition.left;

    const layoutReady =
      (canReachSavedTop && canReachSavedLeft) ||
      stableChecks >= STABLE_LAYOUT_CHECKS_REQUIRED ||
      Date.now() - startedAt >= MAX_WAIT_FOR_LAYOUT_MS;

    if (layoutReady) {
      restoreScroll(position);
      finish();
      return;
    }

    scheduleNextCheck();
  };

  // App Router history navigation may update pathname before the incoming route
  // finishes rendering. Wait for the route container to settle, then confirm
  // the outer document height is stable enough to restore scroll.
  const resizeObserver = new ResizeObserver(() => {
    if (cancelled) {
      return;
    }
    clearScheduledWork();
    scheduleSettledCheck();
  });

  const mutationObserver = new MutationObserver(() => {
    if (cancelled) {
      return;
    }
    clearScheduledWork();
    scheduleSettledCheck();
  });

  resizeObserver.observe(document.documentElement);
  resizeObserver.observe(document.body);
  if (routeContainer instanceof HTMLElement) {
    resizeObserver.observe(routeContainer);
    mutationObserver.observe(routeContainer, {
      childList: true,
      subtree: true,
      attributes: true,
      characterData: true,
    });
  }

  scheduleSettledCheck();

  return finish;
}

export function BrowserHistoryScrollRestoration() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const pendingHistoryNavigationRef = useRef(false);
  const lateRestoreCleanupRef = useRef<(() => void) | null>(null);
  const routeKeyRef = useRef("");
  const suppressScrollSaveRouteKeyRef = useRef<string | null>(null);
  const suppressScrollSaveTimerRef = useRef(0);
  const routeKey = useMemo(() => buildRouteKey(pathname, searchParams.toString()), [pathname, searchParams]);

  const restoreRoutePosition = useCallback((targetRouteKey: string) => {
    const savedPosition = readPosition(targetRouteKey);
    if (!savedPosition) {
      return undefined;
    }

    restoreScroll(savedPosition);
    return waitForLayoutAndRestore(savedPosition);
  }, []);

  useLayoutEffect(() => {
    if (!("scrollRestoration" in window.history)) {
      return;
    }

    const previousScrollRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";

    return () => {
      window.history.scrollRestoration = previousScrollRestoration;
    };
  }, []);

  useEffect(() => {
    return () => {
      lateRestoreCleanupRef.current?.();
      lateRestoreCleanupRef.current = null;
      if (suppressScrollSaveTimerRef.current) {
        window.clearTimeout(suppressScrollSaveTimerRef.current);
        suppressScrollSaveTimerRef.current = 0;
      }
    };
  }, []);

  useLayoutEffect(() => {
    routeKeyRef.current = routeKey;
  }, [routeKey]);

  useLayoutEffect(() => {
    if (getNavigationType() !== "back_forward") {
      return;
    }

    lateRestoreCleanupRef.current?.();
    lateRestoreCleanupRef.current = restoreRoutePosition(routeKey) ?? null;
  }, [restoreRoutePosition, routeKey]);

  useEffect(() => {
    const handlePageShow = (event: PageTransitionEvent) => {
      if (!event.persisted || !routeKeyRef.current) {
        return;
      }

      lateRestoreCleanupRef.current?.();
      lateRestoreCleanupRef.current = restoreRoutePosition(routeKeyRef.current) ?? null;
    };

    window.addEventListener("pageshow", handlePageShow);
    return () => {
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, [restoreRoutePosition]);

  useEffect(() => {
    const handleLinkNavigationStart = (event: MouseEvent) => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }

      const target = event.target instanceof Element ? event.target : null;
      const link = target?.closest<HTMLAnchorElement>("a[href]");
      if (!link || link.target === "_blank" || link.hasAttribute("download")) {
        return;
      }

      let nextUrl: URL;
      try {
        nextUrl = new URL(link.href, window.location.origin);
      } catch {
        return;
      }

      if (nextUrl.origin !== window.location.origin) {
        return;
      }

      const currentRouteKey = routeKeyRef.current;
      const nextRouteKey = buildRouteKey(nextUrl.pathname, nextUrl.search.replace(/^\?/, ""));
      if (!currentRouteKey || currentRouteKey === nextRouteKey) {
        return;
      }

      writePosition(currentRouteKey, getCurrentScrollPosition().position);
      suppressScrollSaveRouteKeyRef.current = currentRouteKey;
      if (suppressScrollSaveTimerRef.current) {
        window.clearTimeout(suppressScrollSaveTimerRef.current);
      }
      suppressScrollSaveTimerRef.current = window.setTimeout(() => {
        if (suppressScrollSaveRouteKeyRef.current === currentRouteKey) {
          suppressScrollSaveRouteKeyRef.current = null;
        }
        suppressScrollSaveTimerRef.current = 0;
      }, 2000);
    };

    document.addEventListener("click", handleLinkNavigationStart, true);
    return () => {
      document.removeEventListener("click", handleLinkNavigationStart, true);
    };
  }, []);

  useEffect(() => {
    const saveCurrentPosition = () => {
      const currentPosition = getCurrentScrollPosition().position;
      if (suppressScrollSaveRouteKeyRef.current === routeKey) {
        return;
      }

      writePosition(routeKey, currentPosition);
    };

    let frameId = 0;
    const handleScroll = () => {
      if (frameId) {
        window.cancelAnimationFrame(frameId);
      }

      frameId = window.requestAnimationFrame(() => {
        saveCurrentPosition();
        frameId = 0;
      });
    };

    const handlePageHide = () => {
      writePosition(routeKey, getCurrentScrollPosition().position);
    };

    const scrollEventTargets = getScrollEventTargets();
    scrollEventTargets.forEach((target) => {
      target.addEventListener("scroll", handleScroll, { capture: true, passive: true });
    });
    window.addEventListener("pagehide", handlePageHide);

    return () => {
      if (frameId) {
        window.cancelAnimationFrame(frameId);
      }
      scrollEventTargets.forEach((target) => {
        target.removeEventListener("scroll", handleScroll, { capture: true });
      });
      window.removeEventListener("pagehide", handlePageHide);
    };
  }, [routeKey]);

  useEffect(() => {
    const handlePopState = () => {
      const nextRouteKey = buildRouteKey(window.location.pathname, window.location.search.replace(/^\?/, ""));
      const routeEffectAlreadyRan = routeKeyRef.current === nextRouteKey;

      if (routeEffectAlreadyRan) {
        pendingHistoryNavigationRef.current = false;
        lateRestoreCleanupRef.current?.();
        lateRestoreCleanupRef.current = restoreRoutePosition(nextRouteKey) ?? null;
        return;
      }

      writePosition(routeKeyRef.current, getCurrentScrollPosition().position);
      pendingHistoryNavigationRef.current = true;
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
      lateRestoreCleanupRef.current?.();
      lateRestoreCleanupRef.current = null;
    };
  }, [restoreRoutePosition]);

  useLayoutEffect(() => {
    if (!pendingHistoryNavigationRef.current) {
      return;
    }

    pendingHistoryNavigationRef.current = false;
    return restoreRoutePosition(routeKey);
  }, [restoreRoutePosition, routeKey]);

  return null;
}
