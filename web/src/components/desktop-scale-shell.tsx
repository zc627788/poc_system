"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

// Desktop pages use a fixed 1920px canvas and scale from this shell.
// Keep desktop module sizes in px so all 1920-based values stay visually consistent.
const DESIGN_WIDTH = 1920;
const DESKTOP_BREAKPOINT = 1920;

export function DesktopScaleShell({ children }: { children: ReactNode }) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [viewportWidth, setViewportWidth] = useState<number | null>(null);
  const [contentHeight, setContentHeight] = useState(0);

  useEffect(() => {
    const updateViewportWidth = () => {
      setViewportWidth(window.innerWidth);
    };

    updateViewportWidth();
    window.addEventListener("resize", updateViewportWidth);

    return () => {
      window.removeEventListener("resize", updateViewportWidth);
    };
  }, []);

  useEffect(() => {
    if (!canvasRef.current) {
      return;
    }

    const updateContentHeight = () => {
      setContentHeight(canvasRef.current?.offsetHeight ?? 0);
    };

    updateContentHeight();

    const observer = new ResizeObserver(() => {
      updateContentHeight();
    });

    observer.observe(canvasRef.current);

    return () => {
      observer.disconnect();
    };
  }, [viewportWidth]);

  if (viewportWidth === null) {
    return <div ref={canvasRef}>{children}</div>;
  }

  const shouldScale = viewportWidth >= DESKTOP_BREAKPOINT;
  const scale = shouldScale ? viewportWidth / DESIGN_WIDTH : 1;

  if (!shouldScale) {
    return <>{children}</>;
  }

  return (
    <div
      className="desktop-scale-viewport"
      style={{ height: contentHeight > 0 ? `${contentHeight * scale}px` : "100vh" }}
    >
      <div className="desktop-scale-stage">
        <div
          ref={canvasRef}
          className="desktop-scale-canvas"
          style={{ transform: `scale(${scale})`, width: `${DESIGN_WIDTH}px` }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
