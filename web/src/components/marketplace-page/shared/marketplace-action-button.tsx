import type { ReactNode } from "react";
import { ScrollToTopLink } from "@/components/scroll-to-top-link";

export function MarketplaceActionButton({
  actionType,
  href,
  className,
  children,
}: {
  actionType?: string;
  href?: string | null;
  className: string;
  children: ReactNode;
}) {
  if (actionType === "external" && href) {
    return (
      <a className={className} href={href} rel="noopener noreferrer" target="_blank">
        {children}
      </a>
    );
  }

  if (actionType === "internal" && href) {
    return (
      <ScrollToTopLink className={className} href={href}>
        {children}
      </ScrollToTopLink>
    );
  }

  return <span className={className}>{children}</span>;
}
