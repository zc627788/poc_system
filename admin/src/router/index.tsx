import type { ReactElement } from "react";
import { Result } from "antd";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { getToken } from "../api";
import { AdminLayout } from "../components/AdminLayout";
import { ArticlesPage } from "../pages/ArticlesPage";
import { BannersPage } from "../pages/BannersPage";
import { DashboardPage } from "../pages/DashboardPage";
import { FeedbacksPage } from "../pages/FeedbacksPage";
import { HomeServicesPage } from "../pages/HomeServicesPage";
import { LoginPage } from "../pages/LoginPage";
import { PageSectionsPage } from "../pages/HomeSectionsPage";
import { ResourceCategoriesPage } from "../pages/ResourceCategoriesPage";
import { ResourceItemsPage } from "../pages/ResourceItemsPage";
import { SiteSettingsPage } from "../pages/SiteSettingsPage";
import { SiteUsersPage } from "../pages/SiteUsersPage";

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
        <Route element={<Navigate replace to="/dashboard" />} index />
        <Route element={<DashboardPage />} path="dashboard" />
        <Route element={<SiteUsersPage />} path="users/site-users" />
        <Route element={<SiteSettingsPage />} path="content/site-settings" />
        <Route element={<BannersPage />} path="content/banners" />
        <Route element={<ArticlesPage />} path="content/articles" />
        <Route element={<HomeServicesPage />} path="content/home-services" />
        <Route element={<ResourceCategoriesPage />} path="content/resource-categories" />
        <Route element={<ResourceItemsPage />} path="content/resource-items" />
        <Route element={<FeedbacksPage />} path="content/feedbacks" />
        <Route element={<Navigate replace to="/content/page-sections/home" />} path="content/home-sections" />
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
