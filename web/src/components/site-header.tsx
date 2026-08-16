"use client";

import { FileText, LogOut, Menu, ReceiptText, ShoppingBag, User, UserPlus, WalletCards, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ScrollToTopLink } from "@/components/scroll-to-top-link";
import {
  buildIxiaMenLogoutUrl,
  clearSiteAuth,
  fetchCurrentSiteUser,
  getCachedSiteUser,
  onSiteAuthChange,
  redirectToIxiaMenLogin,
} from "@/lib/site-auth";
import type { NavigationItem, SiteSettings, SiteUserProfile } from "@/types";

const fallbackLogoUrl = "/site-logo-opc-community.png";
const legacyLogoMap: Record<string, string> = {
  "/opc-community-mark.png": fallbackLogoUrl,
  "/site-header-opc-logo.png": fallbackLogoUrl,
};

function shouldShowNavigationItem(item: Pick<NavigationItem, "label" | "path" | "target_value">) {
  return item.label !== "最新动态" && item.path !== "/news" && item.target_value !== "/news";
}

function resolveLogoUrl(logoUrl?: string | null) {
  if (!logoUrl || logoUrl.startsWith("/prototype-assets/")) return fallbackLogoUrl;
  return legacyLogoMap[logoUrl] || logoUrl;
}

function isPathInSection(pathname: string | null, href: string) {
  if (!pathname) return false;
  if (pathname === href) return true;
  if (href === "/services" && (pathname === "/setup" || pathname.startsWith("/setup/"))) return true;
  return href !== "/" && pathname.startsWith(`${href}/`);
}

export function SiteHeader({ navigation, siteSettings }: { navigation: NavigationItem[]; siteSettings: SiteSettings }) {
  const pathname = usePathname();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<SiteUserProfile | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [logoUrl, setLogoUrl] = useState(resolveLogoUrl(siteSettings.logo_url));
  const navigationItems = [...navigation].sort((a, b) => a.sort_order - b.sort_order);
  const visibleNavigationItems = navigationItems.filter(shouldShowNavigationItem);

  useEffect(() => setLogoUrl(resolveLogoUrl(siteSettings.logo_url)), [siteSettings.logo_url]);
  useEffect(() => {
    const syncCurrentUser = () => {
      const cachedUser = getCachedSiteUser();
      setCurrentUser(cachedUser);
      void fetchCurrentSiteUser()
        .then((profile) => {
          setCurrentUser(profile);
        })
        .catch(() => {
          setCurrentUser(null);
        });
    };
    syncCurrentUser();
    return onSiteAuthChange(syncCurrentUser);
  }, []);
  useEffect(() => setMobileMenuOpen(false), [pathname]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const previousOverflow = document.body.style.overflow;
    if (mobileMenuOpen) document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previousOverflow; };
  }, [mobileMenuOpen]);

  const handleLogout = () => {
    clearSiteAuth();
    setMobileMenuOpen(false);
    if (currentUser?.auth_source === "ixiamen" && typeof window !== "undefined") {
      window.location.href = buildIxiaMenLogoutUrl();
      return;
    }
    router.push("/");
    router.refresh();
  };

  const handleLogin = () => {
    setMobileMenuOpen(false);
    redirectToIxiaMenLogin(pathname || "/");
  };

  return (
    <>
      <header className="fixed left-0 right-0 top-0 z-50 flex h-[60px] items-center bg-[#0052FF] text-white shadow-[0_10px_30px_rgba(0,48,155,0.18)] backdrop-blur-[12px]">
        <div className="flex h-full w-full items-center justify-between px-4 sm:px-6 lg:px-[clamp(118px,6.145833vw,180px)]">
          <ScrollToTopLink className="flex h-full min-w-0 items-center" href="/">
            <img alt="OPC社区标识" className="h-[34px] w-auto shrink-0 sm:h-[40px] lg:h-[44px]" src={logoUrl || fallbackLogoUrl} />
          </ScrollToTopLink>

          <nav className="hidden h-full gap-8 lg:gap-14 xl:flex">
            {visibleNavigationItems.map((item) => {
              const href = item.target_value || item.path;
              const isExternal = item.target_type === "external";
              const isActive = !isExternal && isPathInSection(pathname, href);
              const className = `relative flex h-full items-center px-0 text-[13px] font-medium transition-colors lg:text-[14px] ${isActive ? "text-white" : "text-white/78 hover:text-white"}`;
              const labelNode = <span className="relative inline-flex items-center leading-none"><span>{item.label}</span>{isActive ? <span className="absolute left-1/2 top-[calc(100%+10px)] h-[4px] w-[15px] -translate-x-1/2 rounded-full bg-[#BEEC00]" /> : null}</span>;
              return isExternal ? <a key={href || item.path} className={className} href={href} rel="noopener noreferrer" target="_blank">{labelNode}</a> : <ScrollToTopLink key={href || item.path} className={className} href={href}>{labelNode}</ScrollToTopLink>;
            })}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            {currentUser ? (
              <div className="group relative block">
                <div className="flex cursor-pointer items-center gap-1.5 rounded-full border border-white/18 bg-white/8 px-2 py-0.5 sm:px-2 sm:py-0.5"><div className="flex h-5 w-5 items-center justify-center rounded-full bg-white/15 text-white"><User size={12} strokeWidth={2.2} /></div><div className="max-w-[72px] sm:max-w-[100px]"><div className="truncate text-[10px] font-semibold text-white sm:text-[11px]">{currentUser.name}</div></div></div>
                <div className="invisible absolute right-0 top-full z-50 min-w-[200px] pt-2 opacity-0 transition-all duration-200 group-hover:visible group-hover:opacity-100">
                  <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white py-2 shadow-lg">
                    <div className="border-b border-gray-100 px-4 py-3 text-[12px] text-gray-500">当前已登录门户用户</div>
                    <ScrollToTopLink className="flex items-center gap-2 px-4 py-3 text-left text-[14px] text-gray-700 transition-colors hover:bg-[#F5F9FF] hover:text-[#0052D9]" href="/products"><ShoppingBag size={16} />商品选购</ScrollToTopLink>
                    <ScrollToTopLink className="flex items-center gap-2 px-4 py-3 text-left text-[14px] text-gray-700 transition-colors hover:bg-[#F5F9FF] hover:text-[#0052D9]" href="/my/orders"><ReceiptText size={16} />我的订单</ScrollToTopLink>
                    <ScrollToTopLink className="flex items-center gap-2 px-4 py-3 text-left text-[14px] text-gray-700 transition-colors hover:bg-[#F5F9FF] hover:text-[#0052D9]" href="/my/balances"><WalletCards size={16} />钱包中心</ScrollToTopLink>
                    <ScrollToTopLink className="flex items-center gap-2 px-4 py-3 text-left text-[14px] text-gray-700 transition-colors hover:bg-[#F5F9FF] hover:text-[#0052D9]" href="/personal-center/my-cases"><FileText size={16} />我的办件</ScrollToTopLink>
                    <button className="flex w-full items-center gap-2 px-4 py-3 text-left text-[14px] text-gray-700 transition-colors hover:bg-red-50 hover:text-red-500" onClick={handleLogout} type="button"><LogOut size={16} />退出登录</button>
                  </div>
                </div>
              </div>
            ) : <button className="inline-flex h-[34px] min-w-[88px] items-center justify-center rounded-[67px] bg-[#BEEC00] px-4 text-[12px] font-medium leading-none text-black transition-opacity hover:opacity-90 sm:h-[39px] sm:min-w-[104px] sm:text-[14px]" onClick={handleLogin} type="button">登录</button>}
            <button aria-label={mobileMenuOpen ? "关闭导航" : "打开导航"} className="inline-flex h-[34px] w-[34px] items-center justify-center rounded-full border border-white bg-transparent text-white transition-opacity hover:opacity-80 sm:h-[39px] sm:w-[39px] xl:hidden" onClick={() => setMobileMenuOpen((value) => !value)} type="button">{mobileMenuOpen ? <X size={16} /> : <Menu size={16} />}</button>
          </div>
        </div>
      </header>

      <div className={`fixed inset-0 z-[70] xl:hidden ${mobileMenuOpen ? "pointer-events-auto" : "pointer-events-none"}`}>
        <div className={`absolute inset-0 bg-slate-950/36 transition-opacity duration-300 ${mobileMenuOpen ? "opacity-100" : "opacity-0"}`} onClick={() => setMobileMenuOpen(false)} />
        <aside className={`absolute right-0 top-0 flex h-full w-[84%] max-w-[360px] flex-col bg-[linear-gradient(180deg,#0052d9_0%,#0c60ea_28%,#f7faff_28%,#f7faff_100%)] shadow-2xl transition-transform duration-300 ${mobileMenuOpen ? "translate-x-0" : "translate-x-full"}`}>
          <div className="px-5 pb-5 pt-5 text-white">
            <div className="flex items-start justify-between gap-4"><div><div className="text-[12px] font-semibold tracking-[0.24em] text-white/70">MOBILE NAV</div><div className="mt-2 text-[24px] font-bold leading-tight">站点导航</div></div><button aria-label="关闭菜单" className="flex h-10 w-10 items-center justify-center rounded-full border border-white/18 bg-white/10" onClick={() => setMobileMenuOpen(false)} type="button"><X size={18} /></button></div>
        <div className="mt-5 rounded-3xl border border-white/16 bg-white/10 p-4">{currentUser ? <div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/14"><User size={20} /></div><div className="min-w-0"><div className="truncate text-[15px] font-semibold">{currentUser.name}</div><div className="truncate text-[12px] text-white/72">{currentUser.mobile_fuzzy || currentUser.phone}</div></div></div> : <div><div className="text-[15px] font-semibold">欢迎访问 OPC 门户</div><div className="mt-1 text-[12px] leading-5 text-white/72">通过统一身份认证登录后，可直接使用创业服务、资源集市、联系我们等门户业务功能。</div></div>}</div>
          </div>
          <div className="flex-1 overflow-y-auto rounded-t-[28px] bg-[#f7faff] px-4 pb-6 pt-5">
            <div className="space-y-2">{visibleNavigationItems.map((item) => { const href = item.target_value || item.path; const isExternal = item.target_type === "external"; const isActive = !isExternal && isPathInSection(pathname, href); const className = `flex items-center justify-between rounded-2xl px-4 py-3 text-[15px] font-semibold transition-colors ${isActive ? "bg-[#e8f0ff] text-[#0052d9]" : "bg-white text-[#1e293b] hover:bg-[#eff4ff]"}`; return isExternal ? <a key={href || item.path} className={className} href={href} rel="noopener noreferrer" target="_blank"><span>{item.label}</span><span className="text-[12px] text-slate-400">打开</span></a> : <ScrollToTopLink key={href || item.path} className={className} href={href}><span>{item.label}</span><span className="text-[12px] text-slate-400">{isActive ? "当前" : "进入"}</span></ScrollToTopLink>; })}</div>
            <div className="mt-6 rounded-3xl border border-[#e5edf8] bg-white p-4">{currentUser ? <div className="grid gap-3"><ScrollToTopLink className="flex items-center justify-center gap-2 rounded-2xl border border-[#D9E5FF] px-4 py-3 text-[14px] font-semibold text-[#0052D9] transition-colors hover:bg-[#F5F9FF]" href="/products"><ShoppingBag size={16} />商品选购</ScrollToTopLink><ScrollToTopLink className="flex items-center justify-center gap-2 rounded-2xl border border-[#D9E5FF] px-4 py-3 text-[14px] font-semibold text-[#0052D9] transition-colors hover:bg-[#F5F9FF]" href="/my/orders"><ReceiptText size={16} />我的订单</ScrollToTopLink><ScrollToTopLink className="flex items-center justify-center gap-2 rounded-2xl border border-[#D9E5FF] px-4 py-3 text-[14px] font-semibold text-[#0052D9] transition-colors hover:bg-[#F5F9FF]" href="/my/balances"><WalletCards size={16} />钱包中心</ScrollToTopLink><ScrollToTopLink className="flex items-center justify-center gap-2 rounded-2xl border border-[#D9E5FF] px-4 py-3 text-[14px] font-semibold text-[#0052D9] transition-colors hover:bg-[#F5F9FF]" href="/personal-center/my-cases"><FileText size={16} />我的办件</ScrollToTopLink><button className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#0f172a] px-4 py-3 text-[14px] font-semibold text-white transition-colors hover:bg-[#020617]" onClick={handleLogout} type="button"><LogOut size={16} />退出当前账户</button></div> : <div className="grid gap-3"><button className="flex items-center justify-center gap-2 rounded-2xl bg-[#0052d9] px-4 py-3 text-[14px] font-semibold text-white transition-colors hover:bg-[#0046bb]" onClick={handleLogin} type="button"><UserPlus size={16} />登录</button></div>}</div>
          </div>
        </aside>
      </div>
    </>
  );
}
