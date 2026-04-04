import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LoginPageView, RegisterPageView } from "@/components/auth-pages";
import {
  CommunityPageView,
  FinancingPageView,
  NewsPageView,
  ServicesPageView,
  SettlementPageView,
  SetupPageView,
} from "@/components/content-pages";
import { FeedbackPageView } from "@/components/feedback-page";
import { ApiMarketPageView, MarketplacePageView, McpMarketPageView } from "@/components/marketplace-pages";
import { PlaceholderPage } from "@/components/placeholder-page";
import { placeholderRouteMap } from "@/lib/placeholder-routes";
import { getArticlesByTab, getPageSections, getResourceCategories, getResourceItems } from "@/lib/site-api";

type RouteParams = {
  slug: string[];
};

const pageConfigMap = {
  news: {
    title: "最新动态",
    description: "一站掌握 OPC 创业动态、政策信息与内容资讯。",
  },
  community: {
    title: "社区简介",
    description: "了解 OPC 社区定位、空间能力与入驻条件。",
  },
  services: {
    title: "创业服务",
    description: "查看创业服务、政策匹配与配套能力。",
  },
  setup: {
    title: "OPC 开办",
    description: "查看企业开办全流程指引与相关服务入口。",
  },
  financing: {
    title: "融资对接",
    description: "查看融资基金、申报入口与融资支持内容。",
  },
  settlement: {
    title: "安居落户",
    description: "查看人才落户、住房配套与安居服务。",
  },
  marketplace: {
    title: "资源集市",
    description: "查看数据、工具包与算力资源集市。",
  },
  "api-market": {
    title: "API 市场",
    description: "查看 API 市场中的能力分类、服务卡片与接入入口。",
  },
  "mcp-market": {
    title: "MCP 市场",
    description: "查看 MCP 标准连接服务目录与能力内容。",
  },
  feedback: {
    title: "意见反馈",
    description: "提交问题与建议，后台统一处理并追踪状态。",
  },
  login: {
    title: "会员登录",
    description: "使用手机号与密码登录门户会员账户。",
  },
  register: {
    title: "会员注册",
    description: "使用手机号注册门户会员账户，无需短信验证码。",
  },
} as const;

function routeKeyFromParams(params: RouteParams) {
  return params.slug.join("/");
}

export async function generateMetadata({
  params,
}: {
  params: Promise<RouteParams>;
}): Promise<Metadata> {
  const routeKey = routeKeyFromParams(await params);
  const pageConfig = pageConfigMap[routeKey as keyof typeof pageConfigMap] || placeholderRouteMap[routeKey];

  if (!pageConfig) {
    return {};
  }

  return {
    title: pageConfig.title,
    description: pageConfig.description,
  };
}

export default async function ContentRoute({
  params,
}: {
  params: Promise<RouteParams>;
}) {
  const routeKey = routeKeyFromParams(await params);

  if (routeKey === "news") {
    const [sections, articlesByTab] = await Promise.all([getPageSections("news"), getArticlesByTab(20)]);
    return <NewsPageView articlesByTab={articlesByTab} sections={sections} />;
  }

  if (routeKey === "community") {
    const sections = await getPageSections("community");
    return <CommunityPageView sections={sections} />;
  }

  if (routeKey === "services") {
    const sections = await getPageSections("services");
    return <ServicesPageView sections={sections} />;
  }

  if (routeKey === "setup") {
    const sections = await getPageSections("setup");
    return <SetupPageView sections={sections} />;
  }

  if (routeKey === "financing") {
    const sections = await getPageSections("financing");
    return <FinancingPageView sections={sections} />;
  }

  if (routeKey === "settlement") {
    const sections = await getPageSections("settlement");
    return <SettlementPageView sections={sections} />;
  }

  if (routeKey === "marketplace") {
    const [sections, categories, items] = await Promise.all([
      getPageSections("marketplace"),
      getResourceCategories("marketplace"),
      getResourceItems("marketplace"),
    ]);
    return <MarketplacePageView categories={categories} items={items} sections={sections} />;
  }

  if (routeKey === "api-market") {
    const [sections, categories, items] = await Promise.all([
      getPageSections("api_market"),
      getResourceCategories("api_market"),
      getResourceItems("api_market"),
    ]);
    return <ApiMarketPageView categories={categories} items={items} sections={sections} />;
  }

  if (routeKey === "mcp-market") {
    const [sections, items] = await Promise.all([getPageSections("mcp_market"), getResourceItems("mcp_market")]);
    return <McpMarketPageView items={items} sections={sections} />;
  }

  if (routeKey === "feedback") {
    return <FeedbackPageView />;
  }

  if (routeKey === "login") {
    return <LoginPageView />;
  }

  if (routeKey === "register") {
    return <RegisterPageView />;
  }

  const placeholder = placeholderRouteMap[routeKey];
  if (placeholder) {
    return <PlaceholderPage description={placeholder.description} title={placeholder.title} />;
  }

  notFound();
}
