import type { MetadataRoute } from "next";
import { placeholderRouteKeys } from "@/lib/placeholder-routes";
import { getSiteUrl } from "@/lib/site-api";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl();
  const lastModified = new Date();

  return [
    {
      url: siteUrl,
      lastModified,
      changeFrequency: "daily",
      priority: 1
    },
    ...placeholderRouteKeys.map((key) => ({
      url: `${siteUrl}/${key}`,
      lastModified,
      changeFrequency: "weekly" as const,
      priority: 0.7
    }))
  ];
}
