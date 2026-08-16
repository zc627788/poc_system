type NewsBadgeProps = {
  tag: string;
};

export function NewsBadge({ tag }: NewsBadgeProps) {
  const toneClassName = "bg-[#0052FF] text-white";

  return (
    <span
      className={`inline-flex h-[24px] shrink-0 items-center rounded-[8px] px-[10px] text-[13px] font-normal leading-[19px] ${toneClassName}`}
    >
      {tag}
    </span>
  );
}
