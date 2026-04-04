import type { Metadata } from "next";
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
    <html lang="zh-CN">
      <body className="min-h-screen bg-white">
        <div className="flex min-h-screen flex-col">
          <SiteHeader navigation={navigation} siteSettings={siteSettings} />
          <main className="flex-1">{children}</main>
          <SiteFooter siteSettings={siteSettings} />
        </div>
      </body>
    </html>
  );
}
