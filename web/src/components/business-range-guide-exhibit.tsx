"use client";

import { X } from "lucide-react";
import {
  useEffect,
  useLayoutEffect,
  useState,
  type CSSProperties,
  type MouseEvent,
  type WheelEvent,
} from "react";
import { ViewportModal } from "@/components/viewport-modal";

type BusinessRangeGuideOption = {
  title: string;
  summary: string;
};

type BusinessRangeGuideExhibitItem = {
  alt: string;
  imageClassName: string;
  imageSrc: string;
  mobileStyle?: CSSProperties;
  style: CSSProperties;
};

type BusinessRangeGuideExhibitPhase = "hidden" | "entering" | "entered" | "exiting";

type BusinessRangeGuideExhibitProps = {
  onClose: () => void;
  open: boolean;
};

const businessRangeGuideFormWidth = 1120;
const businessRangeGuideViewportPadding = 16;

const businessRangeGuideOptions: BusinessRangeGuideOption[] = [
  { title: "点击“查询经营范围”进行查询", summary: "点击下方蓝色字查询" },
  { title: "选择企业类型后需选择经营项目", summary: "可输入企业类型快速过滤" },
  { title: "搜素关键词后点击添加按钮，并生成结果", summary: "可以添加多条经营项目" },
  { title: "复制经营范围内文字，粘贴至经营范围内", summary: "(经营项目为软件开发，请选择64/65开头的行业编号)" },
];

const businessRangeGuideExhibitPosition: CSSProperties = {
  top: "105px",
  right: "40px",
};

const businessRangeGuideExhibitMobilePosition: CSSProperties = {
  left: "50%",
  top: "calc(50% + 45px)",
  transform: "translateX(-50%)",
};

const businessRangeGuideExhibitSecondPosition: CSSProperties = {
  top: "30px",
  right: "80px",
};

const businessRangeGuideExhibitSecondMobilePosition: CSSProperties = {
  left: "50%",
  top: "calc(50% + 35px)",
  transform: "translateX(-50%)",
};

const businessRangeGuideExhibitThirdPosition: CSSProperties = {
  top: "90px",
  right: "50px",
};

const businessRangeGuideExhibitThirdMobilePosition: CSSProperties = {
  left: "50%",
  top: "calc(50% + 45px)",
  transform: "translateX(-50%)",
};

const businessRangeGuideExhibitFourthPosition: CSSProperties = {
  top: "90px",
  right: "70px",
};

const businessRangeGuideExhibitFourthMobilePosition: CSSProperties = {
  left: "50%",
  top: "calc(50% + 45px)",
  transform: "translateX(-50%)",
};

const businessRangeGuideOptionsMobilePosition: CSSProperties = {
  top: "-100px",
};

const businessRangeGuideExhibits: BusinessRangeGuideExhibitItem[] = [
  {
    alt: "示意图1",
    imageClassName: "h-auto w-[579px]",
    imageSrc: "/service-OPCsetip-businessrange-guide-exhibit1.png",
    mobileStyle: businessRangeGuideExhibitMobilePosition,
    style: businessRangeGuideExhibitPosition,
  },
  {
    alt: "示意图2",
    imageClassName: "h-auto w-[545px]",
    imageSrc: "/service-OPCsetip-businessrange-guide-exhibit2.png",
    mobileStyle: businessRangeGuideExhibitSecondMobilePosition,
    style: businessRangeGuideExhibitSecondPosition,
  },
  {
    alt: "示意图3",
    imageClassName: "h-auto w-[563px]",
    imageSrc: "/service-OPCsetip-businessrange-guide-exhibit3.png",
    mobileStyle: businessRangeGuideExhibitThirdMobilePosition,
    style: businessRangeGuideExhibitThirdPosition,
  },
  {
    alt: "示意图4",
    imageClassName: "h-auto w-[487px]",
    imageSrc: "/service-OPCsetip-businessrange-guide-exhibit4.png",
    mobileStyle: businessRangeGuideExhibitFourthMobilePosition,
    style: businessRangeGuideExhibitFourthPosition,
  },
];

function createInitialBusinessRangeGuideExhibitPhases(): BusinessRangeGuideExhibitPhase[] {
  return businessRangeGuideExhibits.map((_, index) => (index === 0 ? "entered" : "hidden"));
}

function getBusinessRangeGuideExhibitMotionClass(phase: BusinessRangeGuideExhibitPhase) {
  if (phase === "entered") {
    return "translate-y-0 opacity-100";
  }

  if (phase === "entering") {
    return "-translate-y-2 opacity-0 pointer-events-none";
  }

  return "translate-y-2 opacity-0 pointer-events-none";
}

function getBusinessRangeGuideModalStyle(isMobileGuideViewport: boolean): CSSProperties {
  const preferredHeight = isMobileGuideViewport ? 680 : 565;
  const viewportHeight = "calc(100vh - 32px)";

  return {
    height: `min(${preferredHeight}px, ${viewportHeight})`,
    maxHeight: viewportHeight,
    maxWidth: `calc(100vw - ${businessRangeGuideViewportPadding * 2}px)`,
    width: `min(${businessRangeGuideFormWidth}px, calc(100vw - ${businessRangeGuideViewportPadding * 2}px))`,
  };
}

export function BusinessRangeGuideExhibit({ onClose, open }: BusinessRangeGuideExhibitProps) {
  const [desktopTipOpen, setDesktopTipOpen] = useState(false);
  const [activeGuideSlide, setActiveGuideSlide] = useState(0);
  const [displayedGuideSlide, setDisplayedGuideSlide] = useState(0);
  const [guideExhibitPhases, setGuideExhibitPhases] = useState<BusinessRangeGuideExhibitPhase[]>(
    createInitialBusinessRangeGuideExhibitPhases,
  );
  const [isMobileGuideViewport, setIsMobileGuideViewport] = useState(false);

  useLayoutEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const mediaQuery = window.matchMedia("(max-width: 639px)");
    const syncViewport = (event?: MediaQueryListEvent) => {
      setIsMobileGuideViewport(event ? event.matches : mediaQuery.matches);
    };

    syncViewport();

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", syncViewport);
      return () => mediaQuery.removeEventListener("change", syncViewport);
    }

    mediaQuery.addListener(syncViewport);
    return () => mediaQuery.removeListener(syncViewport);
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    setActiveGuideSlide(0);
    setDisplayedGuideSlide(0);
    setGuideExhibitPhases(createInitialBusinessRangeGuideExhibitPhases());
  }, [open]);

  useEffect(() => {
    if (!open || activeGuideSlide === displayedGuideSlide) {
      return;
    }

    const previousSlide = displayedGuideSlide;
    const nextSlide = activeGuideSlide;

    setGuideExhibitPhases((prev) =>
      prev.map((_, index) => {
        if (index === previousSlide) {
          return "exiting";
        }
        if (index === nextSlide) {
          return "entering";
        }
        return "hidden";
      }),
    );

    const enterFrame = window.requestAnimationFrame(() => {
      setGuideExhibitPhases((prev) =>
        prev.map((phase, index) => {
          if (index === nextSlide) {
            return "entered";
          }
          if (index === previousSlide && phase === "exiting") {
            return "exiting";
          }
          return "hidden";
        }),
      );
    });

    const cleanupTimer = window.setTimeout(() => {
      setDisplayedGuideSlide(nextSlide);
      setGuideExhibitPhases((prev) => prev.map((_, index) => (index === nextSlide ? "entered" : "hidden")));
    }, 320);

    return () => {
      window.cancelAnimationFrame(enterFrame);
      window.clearTimeout(cleanupTimer);
    };
  }, [activeGuideSlide, displayedGuideSlide, open]);

  const resetGuideState = () => {
    setActiveGuideSlide(0);
    setDisplayedGuideSlide(0);
    setGuideExhibitPhases(createInitialBusinessRangeGuideExhibitPhases());
  };

  const handleCloseGuide = () => {
    resetGuideState();
    onClose();
  };

  const handleCloseGuideWithDesktopTip = () => {
    handleCloseGuide();
    if (isMobileGuideViewport) {
      setDesktopTipOpen(true);
    }
  };

  const handleCloseDesktopTip = () => {
    setDesktopTipOpen(false);
  };

  const handleGuideWheel = (event: WheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (event.deltaY === 0) {
      return;
    }

    setActiveGuideSlide((prev) => {
      if (event.deltaY > 0) {
        return Math.min(prev + 1, businessRangeGuideOptions.length - 1);
      }
      return Math.max(prev - 1, 0);
    });
  };

  const handleGuideTrackClick = (event: MouseEvent<HTMLDivElement>) => {
    const trackRect = event.currentTarget.getBoundingClientRect();
    const clickOffsetY = event.clientY - trackRect.top;
    const nextSlide = Math.floor(clickOffsetY / 60);
    const safeSlide = Math.max(0, Math.min(nextSlide, businessRangeGuideOptions.length - 1));
    setActiveGuideSlide(safeSlide);
  };

  if (!open && !desktopTipOpen) {
    return null;
  }

  return (
    <>
      {open ? (
        <ViewportModal onClose={handleCloseGuideWithDesktopTip} open>
          <div
            className="relative overflow-hidden rounded-[16px] bg-[#FFFFFF] p-5 shadow-[0_24px_60px_rgba(0,0,0,0.18)] sm:p-6"
            onWheel={handleGuideWheel}
            style={{
              ...getBusinessRangeGuideModalStyle(isMobileGuideViewport),
              backgroundColor: "#FFFFFF",
              backgroundImage: "url('/service-OPCsetup-director-background.png')",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
              backgroundSize: "cover",
            }}
          >
            <button
              className="absolute right-4 top-4 z-20 flex h-7 w-7 items-center justify-center rounded-full text-[#8898b6] transition-colors hover:bg-[#f0f4fb] hover:text-[#4a5b78]"
              onClick={handleCloseGuideWithDesktopTip}
              type="button"
            >
              <X size={16} />
            </button>

            <div className="relative -left-[10px] flex h-full min-h-0 items-center gap-2 sm:left-auto sm:-right-[50px] sm:gap-3">
              <div
                className="relative flex h-full items-center"
                style={isMobileGuideViewport ? businessRangeGuideOptionsMobilePosition : undefined}
              >
                <div className="relative h-[240px] w-[8px] cursor-pointer rounded-[30px] bg-[#EAECF0]" onClick={handleGuideTrackClick}>
                  <span
                    className="absolute left-0 top-0 h-[60px] w-[8px] rounded-[30px] bg-[#BEEC00] transition-transform duration-500"
                    style={{ transform: `translateY(${activeGuideSlide * 60}px)` }}
                  />
                </div>
              </div>

              <div className="relative -ml-2 h-full min-w-0 flex-1 sm:-ml-3">
                <div className="absolute left-0 top-0 min-w-0">
                  <h2
                    className="h-[59px] w-[259px] whitespace-nowrap text-left text-[35px] font-extrabold leading-[50px] text-[#0052D9] sm:text-[42px] sm:leading-[59px]"
                    style={{ fontFamily: "PingFang SC, PingFang SC", fontStyle: "normal", textTransform: "none" }}
                  >
                    查询经营范围指引
                  </h2>
                  <p
                    className="mt-2 h-[24px] w-[408px] text-left text-[13px] font-medium leading-[20px] text-[#1751AE] sm:text-[17px] sm:leading-[24px]"
                    style={{ fontFamily: "PingFang SC, PingFang SC", fontStyle: "normal", textTransform: "none" }}
                  >
                    快速查询经营范围（或者拟经营的主要业务）
                  </p>
                </div>

                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2">
                  <div className="flex h-[240px] w-full items-center gap-4">
                    <div
                      className="relative flex min-w-0 flex-1 flex-col justify-between"
                      style={isMobileGuideViewport ? businessRangeGuideOptionsMobilePosition : undefined}
                    >
                      {businessRangeGuideOptions.map((item, index) => (
                        <button
                          className="flex h-[60px] w-full items-center rounded-[12px] pl-2 pr-4 text-left transition-colors"
                          key={item.title}
                          onClick={() => setActiveGuideSlide(index)}
                          type="button"
                        >
                          <div className="space-y-1">
                            <div
                              className="h-[34px] min-w-[96px] w-fit whitespace-nowrap text-left text-[clamp(12px,3.35vw,22px)] font-bold text-[#333333] sm:text-[24px]"
                              style={{ fontFamily: "PingFang SC, PingFang SC", fontStyle: "normal", textTransform: "none" }}
                            >
                              {item.title}
                            </div>
                            <div
                              className="h-[20px] w-[252px] text-left text-[12px] font-medium text-[#666666] sm:text-[14px]"
                              style={{ fontFamily: "PingFang SC, PingFang SC", fontStyle: "normal", textTransform: "none" }}
                              title={item.summary}
                            >
                              {item.summary}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>

                    <div className="relative h-[470px] w-[700px] shrink-0 overflow-visible">
                      {businessRangeGuideExhibits.map((exhibit, index) => {
                        const motionClass = getBusinessRangeGuideExhibitMotionClass(guideExhibitPhases[index] || "hidden");

                        return (
                          <div
                            className={isMobileGuideViewport ? "fixed" : "absolute"}
                            key={exhibit.alt}
                            style={isMobileGuideViewport ? exhibit.mobileStyle || exhibit.style : exhibit.style}
                          >
                            <img
                              alt={exhibit.alt}
                              className={`block transition-all duration-700 ease-out ${motionClass} ${
                                isMobileGuideViewport ? "h-auto max-w-none w-[calc(100vw_-_72px)]" : `max-w-none ${exhibit.imageClassName}`
                              }`}
                              src={exhibit.imageSrc}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </ViewportModal>
      ) : null}

      {desktopTipOpen ? (
        <ViewportModal
          contentClassName="w-full max-w-[320px] rounded-[18px] bg-white p-6 shadow-[0_24px_64px_rgba(15,23,42,0.18)]"
          onClose={handleCloseDesktopTip}
          open
        >
          <div className="text-center text-[20px] font-black leading-8 text-black">建议电脑端进行OPC办理操作</div>
          <div className="mt-5 flex justify-center">
            <button
              className="inline-flex h-[42px] items-center justify-center rounded-[12px] bg-[#BEEC00] px-6 text-[14px] font-semibold text-black"
              onClick={handleCloseDesktopTip}
              type="button"
            >
              我知道了
            </button>
          </div>
        </ViewportModal>
      ) : null}
    </>
  );
}
