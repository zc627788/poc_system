import type { SiteSettings } from "@/types";

export function SiteFooter({ siteSettings }: { siteSettings: SiteSettings }) {
  const footerText = siteSettings.footer_text?.trim() || "© 2026 厦门 OPC 社区. All rights reserved.";

  return (
    <footer className="mt-auto border-t border-gray-200 bg-gray-50 py-8">
      <div className="container mx-auto px-4 text-center text-sm text-gray-500">
        <p>{footerText}</p>
      </div>
    </footer>
  );
}
