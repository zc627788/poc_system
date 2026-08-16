import { SharedMoreButton } from "@/components/shared-more-button";

export function MarketplaceSectionHeader({
  title,
  href,
}: {
  title: string;
  href?: string;
}) {
  return (
    <div className="mb-[15px] flex items-center justify-between gap-4 border-b border-gray-100 pb-[15px] pt-[15px]">
      <h3 className="flex min-w-0 items-center gap-3 route-section-title text-gray-900">
        <span className="h-[1em] w-[4px] shrink-0 rounded-[133px] bg-[#0052FF]" />
        <span>{title}</span>
      </h3>
      {href ? <SharedMoreButton href={href} /> : null}
    </div>
  );
}
