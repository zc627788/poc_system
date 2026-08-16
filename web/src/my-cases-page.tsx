"use client";

import { ChevronLeft, ChevronRight, FolderOpen, Loader2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { MyCaseCard } from "@/components/my-case-card";
import { bridgeTestSiteUser, fetchMyOpcApplicationDetail, fetchMyOpcApplications, getCachedSiteUser, getSiteAuthToken, onSiteAuthChange } from "@/lib/site-auth";
import type { OpcApplicationDetailResponse, OpcApplicationListItem, SiteUserProfile } from "@/types";

type LoadState = "idle" | "loading" | "success" | "error";
const pageSize = 10;

function Empty({ title, description, actionHref, actionText }: { title: string; description: string; actionHref?: string; actionText?: string }) {
  return (
    <div className="rounded-[28px] border border-dashed border-[#C9D8F2] bg-white px-6 py-14 text-center shadow-sm">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#EEF4FF] text-[#0052D9]"><FolderOpen size={24} /></div>
      <h3 className="mt-5 text-[22px] font-bold text-slate-900">{title}</h3>
      <p className="mx-auto mt-3 max-w-[560px] text-[14px] leading-7 text-slate-500">{description}</p>
      {actionHref && actionText ? <Link className="mt-6 inline-flex h-[44px] items-center rounded-[16px] bg-[#0052D9] px-6 text-[14px] font-semibold text-white" href={actionHref}>{actionText}</Link> : null}
    </div>
  );
}

export function MyCasesPageView() {
  const [isHydrated, setIsHydrated] = useState(false);
  const [currentUser, setCurrentUser] = useState<SiteUserProfile | null>(null);
  const loginHref = `/login?return_to=${encodeURIComponent("/personal-center/my-cases")}`;
  const hasAuthToken = isHydrated ? Boolean(getSiteAuthToken()) : false;
  const [listState, setListState] = useState<LoadState>("idle");
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<OpcApplicationListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [detailMap, setDetailMap] = useState<Record<number, OpcApplicationDetailResponse>>({});
  const [detailLoadingId, setDetailLoadingId] = useState<number | null>(null);
  const [bridgeState, setBridgeState] = useState<LoadState>("idle");
  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total]);

  useEffect(() => {
    setCurrentUser(getCachedSiteUser());
    setIsHydrated(true);
    return onSiteAuthChange(() => setCurrentUser(getCachedSiteUser()));
  }, []);

  useEffect(() => {
    if (!isHydrated || !currentUser || hasAuthToken) {
      if (hasAuthToken) {
        setBridgeState("success");
      }
      return;
    }

    if ((currentUser.auth_source || "").toLowerCase() !== "ixiamen") {
      setBridgeState("idle");
      return;
    }

    if (bridgeState === "loading" || bridgeState === "success") {
      return;
    }

    setBridgeState("loading");
    setError("");
    void bridgeTestSiteUser(currentUser)
      .then(() => {
        setBridgeState("success");
      })
      .catch((e) => {
        setBridgeState("error");
        setError(e instanceof Error ? e.message : "测试环境登录态补发失败，请重新统一认证。");
      });
  }, [bridgeState, currentUser, hasAuthToken, isHydrated]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    if (!currentUser || !hasAuthToken) {
      setItems([]);
      setTotal(0);
      setExpandedId(null);
      setDetailMap({});
      setListState("idle");
      return;
    }

    setListState("loading");
    setError("");
    void fetchMyOpcApplications(page, pageSize)
      .then((result) => {
        setItems(result.items);
        setTotal(result.total);
        setListState("success");
        setExpandedId((prev) => (prev && result.items.some((item) => item.id === prev) ? prev : null));
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : "我的办件加载失败，请稍后重试。");
        setListState("error");
      });
  }, [currentUser, hasAuthToken, isHydrated, page]);

  const handleToggle = (id: number) => {
    const nextExpanded = expandedId === id ? null : id;
    setExpandedId(nextExpanded);

    if (nextExpanded && !detailMap[nextExpanded]) {
      setDetailLoadingId(nextExpanded);
      void fetchMyOpcApplicationDetail(nextExpanded)
        .then((result) => {
          setDetailMap((prev) => ({ ...prev, [nextExpanded]: result }));
        })
        .catch((e) => {
          setError(e instanceof Error ? e.message : "办件详情加载失败，请稍后重试。");
        })
        .finally(() => {
          setDetailLoadingId((prev) => (prev === nextExpanded ? null : prev));
        });
    }
  };

  if (!isHydrated) {
    return <div className="min-h-full bg-[#f5f7fa] pb-16"><div className="container mx-auto px-4 py-14"><div className="flex min-h-[240px] items-center justify-center rounded-[24px] bg-white text-slate-500 shadow-sm"><Loader2 className="mr-2 animate-spin" size={18} />正在加载我的办件...</div></div></div>;
  }

  if (!currentUser) {
    return <div className="min-h-full bg-[#f5f7fa] pb-16"><div className="container mx-auto px-4 py-14"><Empty title="请先登录后查看我的办件" description="登录后即可查看 OPC 工商注册资料登记的提交记录、审核状态和不通过原因。" actionHref={loginHref} actionText="前往统一认证登录" /></div></div>;
  }

  if (!hasAuthToken && bridgeState === "loading") {
    return <div className="min-h-full bg-[#f5f7fa] pb-16"><div className="container mx-auto px-4 py-14"><div className="flex min-h-[240px] items-center justify-center rounded-[24px] bg-white text-slate-500 shadow-sm"><Loader2 className="mr-2 animate-spin" size={18} />正在校验测试环境登录态...</div></div></div>;
  }

  if (!hasAuthToken) {
    return (
      <div className="min-h-full bg-[#f5f7fa] pb-16">
        <div className="container mx-auto px-4 py-14">
          <Empty
            title="当前登录态未完成"
            description="当前浏览器仅缓存了基础用户信息，未拿到本站访问凭证，暂时无法查询我的办件。请重新完成一次统一认证登录后再查看。"
            actionHref={loginHref}
            actionText="重新统一认证"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-[#f5f7fa] pb-16">
      <section className="relative mb-8 overflow-hidden border-b border-[#eaf0fb] bg-[#f8fbff]">
        <div className="container mx-auto px-4">
          <div className="grid min-h-[134px] items-center gap-6 py-[3.75rem] md:grid-cols-[minmax(0,1fr)_240px]">
            <div className="min-w-0">
              <h1 className="text-[32px] font-black tracking-[0.01em] text-[#111111] sm:text-[36px]">我的办件</h1>
              <p className="mt-4 whitespace-nowrap text-[15px] font-medium leading-7 text-[#5b6b82]">实时追踪申办事项的审核节点，掌握审核进展</p>
            </div>
            <div className="hidden md:block" />
          </div>
        </div>
      </section>

      <div className="container mx-auto flex-1 px-4">
        <div className="mb-8 flex items-center gap-2 text-[13px] font-medium text-gray-500">
          <Link className="transition-colors hover:text-[#0052d9]" href="/">
            首页
          </Link>
          <ChevronRight size={14} />
          <span className="text-[#0052d9]">个人办件</span>
        </div>

        {error && listState === "error" ? <div className="mb-6 rounded-[20px] border border-[#FECACA] bg-[#FEF2F2] px-5 py-4 text-[14px] text-[#B42318]">{error}</div> : null}

        {listState === "loading" ? <div className="flex min-h-[240px] items-center justify-center rounded-[24px] bg-white text-slate-500 shadow-sm"><Loader2 className="mr-2 animate-spin" size={18} />正在加载办件列表...</div> : items.length === 0 ? <Empty title="暂无办件记录" description="当前还没有提交过 OPC 工商注册资料登记，可先前往创业服务页面完成申请。" actionHref="/setup" actionText="前往 OPC 工商注册" /> : <div className="space-y-5">{items.map((item) => <MyCaseCard detail={detailMap[item.id]} expanded={expandedId === item.id} item={item} key={item.id} loading={detailLoadingId === item.id} onToggle={handleToggle} />)}</div>}

        {items.length > 0 ? <div className="mt-6 flex items-center justify-between text-[13px] text-slate-500"><button className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-2 disabled:cursor-not-allowed disabled:opacity-50" disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))} type="button"><ChevronLeft size={14} />上一页</button><span>第 {page} / {totalPages} 页</span><button className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-2 disabled:cursor-not-allowed disabled:opacity-50" disabled={page >= totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))} type="button">下一页<ChevronRight size={14} /></button></div> : null}
      </div>
    </div>
  );
}
