"use client";

import { SharedMoreButton } from "@/components/shared-more-button";
import { DataResourceFeaturedCard } from "../cards/data-resource-featured-card";
import { DataResourceSummaryCard } from "../cards/data-resource-summary-card";
import type { MarketplaceViewModel } from "../home-page-types";

type Props = {
  marketplace: MarketplaceViewModel;
};

export function MarketplaceDataSection({ marketplace }: Props) {
  if (!marketplace.featuredDataCard && marketplace.dataSummaryCards.length === 0 && !marketplace.dataSectionTitle) {
    return null;
  }

  return (
    <div id="marketplace-data">
      <div className="mb-5 flex items-center justify-between gap-4">
        <h3 className="flex min-w-0 items-center gap-2 home-section-title text-[#000000]">
          <span className="inline-block h-[19px] w-[4px] rounded-[133px] bg-[#0052FF]" /> {marketplace.dataSectionTitle}
        </h3>
        <SharedMoreButton className="w-fit" href={marketplace.dataLink.href} scrollToTop>
          {marketplace.dataLink.buttonText}
        </SharedMoreButton>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-2 xl:grid-cols-4 xl:gap-[21px]">
        {marketplace.featuredDataCard ? <DataResourceFeaturedCard item={marketplace.featuredDataCard} /> : null}
        {marketplace.dataSummaryCards.map((item) => (
          <DataResourceSummaryCard item={item} key={item.code} />
        ))}
      </div>
    </div>
  );
}
