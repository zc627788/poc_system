import type { SiteSettings } from "@/types";

export function SiteFooter({ siteSettings }: { siteSettings: SiteSettings }) {
  const footerText = siteSettings.footer_text?.trim() || "© 2026 厦门 OPC 社区. All rights reserved.";

  return (
    <footer className="mt-auto border-t border-[#d8e4ff] bg-[linear-gradient(180deg,#f8fbff_0%,#eef4ff_100%)] py-[28px]">
      <div className="mx-auto w-full max-w-[1920px] px-[48px] text-center text-[14px] text-[#5b6475]">
        <p>{footerText}</p>
      </div>
    </footer>
  );
}
