import Link from "next/link";
import * as Icons from "lucide-react";
import type { BreadcrumbItem } from "../marketplace-page-types";

export function MarketplaceBreadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <div className="mb-8 flex items-center gap-2 text-[13px] font-medium text-gray-900">
      {items.map((item, index) => (
        <div className="flex items-center gap-2" key={`${item.label}-${index}`}>
          {item.href ? (
            <Link className="transition-colors hover:text-[#0052d9]" href={item.href}>
              {item.label}
            </Link>
          ) : (
            <span className="text-[#0052d9]">{item.label}</span>
          )}
          {index < items.length - 1 ? <Icons.ChevronRight className="text-gray-400" size={14} /> : null}
        </div>
      ))}
    </div>
  );
}
