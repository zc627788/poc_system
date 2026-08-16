"use client";

import { MobileComputeMarketplaceModule } from "@/components/mobile-compute-marketplace-module";
import { SharedMoreButton } from "@/components/shared-more-button";
import { ComputeProductCard } from "../cards/compute-product-card";
import { ComputeSummaryCard } from "../cards/compute-summary-card";
import type { MarketplaceViewModel } from "../home-page-types";

type Props = {
  marketplace: MarketplaceViewModel;
};

export function MarketplaceComputeSection({ marketplace }: Props) {
  if (!marketplace.computeSummary && marketplace.computeCards.length === 0 && !marketplace.computeSectionTitle) {
    return null;
  }

  return (
    <div id="marketplace-compute">
      <div className="mb-[25px] flex items-center justify-between gap-4">
        <h3 className="flex min-w-0 items-center gap-2 home-section-title text-[#000000]">
          <span className="inline-block h-[19px] w-[4px] rounded-[133px] bg-[#0052FF]" /> {marketplace.computeSectionTitle}
        </h3>
        <SharedMoreButton className="w-fit" href={marketplace.computeLink.href} scrollToTop>
          {marketplace.computeLink.buttonText}
        </SharedMoreButton>
      </div>

      <div className="xl:hidden">
        <MobileComputeMarketplaceModule
          cards={marketplace.computeCards.map((gpu) => ({
            ...gpu,
            primaryButtonText: "立即咨询",
            secondaryButtonText: "立即购买",
          }))}
          summary={marketplace.computeSummary || { title: "", desc: "", href: "/marketplace", actionType: "internal", buttonText: "" }}
        />
      </div>

      <div className="hidden xl:grid xl:grid-cols-[342px_repeat(3,minmax(0,1fr))] xl:gap-[21px]">
        {marketplace.computeSummary ? <ComputeSummaryCard item={marketplace.computeSummary} /> : null}
        {marketplace.computeCards.map((gpu) => (
          <ComputeProductCard gpu={gpu} key={gpu.title} />
        ))}
      </div>
    </div>
  );
}
