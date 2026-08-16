import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
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
import { BillingProductDetailPage, BillingProductsPage } from "@/components/billing-products-page";
import { BillingBalancesPage, BillingConsumptionsPage, ServiceBalancesPage, WalletPaymentResultPage } from "@/components/billing-prepaid-page";
import { BillingOrderConfirmPage, BillingOrderDetailPage, BillingOrderPaymentResultPage, BillingOrdersPage } from "@/components/billing-orders-page";
import { MyCasesPageView } from "@/components/my-cases-page";
import { SetupApplicationPageView } from "@/components/setup-application-page";
import { TrustedDataspacePage } from "@/components/trusted-dataspace-page";
import {
  ApiMarketPageView,
  MarketplacePageView,
  McpMarketPageView,
  ModelPlazaPageView,
  ProductToolsPageView,
} from "@/components/marketplace-pages";
import { PlaceholderPage } from "@/components/placeholder-page";
import { placeholderRouteMap } from "@/lib/placeholder-routes";
import { getArticlesByTab, getPageSections, getResourceCategories, getResourceItems } from "@/lib/site-api";

type RouteParams = {
  slug: string[];
};

type RouteSearchParams = Record<string, string | string[] | undefined>;

const pageConfigMap = {
  news: { title: "最新动态", description: "一站掌握 OPC 创业活动、政策文件与内容资讯。" },
  community: { title: "社区简介", description: "了解 OPC 社区定位、空间能力与入驻条件。" },
  services: { title: "创业服务", description: "查看创业服务、政策匹配与配套能力。" },
  setup: { title: "OPC工商注册", description: "查看企业工商注册全流程指引与相关服务入口。" },
  "setup/apply": { title: "OPC 在线工商注册", description: "在线提交 OPC 工商注册申请表单与材料。" },
  financing: { title: "融资对接", description: "查看融资基金、申请入口与融资支持内容。" },
  settlement: { title: "安居落户", description: "查看人才落户、住房配套与安居服务。" },
  marketplace: { title: "资源集市", description: "查看数据、工具包与算力资源集市。" },
  "marketplace/tools/API": { title: "API服务", description: "查看产品工具中的 API 服务能力分类、服务卡片与接入入口。" },
  "marketplace/tools/MCP": { title: "MCP 服务", description: "查看产品工具中的 MCP 标准连接服务目录与能力内容。" },
  "marketplace/tools/model-plaza": { title: "模型广场", description: "查看资源集市中的模型广场能力目录。" },
  "marketplace/tools": { title: "产品工具", description: "查看 API、MCP、模型广场与产品工具的能力总览。" },
  feedback: { title: "联系我们", description: "告诉我们您当前需要的帮助，我们会尽快安排人员跟进与协助。" },
  "personal-center/my-cases": { title: "我的办件", description: "查看 OPC 工商注册资料登记的办件进度、审核状态与用户可见备注。" },
  login: { title: "登录", description: "请登录进行 OPC 门户。" },
  register: { title: "登录", description: "请登录进行 OPC 门户。" },
  products: { title: "商品中心", description: "查看 OPC 平台已上架的按月服务和预充值商品。" },
  "orders/confirm": { title: "确认订单", description: "核对商品、计费模式和订单金额。" },
  "orders/payment-result": { title: "支付结果", description: "轮询服务端确认订单支付结果。" },
  "my/orders": { title: "我的订单", description: "查询和取消本人订单。" },
  "my/balances": { title: "钱包中心", description: "查看当前余额并发起充值。" },
  "my/consumptions": { title: "交易明细", description: "查看钱包充值与余额购单记录。" },
  "my/service-balances": { title: "服务额度", description: "查看按服务归集的预充值额度与用量明细。" },
  "wallet/payment-result": { title: "钱包充值结果", description: "确认钱包充值支付结果。" },
  "trusted-data-space": { title: "厦门城市可信数据空间", description: "提交企业资料并创建可信数据空间账号。" },
} as const;

function routeKeyFromParams(params: RouteParams) {
  return params.slug.join("/");
}

export async function generateMetadata({ params }: { params: Promise<RouteParams> }): Promise<Metadata> {
  const routeKey = routeKeyFromParams(await params);
  const pageConfig = pageConfigMap[routeKey as keyof typeof pageConfigMap] || placeholderRouteMap[routeKey];
  if (!pageConfig) return {};
  return { title: pageConfig.title, description: pageConfig.description };
}

function readSearchParam(searchParams: RouteSearchParams, key: string) {
  const value = searchParams[key];
  return Array.isArray(value) ? value[0] : value;
}

export default async function ContentRoute({
  params,
  searchParams,
}: {
  params: Promise<RouteParams>;
  searchParams: Promise<RouteSearchParams>;
}) {
  const routeKey = routeKeyFromParams(await params);
  const resolvedSearchParams = await searchParams;

  if (routeKey === "news") {
    const [sections, articlesByTab] = await Promise.all([getPageSections("news"), getArticlesByTab(20)]);
    return <NewsPageView articlesByTab={articlesByTab} sections={sections} />;
  }
  if (routeKey === "community") return <CommunityPageView sections={await getPageSections("community")} />;
  if (routeKey === "services") return <ServicesPageView sections={await getPageSections("services")} />;
  if (routeKey === "setup") return <SetupPageView sections={await getPageSections("setup")} />;
  if (routeKey === "setup/apply") return <SetupApplicationPageView />;
  if (routeKey === "financing") return <FinancingPageView sections={await getPageSections("financing")} />;
  if (routeKey === "settlement") return <SettlementPageView sections={await getPageSections("settlement")} />;

  if (routeKey === "marketplace") {
    const [sections, categories, items] = await Promise.all([
      getPageSections("marketplace"),
      getResourceCategories("marketplace"),
      getResourceItems("marketplace"),
    ]);
    const normalizedSections = sections.map((section) =>
      section.section_key === "marketplace_group_tools" && section.extra_json?.includes("/marketplace#tools-model-plaza")
        ? { ...section, extra_json: section.extra_json.replace("/marketplace#tools-model-plaza", "/marketplace#marketplace-tools") }
        : section
    );
    return <MarketplacePageView categories={categories} items={items} sections={normalizedSections} />;
  }

  if (routeKey === "marketplace/tools/API") {
    const [sections, categories, items] = await Promise.all([
      getPageSections("api_market"),
      getResourceCategories("api_market"),
      getResourceItems("api_market"),
    ]);
    return <ApiMarketPageView categories={categories} items={items} sections={sections} />;
  }

  if (routeKey === "marketplace/tools/MCP") {
    const [sections, items] = await Promise.all([getPageSections("mcp_market"), getResourceItems("mcp_market")]);
    return <McpMarketPageView items={items} sections={sections} />;
  }

  if (routeKey === "marketplace/tools/model-plaza") {
    const [categories, items] = await Promise.all([
      getResourceCategories("marketplace"),
      getResourceItems("marketplace", "marketplace_model_plaza"),
    ]);
    return <ModelPlazaPageView category={categories.find((item) => item.code === "marketplace_model_plaza")} items={items} />;
  }

  if (routeKey === "marketplace/tools") {
    const [categories, items] = await Promise.all([getResourceCategories("marketplace"), getResourceItems("marketplace")]);
    return <ProductToolsPageView categories={categories} items={items} />;
  }

  if (routeKey === "feedback") return <FeedbackPageView />;
  if (routeKey === "trusted-data-space") return <TrustedDataspacePage />;
  if (routeKey === "products") return <BillingProductsPage />;
  if (routeKey.startsWith("products/")) {
    const productId = Number(routeKey.slice("products/".length));
    if (!Number.isSafeInteger(productId) || productId <= 0) notFound();
    return <BillingProductDetailPage productId={productId} />;
  }
  if (routeKey === "orders/confirm") {
    const productId = Number(readSearchParam(resolvedSearchParams, "product_id"));
    if (!Number.isSafeInteger(productId) || productId <= 0) notFound();
    return <BillingOrderConfirmPage productId={productId} />;
  }
  if (routeKey === "orders/payment-result") return <BillingOrderPaymentResultPage />;
  if (routeKey === "wallet/payment-result") return <WalletPaymentResultPage />;
  if (routeKey === "my/orders") return <BillingOrdersPage />;
  if (routeKey === "my/balances") return <BillingBalancesPage />;
  if (routeKey === "my/consumptions") return <BillingConsumptionsPage />;
  if (routeKey === "my/service-balances") return <ServiceBalancesPage />;
  if (routeKey.startsWith("my/orders/")) {
    const orderId = Number(routeKey.slice("my/orders/".length));
    if (!Number.isSafeInteger(orderId) || orderId <= 0) notFound();
    return <BillingOrderDetailPage orderId={orderId} />;
  }
  if (routeKey === "personal-center/my-cases") return <MyCasesPageView />;
  if (routeKey === "login" || routeKey === "register") {
    const mode = readSearchParam(resolvedSearchParams, "mode");
    const returnTo = readSearchParam(resolvedSearchParams, "return_to") || "/";
    if (mode !== "callback") {
      redirect(`/api/public/auth/ixiamen/start?return_to=${encodeURIComponent(returnTo)}`);
    }
    return routeKey === "login" ? <LoginPageView /> : <RegisterPageView />;
  }

  const placeholder = placeholderRouteMap[routeKey];
  if (placeholder) return <PlaceholderPage description={placeholder.description} title={placeholder.title} />;
  notFound();
}
