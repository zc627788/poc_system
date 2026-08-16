import type { Metadata } from "next";
import { HomePageView } from "@/components/home-page-view";
import { getHomePageData, getSiteSettings, getSiteUrl } from "@/lib/site-api";

export async function generateMetadata(): Promise<Metadata> {
  const siteSettings = await getSiteSettings();

  return {
    title: "首页",
    description: `${siteSettings.site_subtitle}，聚合最新动态、社区简介、创业服务入口与资源集市摘要。`
  };
}

export default async function HomePage() {
  const [siteSettings, homePageData] = await Promise.all([getSiteSettings(), getHomePageData()]);

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteSettings.site_name,
    description: siteSettings.site_subtitle,
    url: getSiteUrl(),
    publisher: {
      "@type": "Organization",
      name: siteSettings.site_name
    }
  };

  return (
    <>
      <script
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        type="application/ld+json"
      />
      <HomePageView
        articlesByTab={homePageData.articlesByTab}
        banners={homePageData.banners}
        marketplaceSummary={homePageData.marketplaceSummary}
        sections={homePageData.sections}
        serviceItems={homePageData.serviceItems}
      />
    </>
  );
}
