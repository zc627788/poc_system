"use client";

import type { MarketplaceViewModel } from "../home-page-types";
import { MarketplaceComputeSection } from "./marketplace-compute-section";
import { MarketplaceDataSection } from "./marketplace-data-section";
import { MarketplaceToolsSection } from "./marketplace-tools-section";

type Props = {
  marketplace: MarketplaceViewModel;
};

export function HomeMarketplaceSection({ marketplace }: Props) {
  return (
    <section className="border-t border-gray-100 bg-slate-50">
      <div className="mx-auto w-full max-w-[1920px] px-4 pb-16 pt-8 sm:px-6 lg:px-10 lg:pb-[96px] lg:pt-[36px]">
        <div className="mx-auto w-full max-w-[1600px]">
          <div className="space-y-[36px]">
            <MarketplaceToolsSection marketplace={marketplace} />
            <MarketplaceDataSection marketplace={marketplace} />
            <MarketplaceComputeSection marketplace={marketplace} />
          </div>
        </div>
      </div>
    </section>
  );
}
