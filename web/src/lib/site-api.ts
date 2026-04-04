import "server-only";

import { articleTabs } from "@/lib/site-constants";
import type {
  Article,
  Banner,
  NavigationItem,
  PageSection,
  ResourceCategory,
  ResourceItem,
  ServiceItem,
  SiteSettings,
} from "@/types";

type ApiResponse<T> = {
  code: number;
  message: string;
  data: T;
};

const apiBaseUrl =
  process.env.INTERNAL_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://127.0.0.1:8000/api";

export const fallbackSiteSettings: SiteSettings = {
  site_name: "厦门 OPC 社区门户",
  site_subtitle: "成为一流的数智产业生态构建者",
  logo_url: "/prototype-assets/opc-logo.png",
  footer_text: "© 2026 厦门 OPC 社区. All rights reserved.",
  contact_phone: "0592-5953016",
  contact_email: "opc@xmigc.com",
  icp_no: "闽ICP备2026000001号",
};

export const fallbackNavigation: NavigationItem[] = [
  { id: 1, label: "首页", path: "/", target_type: "internal", target_value: "/", sort_order: 1 },
  { id: 2, label: "最新动态", path: "/news", target_type: "internal", target_value: "/news", sort_order: 2 },
  { id: 3, label: "社区简介", path: "/community", target_type: "internal", target_value: "/community", sort_order: 3 },
  { id: 4, label: "创业服务", path: "/services", target_type: "internal", target_value: "/services", sort_order: 4 },
  { id: 5, label: "资源集市", path: "/marketplace", target_type: "internal", target_value: "/marketplace", sort_order: 5 },
  { id: 6, label: "意见反馈", path: "/feedback", target_type: "internal", target_value: "/feedback", sort_order: 6 },
];

type HomePageData = {
  banners: Banner[];
  sections: PageSection[];
  serviceItems: ServiceItem[];
  articlesByTab: Record<string, Article[]>;
};

async function fetchApi<T>(path: string, params?: Record<string, string | number | undefined>): Promise<T> {
  const url = new URL(`${apiBaseUrl}${path}`);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, String(value));
      }
    });
  }

  const response = await fetch(url.toString(), {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }

  const payload = (await response.json()) as ApiResponse<T>;
  return payload.data;
}

export function getSiteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
}

export async function getSiteSettings() {
  try {
    return await fetchApi<SiteSettings>("/public/site-settings");
  } catch (error) {
    console.error("Failed to load site settings", error);
    return fallbackSiteSettings;
  }
}

export async function getNavigation() {
  try {
    const data = await fetchApi<NavigationItem[]>("/public/navigation");
    return data.length > 0 ? data : fallbackNavigation;
  } catch (error) {
    console.error("Failed to load navigation", error);
    return fallbackNavigation;
  }
}

export async function getHomePageData(): Promise<HomePageData> {
  try {
    const [banners, sections, serviceItems, ...articleResponses] = await Promise.all([
      fetchApi<Banner[]>("/public/banners"),
      fetchApi<PageSection[]>("/public/page-sections/home"),
      fetchApi<ServiceItem[]>("/public/service-items", {
        module_key: "home_service_entries",
      }),
      ...articleTabs.map((tab) =>
        fetchApi<Article[]>("/public/articles", {
          category_code: tab.code,
          limit: 4,
        })
      ),
    ]);

    return {
      banners,
      sections,
      serviceItems,
      articlesByTab: articleResponses.reduce<Record<string, Article[]>>((result, items, index) => {
        result[articleTabs[index].code] = items;
        return result;
      }, {}),
    };
  } catch (error) {
    console.error("Failed to load homepage data", error);
    return {
      banners: [],
      sections: [],
      serviceItems: [],
      articlesByTab: {},
    };
  }
}

export async function getPageSections(pageKey: string) {
  try {
    return await fetchApi<PageSection[]>(`/public/page-sections/${pageKey}`);
  } catch (error) {
    console.error(`Failed to load page sections for ${pageKey}`, error);
    return [];
  }
}

export async function getArticlesByTab(limit = 20) {
  try {
    const responses = await Promise.all(
      articleTabs.map((tab) =>
        fetchApi<Article[]>("/public/articles", {
          category_code: tab.code,
          limit,
        })
      )
    );

    return responses.reduce<Record<string, Article[]>>((result, items, index) => {
      result[articleTabs[index].code] = items;
      return result;
    }, {});
  } catch (error) {
    console.error("Failed to load article tabs", error);
    return {};
  }
}

export async function getResourceCategories(resourceType: string) {
  try {
    return await fetchApi<ResourceCategory[]>("/public/resource-categories", {
      resource_type: resourceType,
    });
  } catch (error) {
    console.error(`Failed to load resource categories for ${resourceType}`, error);
    return [];
  }
}

export async function getResourceItems(resourceType: string, categoryCode?: string) {
  try {
    return await fetchApi<ResourceItem[]>("/public/resource-items", {
      resource_type: resourceType,
      category_code: categoryCode,
    });
  } catch (error) {
    console.error(`Failed to load resource items for ${resourceType}`, error);
    return [];
  }
}
