import type { Metadata } from "next";
import { Suspense } from "react";
import { BrowserHistoryScrollRestoration } from "@/components/browser-history-scroll-restoration";
import { DesktopScaleShell } from "@/components/desktop-scale-shell";
import { ScrollToTopOnNav } from "@/components/scroll-to-top-on-nav";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getNavigation, getSiteSettings, getSiteUrl } from "@/lib/site-api";
import "./globals.css";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const siteSettings = await getSiteSettings();

  return {
    metadataBase: new URL(getSiteUrl()),
    title: {
      default: siteSettings.site_name,
      template: `%s | ${siteSettings.site_name}`
    },
    description: siteSettings.site_subtitle,
    keywords: ["厦门 OPC", "数智产业社区", "创业服务", "资源集市", "Next.js 15 SEO"],
    alternates: {
      canonical: "/"
    },
    openGraph: {
      title: siteSettings.site_name,
      description: siteSettings.site_subtitle,
      type: "website",
      url: "/",
      siteName: siteSettings.site_name,
      images: siteSettings.logo_url ? [{ url: siteSettings.logo_url }] : undefined
    },
    icons: {
      icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='14' fill='%230052d9'/%3E%3Ctext x='32' y='40' font-size='28' text-anchor='middle' fill='white' font-family='Arial, sans-serif'%3EO%3C/text%3E%3C/svg%3E"
    }
  };
}

export default async function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [siteSettings, navigation] = await Promise.all([getSiteSettings(), getNavigation()]);

  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className="min-h-screen bg-[#edf3ff]">
        <Suspense fallback={null}>
          <BrowserHistoryScrollRestoration />
        </Suspense>
        <ScrollToTopOnNav />
        <SiteHeader navigation={navigation} siteSettings={siteSettings} />
        {/* Desktop content must stay inside DesktopScaleShell on a 1920px canvas to avoid stretch distortion. */}
        <div className="pt-[60px]">
          <DesktopScaleShell>
            <div className="site-shell">
              <main className="site-main flex-1">{children}</main>
              <SiteFooter siteSettings={siteSettings} />
            </div>
          </DesktopScaleShell>
        </div>
      </body>
    </html>
  );
}
