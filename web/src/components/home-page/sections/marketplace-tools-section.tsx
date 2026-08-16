"use client";

import { SharedMoreButton } from "@/components/shared-more-button";
import { ToolkitResourceCard } from "../cards/toolkit-resource-card";
import type { MarketplaceViewModel } from "../home-page-types";

type Props = {
  marketplace: MarketplaceViewModel;
};

export function MarketplaceToolsSection({ marketplace }: Props) {
  if (marketplace.toolCards.length === 0 && !marketplace.toolsSectionTitle) {
    return null;
  }

  return (
    <div id="marketplace-tools">
      <div className="mb-5 flex items-center justify-between gap-4">
        <h3 className="flex min-w-0 items-center gap-2 home-section-title text-[#000000]">
          <span className="inline-block h-5 w-1.5 rounded-full bg-[#0052FF]" /> {marketplace.toolsSectionTitle}
        </h3>
        <SharedMoreButton className="w-fit" href={marketplace.toolsLink.href} scrollToTop>
          {marketplace.toolsLink.buttonText}
        </SharedMoreButton>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-2 xl:grid-cols-4 xl:gap-[21px]">
        {marketplace.toolCards.map((item) => (
          <ToolkitResourceCard item={item} key={item.title} />
        ))}
      </div>
    </div>
  );
}
