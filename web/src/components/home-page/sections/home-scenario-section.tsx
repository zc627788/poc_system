"use client";

import { FloatingButton } from "../shared/floating-button";
import type { ScenarioCard } from "../home-page-types";

type Props = {
  scenarioCard: ScenarioCard;
};

export function HomeScenarioSection({ scenarioCard }: Props) {
  if (!scenarioCard) {
    return null;
  }

  return (
    <section className="mx-auto w-full max-w-[1920px] px-4 pb-16 pt-8 sm:px-6 lg:px-10 lg:pb-[96px] lg:pt-[36px]">
      <div className="mx-auto w-full max-w-[1600px]">
        <div className="mb-[25px] flex items-center justify-between gap-4">
          <h3 className="flex items-center gap-2 home-section-title text-[#000000]">
            <span className="inline-block h-[19px] w-[4px] rounded-[133px] bg-[#0052FF]" /> 场景供需
          </h3>
        </div>

        <div className="relative min-h-[220px] overflow-hidden rounded-[21px] bg-[#F2FAFF] sm:min-h-[243px]">
          <a className="absolute inset-0 block" href={scenarioCard.href} rel="noopener noreferrer" target="_blank">
            {scenarioCard.imageUrl ? <img alt={scenarioCard.title} className="absolute inset-0 h-full w-full object-cover" src={scenarioCard.imageUrl} /> : null}
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(247,252,255,0.96)_0%,rgba(247,252,255,0.86)_42%,rgba(247,252,255,0.16)_100%)]" />

            <div className="relative z-10 flex h-full w-full flex-col px-5 py-8 sm:px-[56px] sm:py-[40px]">
              <div className="max-w-[760px]">
                <div className="text-[18px] font-semibold leading-[1.35] tracking-[0] text-[#0F172A] sm:text-[28px] sm:leading-[40px]">{scenarioCard.title}</div>
                <p className="mt-3 whitespace-pre-line text-[13px] leading-[22px] text-[#34435A] sm:mt-[14px] sm:text-[15px] sm:leading-[26px]">{scenarioCard.desc}</p>
              </div>

              <div className="mt-auto">
                <FloatingButton as="span" className="h-9 w-full max-w-[168px] text-[12px] font-semibold sm:h-[33px] sm:w-[139px] sm:text-[13px]" tone="lime">
                  {scenarioCard.buttonText}
                </FloatingButton>
              </div>
            </div>
          </a>
        </div>
      </div>
    </section>
  );
}
