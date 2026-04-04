"use client";

import { LogOut, Menu, User, UserPlus, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { clearSiteAuth, fetchCurrentSiteUser, getCachedSiteUser, onSiteAuthChange } from "@/lib/site-auth";
import type { NavigationItem, SiteSettings, SiteUserProfile } from "@/types";

const primaryNav = [
  { path: "/", label: "首页" },
  { path: "/news", label: "最新动态" },
  { path: "/community", label: "社区简介" },
  { path: "/services", label: "创业服务" },
  { path: "/marketplace", label: "资源集市" },
  { path: "/feedback", label: "意见反馈" },
];

function resolveNavigationItem(navigation: NavigationItem[], path: string) {
  return navigation.find((item) => (item.target_value || item.path) === path || item.path === path);
}

export function SiteHeader({
  navigation,
  siteSettings,
}: {
  navigation: NavigationItem[];
  siteSettings: SiteSettings;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<SiteUserProfile | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const logoUrl = siteSettings.logo_url || "/prototype-assets/opc-logo.png";

  useEffect(() => {
    const syncCurrentUser = () => {
      const cachedUser = getCachedSiteUser();
      setCurrentUser(cachedUser);
      void fetchCurrentSiteUser()
        .then((profile) => setCurrentUser(profile))
        .catch(() => undefined);
    };

    syncCurrentUser();
    return onSiteAuthChange(syncCurrentUser);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileMenuOpen]);

  const handleLogout = () => {
    clearSiteAuth();
    setMobileMenuOpen(false);
    router.push("/");
    router.refresh();
  };

  return (
    <>
      <header className="sticky top-0 z-50 flex h-16 items-center bg-[#0052d9] text-white shadow-md">
        <div className="container mx-auto flex h-full items-center justify-between px-4">
          <Link className="flex min-w-0 h-full items-center gap-3 sm:gap-4" href="/">
            <img alt="OPC Portal" className="h-7 shrink-0 object-contain sm:h-8 md:h-9" src={logoUrl} />
            <div className="hidden h-5 w-[1px] shrink-0 bg-white/40 sm:block" />
            <div className="truncate text-sm font-bold tracking-wide sm:text-lg md:text-xl">OPC厦门·社区门户</div>
          </Link>

          <nav className="hidden h-full gap-8 md:flex">
            {primaryNav.map((item) => {
              const target = resolveNavigationItem(navigation, item.path);
              const href = target?.target_value || target?.path || item.path;
              const isExternal = target?.target_type === "external";
              const isActive = !isExternal && pathname === href;

              const className = `relative flex h-full items-center px-1 text-sm font-medium transition-colors ${
                isActive ? "text-white" : "text-white/80 hover:text-white"
              }`;

              return isExternal ? (
                <a key={item.path} className={className} href={href} rel="noopener noreferrer" target="_blank">
                  {item.label}
                  {isActive ? <span className="absolute bottom-0 left-0 h-[3px] w-full rounded-t-sm bg-white" /> : null}
                </a>
              ) : (
                <Link key={item.path} className={className} href={href}>
                  {item.label}
                  {isActive ? <span className="absolute bottom-0 left-0 h-[3px] w-full rounded-t-sm bg-white" /> : null}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            {currentUser ? (
              <div className="group relative hidden sm:block">
                <div className="flex cursor-pointer items-center gap-2.5 rounded-full border border-white/18 bg-white/8 px-3 py-1.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-white">
                    <User size={17} strokeWidth={2.2} />
                  </div>
                  <div className="max-w-[140px]">
                    <div className="truncate text-[14px] font-semibold text-white">{currentUser.name}</div>
                    <div className="truncate text-[11px] text-white/70">{currentUser.phone}</div>
                  </div>
                </div>

                <div className="invisible absolute right-0 top-full z-50 min-w-[180px] pt-2 opacity-0 transition-all duration-200 group-hover:visible group-hover:opacity-100">
                  <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white py-2 shadow-lg">
                    <div className="border-b border-gray-100 px-4 py-3 text-[12px] text-gray-500">当前已登录门户会员账户</div>
                    <button
                      className="flex w-full items-center gap-2 px-4 py-3 text-left text-[14px] text-gray-700 transition-colors hover:bg-red-50 hover:text-red-500"
                      onClick={handleLogout}
                      type="button"
                    >
                      <LogOut size={16} />
                      退出登录
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <Link
                  className="hidden rounded-full border border-white/25 px-4 py-2 text-[13px] font-semibold text-white/90 transition-colors hover:border-white/45 hover:text-white sm:inline-flex"
                  href="/login"
                >
                  登录
                </Link>
                <Link
                  className="hidden items-center gap-1 rounded-full bg-white px-4 py-2 text-[13px] font-semibold text-[#0052d9] transition-colors hover:bg-blue-50 sm:inline-flex"
                  href="/register"
                >
                  <UserPlus size={14} />
                  注册
                </Link>
              </>
            )}

            <button
              aria-label={mobileMenuOpen ? "关闭导航" : "打开导航"}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/8 text-white transition-colors hover:bg-white/12 md:hidden"
              onClick={() => setMobileMenuOpen((value) => !value)}
              type="button"
            >
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </header>

      <div
        className={`fixed inset-0 z-[70] md:hidden ${
          mobileMenuOpen ? "pointer-events-auto" : "pointer-events-none"
        }`}
      >
        <div
          className={`absolute inset-0 bg-slate-950/36 transition-opacity duration-300 ${
            mobileMenuOpen ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => setMobileMenuOpen(false)}
        />

        <aside
          className={`absolute right-0 top-0 flex h-full w-[84%] max-w-[360px] flex-col bg-[linear-gradient(180deg,#0052d9_0%,#0c60ea_28%,#f7faff_28%,#f7faff_100%)] shadow-2xl transition-transform duration-300 ${
            mobileMenuOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="px-5 pb-5 pt-5 text-white">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-[12px] font-semibold tracking-[0.24em] text-white/70">MOBILE NAV</div>
                <div className="mt-2 text-[24px] font-bold leading-tight">站点导航</div>
              </div>
              <button
                aria-label="关闭菜单"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/18 bg-white/10"
                onClick={() => setMobileMenuOpen(false)}
                type="button"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-5 rounded-3xl border border-white/16 bg-white/10 p-4">
              {currentUser ? (
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/14">
                    <User size={20} />
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-[15px] font-semibold">{currentUser.name}</div>
                    <div className="truncate text-[12px] text-white/72">{currentUser.phone}</div>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="text-[15px] font-semibold">欢迎访问 OPC 门户</div>
                  <div className="mt-1 text-[12px] leading-5 text-white/72">登录后可直接使用手机号提交反馈，并同步到后台用户管理。</div>
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto rounded-t-[28px] bg-[#f7faff] px-4 pb-6 pt-5">
            <div className="space-y-2">
              {primaryNav.map((item) => {
                const target = resolveNavigationItem(navigation, item.path);
                const href = target?.target_value || target?.path || item.path;
                const isExternal = target?.target_type === "external";
                const isActive = !isExternal && pathname === href;
                const className = `flex items-center justify-between rounded-2xl px-4 py-3 text-[15px] font-semibold transition-colors ${
                  isActive ? "bg-[#e8f0ff] text-[#0052d9]" : "bg-white text-[#1e293b] hover:bg-[#eff4ff]"
                }`;

                return isExternal ? (
                  <a
                    key={item.path}
                    className={className}
                    href={href}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    <span>{item.label}</span>
                    <span className="text-[12px] text-slate-400">打开</span>
                  </a>
                ) : (
                  <Link key={item.path} className={className} href={href}>
                    <span>{item.label}</span>
                    <span className="text-[12px] text-slate-400">{isActive ? "当前" : "进入"}</span>
                  </Link>
                );
              })}
            </div>

            <div className="mt-6 rounded-3xl border border-[#e5edf8] bg-white p-4">
              {currentUser ? (
                <button
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#0f172a] px-4 py-3 text-[14px] font-semibold text-white transition-colors hover:bg-[#020617]"
                  onClick={handleLogout}
                  type="button"
                >
                  <LogOut size={16} />
                  退出当前账户
                </button>
              ) : (
                <div className="grid gap-3">
                  <Link
                    className="flex items-center justify-center rounded-2xl border border-[#d8e5fa] px-4 py-3 text-[14px] font-semibold text-[#0052d9] transition-colors hover:bg-[#f7faff]"
                    href="/login"
                  >
                    登录门户账户
                  </Link>
                  <Link
                    className="flex items-center justify-center gap-2 rounded-2xl bg-[#0052d9] px-4 py-3 text-[14px] font-semibold text-white transition-colors hover:bg-[#0046bb]"
                    href="/register"
                  >
                    <UserPlus size={16} />
                    注册新账户
                  </Link>
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
