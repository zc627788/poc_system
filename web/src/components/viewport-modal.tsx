"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

const DESIGN_WIDTH = 1920;
const DESKTOP_BREAKPOINT = 1920;

type ViewportModalProps = {
  children: ReactNode;
  className?: string;
  closeOnOverlayClick?: boolean;
  contentClassName?: string;
  onClose?: () => void;
  open: boolean;
};

export function ViewportModal({
  children,
  className = "",
  closeOnOverlayClick = true,
  contentClassName,
  onClose,
  open,
}: ViewportModalProps) {
  const [mounted, setMounted] = useState(false);
  const [viewportWidth, setViewportWidth] = useState<number | null>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

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
    if (!open || typeof document === "undefined") {
      return;
    }

    const { body, documentElement } = document;
    const scrollY = window.scrollY || window.pageYOffset;
    const previousBodyOverflow = body.style.overflow;
    const previousBodyPaddingRight = body.style.paddingRight;
    const previousBodyPosition = body.style.position;
    const previousBodyTop = body.style.top;
    const previousBodyLeft = body.style.left;
    const previousBodyRight = body.style.right;
    const previousBodyWidth = body.style.width;
    const previousBodyOverscrollBehavior = body.style.overscrollBehavior;
    const previousHtmlOverflow = documentElement.style.overflow;
    const previousHtmlOverscrollBehavior = documentElement.style.overscrollBehavior;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    documentElement.style.overflow = "hidden";
    documentElement.style.overscrollBehavior = "none";
    body.style.overflow = "hidden";
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.left = "0";
    body.style.right = "0";
    body.style.width = "100%";
    body.style.overscrollBehavior = "none";
    if (scrollbarWidth > 0) {
      body.style.paddingRight = `${scrollbarWidth}px`;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onCloseRef.current?.();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      documentElement.style.overflow = previousHtmlOverflow;
      documentElement.style.overscrollBehavior = previousHtmlOverscrollBehavior;
      body.style.overflow = previousBodyOverflow;
      body.style.paddingRight = previousBodyPaddingRight;
      body.style.position = previousBodyPosition;
      body.style.top = previousBodyTop;
      body.style.left = previousBodyLeft;
      body.style.right = previousBodyRight;
      body.style.width = previousBodyWidth;
      body.style.overscrollBehavior = previousBodyOverscrollBehavior;
      window.scrollTo(0, scrollY);
    };
  }, [open]);

  if (!mounted || !open) {
    return null;
  }

  const modalScale = viewportWidth && viewportWidth >= DESKTOP_BREAKPOINT ? viewportWidth / DESIGN_WIDTH : 1;
  const modalContent = contentClassName ? <div className={contentClassName}>{children}</div> : children;

  return createPortal(
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 px-4 backdrop-blur-[2px] ${className}`}
      onClick={(event) => {
        if (closeOnOverlayClick && event.target === event.currentTarget) {
          onClose?.();
        }
      }}
    >
      <div style={{ transform: `scale(${modalScale})`, transformOrigin: "center center" }}>
        {modalContent}
      </div>
    </div>,
    document.body,
  );
}
