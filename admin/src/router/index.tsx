import type { ReactElement } from "react";
import { Result } from "antd";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { getToken } from "../api";
import { AdminLayout } from "../components/AdminLayout";
import { ArticlesPage } from "../pages/ArticlesPage";
import { BannersPage } from "../pages/BannersPage";
import { FeedbacksPage } from "../pages/FeedbacksPage";
import { FinancingContentPage } from "../pages/FinancingContentPage";
import { HomeOverviewPage } from "../pages/HomeOverviewPage";
import { HomeServicesPage } from "../pages/HomeServicesPage";
import { LoginPage } from "../pages/LoginPage";
import { CommunityJoinApplicationsPage } from "../pages/CommunityJoinApplicationsPage";
import { CommunityContentPage } from "../pages/CommunityContentPage";
import { OpcApplicationsPage } from "../pages/OpcApplicationsPage";
import { MarketplaceComputeContentPage } from "../pages/MarketplaceComputeContentPage";
import { MarketplaceDataContentPage } from "../pages/MarketplaceDataContentPage";
import { MarketplaceToolsContentPage } from "../pages/MarketplaceToolsContentPage";
import { PageSectionsPage } from "../pages/HomeSectionsPage";
import { ServicesContentPage } from "../pages/ServicesContentPage";
import { SettlementContentPage } from "../pages/SettlementContentPage";
import { SiteSettingsPage } from "../pages/SiteSettingsPage";
import { SiteUsersPage } from "../pages/SiteUsersPage";
import { BillingProductsPage } from "../pages/BillingProductsPage";
import { BillingOrdersPage } from "../pages/BillingOrdersPage";
import { BillingReconciliationsPage } from "../pages/BillingReconciliationsPage";
import { BillingConsumptionImportsPage } from "../pages/BillingConsumptionImportsPage";
import { BillingConsumptionsPage } from "../pages/BillingConsumptionsPage";
import { BillingBalancesPage } from "../pages/BillingBalancesPage";
import { BillingWalletLedgerPage } from "../pages/BillingWalletLedgerPage";
import { BillingWalletRechargesPage } from "../pages/BillingWalletRechargesPage";
import { TrustedDataspaceRegistrationsPage } from "../pages/TrustedDataspaceRegistrationsPage";

function RequireAuth({ children }: { children: ReactElement }) {
  const location = useLocation();
  const token = getToken();

  if (!token) {
    return <Navigate replace state={{ from: location.pathname }} to="/login" />;
  }

  return children;
}

export function AdminRouter() {
  return (
    <Routes>
      <Route element={<LoginPage />} path="/login" />
      <Route
        element={
          <RequireAuth>
            <AdminLayout />
          </RequireAuth>
        }
        path="/"
      >
        <Route element={<Navigate replace to="/home/overview" />} index />

        <Route element={<HomeOverviewPage />} path="home/overview" />
        <Route element={<BannersPage />} path="home/banners" />
        <Route element={<Navigate replace to="/home/overview" />} path="home/sections" />
        <Route element={<HomeServicesPage />} path="home/service-entries" />

        <Route element={<ArticlesPage />} path="news/articles" />
        <Route element={<Navigate replace to="/news/articles" />} path="news/header" />

        <Route element={<CommunityContentPage />} path="community/content" />

        <Route element={<ServicesContentPage />} path="services/content" />
        <Route element={<Navigate replace to="/services/content" />} path="services/setup" />
        <Route element={<FinancingContentPage />} path="services/financing" />
        <Route element={<SettlementContentPage />} path="services/settlement" />

        <Route element={<Navigate replace to="/marketplace/data" />} path="marketplace/content" />
        <Route element={<MarketplaceDataContentPage />} path="marketplace/data" />
        <Route element={<MarketplaceToolsContentPage />} path="marketplace/tools" />
        <Route element={<Navigate replace to="/marketplace/tools" />} path="marketplace/models" />
        <Route element={<MarketplaceComputeContentPage />} path="marketplace/compute" />
        <Route element={<Navigate replace to="/marketplace/tools" />} path="marketplace/api" />
        <Route element={<Navigate replace to="/marketplace/tools" />} path="marketplace/mcp" />
        <Route element={<Navigate replace to="/marketplace/tools" />} path="marketplace/items" />

        <Route element={<FeedbacksPage />} path="feedback/list" />
        <Route element={<OpcApplicationsPage />} path="application/list" />
        <Route element={<CommunityJoinApplicationsPage />} path="application/community-join" />
        <Route element={<TrustedDataspaceRegistrationsPage />} path="application/trusted-data-space" />
        <Route element={<BillingProductsPage />} path="billing/products" />
        <Route element={<BillingOrdersPage />} path="billing/orders" />
        <Route element={<BillingReconciliationsPage />} path="billing/reconciliations" />
        <Route element={<BillingConsumptionImportsPage />} path="billing/consumption-imports" />
        <Route element={<BillingConsumptionsPage />} path="billing/consumptions" />
        <Route element={<BillingBalancesPage />} path="billing/balances" />
        <Route element={<BillingWalletRechargesPage />} path="billing/wallet-recharges" />
        <Route element={<BillingWalletLedgerPage />} path="billing/wallet-ledger" />

        <Route element={<Navigate replace to="/home/overview" />} path="settings/dashboard" />
        <Route element={<SiteSettingsPage />} path="settings/site" />
        <Route element={<SiteUsersPage />} path="settings/site-users" />

        <Route element={<Navigate replace to="/home/overview" />} path="dashboard" />
        <Route element={<Navigate replace to="/settings/site-users" />} path="users/site-users" />
        <Route element={<Navigate replace to="/settings/site" />} path="content/site-settings" />
        <Route element={<Navigate replace to="/home/banners" />} path="content/banners" />
        <Route element={<Navigate replace to="/news/articles" />} path="content/articles" />
        <Route element={<Navigate replace to="/home/service-entries" />} path="content/home-services" />
        <Route element={<Navigate replace to="/marketplace/data" />} path="content/resource-categories" />
        <Route element={<Navigate replace to="/marketplace/items" />} path="content/resource-items" />
        <Route element={<Navigate replace to="/feedback/list" />} path="content/feedbacks" />
        <Route element={<Navigate replace to="/home/overview" />} path="content/home-sections" />
        <Route element={<Navigate replace to="/home/overview" />} path="content/page-sections/home" />
        <Route element={<Navigate replace to="/news/articles" />} path="content/page-sections/news" />
        <Route element={<Navigate replace to="/community/content" />} path="content/page-sections/community" />
        <Route element={<Navigate replace to="/services/content" />} path="content/page-sections/services" />
        <Route element={<Navigate replace to="/services/content" />} path="content/page-sections/setup" />
        <Route element={<Navigate replace to="/services/financing" />} path="content/page-sections/financing" />
        <Route element={<Navigate replace to="/services/settlement" />} path="content/page-sections/settlement" />
        <Route element={<Navigate replace to="/marketplace/content" />} path="content/page-sections/marketplace" />
        <Route element={<Navigate replace to="/marketplace/api" />} path="content/page-sections/api_market" />
        <Route element={<Navigate replace to="/marketplace/mcp" />} path="content/page-sections/mcp_market" />
        <Route element={<PageSectionsPage />} path="content/page-sections/:pageKey" />
      </Route>
      <Route
        element={
          <div className="login-page">
            <Result status="404" subTitle="页面不存在" title="404" />
          </div>
        }
        path="*"
      />
    </Routes>
  );
}
