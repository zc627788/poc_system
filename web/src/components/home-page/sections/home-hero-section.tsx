"use client";

import Image from "next/image";
import type { MouseEvent } from "react";
import { FloatingButton } from "../shared/floating-button";
import type { HeroSlide } from "../home-page-types";

type Props = {
  heroSlides: HeroSlide[];
  activeHeroIndex: number;
  currentHero: HeroSlide | null;
  onHeroClick: (event: MouseEvent<HTMLElement>) => void;
  onSlideChange: (index: number) => void;
  onPrimaryAction: (slide: HeroSlide) => void;
};

export function HomeHeroSection({
  heroSlides,
  activeHeroIndex,
  currentHero,
  onHeroClick,
  onSlideChange,
  onPrimaryAction,
}: Props) {
  if (!currentHero) {
    return null;
  }

  return (
    <section
      className={`relative overflow-hidden text-white ${currentHero.actionValue ? "cursor-pointer" : ""}`}
      onClick={onHeroClick}
    >
      <div className="mx-auto w-full max-w-[1920px] px-0">
        <div className="relative min-h-[360px] overflow-hidden sm:min-h-[480px]">
          {heroSlides.map((slide, index) => (
            <div
              className={`absolute inset-0 transition-opacity duration-700 ease-out ${index === activeHeroIndex ? "z-10 opacity-100" : "pointer-events-none z-0 opacity-0"}`}
              key={`${slide.highlightTitle}-${index}`}
            >
              <div className="absolute inset-0 hidden lg:block bg-[#0052FF]" />
              <div className="absolute inset-0 overflow-hidden lg:hidden">
                <Image
                  alt=""
                  aria-hidden="true"
                  className="object-cover object-right"
                  fill
                  priority={index === 0}
                  quality={90}
                  unoptimized={true}
                  src={slide.imageUrl}
                />
              </div>
              <div
                className={`absolute inset-0 overflow-hidden lg:left-auto lg:right-0 lg:top-0 lg:h-[480px] ${
                  index === 2 ? "lg:w-[1000px]" : "lg:w-[1150px]"
                }`}
              >
                <Image
                  alt={slide.highlightTitle}
                  className="object-cover object-right"
                  fill
                  priority={activeHeroIndex === 0 && index === 0}
                  quality={100}
                  unoptimized={true}
                  src={slide.imageUrl}
                />
                {/* Gradient mask to blend the left edge of the picture into the solid blue background seamlessly */}
                <div className="absolute inset-0 hidden lg:block bg-[linear-gradient(90deg,#0052FF_0%,rgba(0,82,255,0)_25%)] pointer-events-none" />
              </div>
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(11,79,245,0.18)_0%,rgba(11,79,245,0.75)_38%,rgba(11,79,245,0.96)_100%)] lg:hidden" />

              <div className="absolute inset-x-0 bottom-[56px] z-20 w-full px-4 sm:bottom-[76px] sm:px-6 lg:left-[118px] lg:top-[92px] lg:w-[760px] lg:px-0">
                <div className="flex min-h-[188px] flex-col justify-center sm:min-h-[212px] lg:min-h-[244px]">
                  <h1 className="max-w-[520px] text-[28px] font-black leading-[1.12] tracking-[0.01em] text-white drop-shadow-[0_8px_24px_rgba(0,0,0,0.18)] sm:text-[42px] lg:text-[56px]">
                    {slide.title}
                  </h1>
                  <p
                    className="mt-2 max-w-[760px] text-left text-[12px] font-bold text-[rgba(255,255,255,0.85)] sm:text-[18px] lg:text-[20px] lg:leading-[32px]"
                    style={{ fontFamily: "PingFang SC, PingFang SC", letterSpacing: "1px" }}
                  >
                    {slide.subtitle}
                  </p>
                  <p
                    className="mt-3 max-w-[693px] text-left text-[16px] font-extrabold text-white sm:text-[22px] lg:text-[34px] lg:leading-[48px]"
                    style={{ fontFamily: "PingFang SC, PingFang SC", letterSpacing: "1px" }}
                  >
                    {slide.highlightTitle}
                  </p>
                  <p
                    className="mt-2 max-w-[693px] whitespace-pre-line text-left text-[12px] font-semibold leading-[1.65] text-[rgba(255,255,255,0.85)] sm:text-[15px] lg:text-[16px] lg:leading-[32px]"
                    style={{ fontFamily: "PingFang SC, PingFang SC" }}
                  >
                    {slide.description}
                  </p>
                </div>

                <FloatingButton
                  className="mt-4 h-[34px] w-[118px] text-[12px] font-semibold sm:h-[38px] sm:w-[134px] sm:text-[13px] lg:mt-5"
                  onClick={(event) => {
                    event.stopPropagation();
                    onPrimaryAction(slide);
                  }}
                  tone="lime"
                  type="button"
                >
                  探索创业服务
                </FloatingButton>
              </div>
            </div>
          ))}

          {heroSlides.length > 1 ? (
            <div className="absolute bottom-5 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 rounded-full border border-white/15 bg-black/10 px-3 py-2 backdrop-blur-[10px] sm:bottom-[30px]">
              {heroSlides.map((slide, index) => (
                <button
                  aria-label={`Go to slide ${index + 1}`}
                  aria-pressed={index === activeHeroIndex}
                  className={`rounded-full transition-all duration-500 ${
                    index === activeHeroIndex
                      ? "h-[6px] w-[34px] bg-[#BEEC00] shadow-[0_0_18px_rgba(190,236,0,0.45)]"
                      : "h-[6px] w-[18px] border border-white/25 bg-white/40 hover:w-[24px] hover:bg-white/70"
                  }`}
                  key={`hero-dot-${index}`}
                  onClick={(event) => {
                    event.stopPropagation();
                    onSlideChange(index);
                  }}
                  title={slide.highlightTitle || `Slide ${index + 1}`}
                  type="button"
                />
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
