"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  buildIxiaMenLoginStartUrl,
  clearSiteAuth,
  fetchCurrentSiteUser,
  getSiteAuthToken,
  saveSiteAuth,
  saveSiteAuthToken,
} from "@/lib/site-auth";

type AuthMessage = {
  type: "error" | "success";
  text: string;
};

function normalizeReturnTo(value?: string | null) {
  const normalized = (value || "").trim();
  if (!normalized || !normalized.startsWith("/") || normalized.startsWith("//")) {
    return "/";
  }
  return normalized;
}

function getHashToken() {
  if (typeof window === "undefined") {
    return "";
  }

  const hash = window.location.hash.startsWith("#") ? window.location.hash.slice(1) : window.location.hash;
  const token = new URLSearchParams(hash).get("token") || "";
  console.log("[auth-pages] getHashToken: hash=", hash, "token=", token ? `${token.slice(0, 20)}...` : "empty");
  return token;
}

function parseJwtToken(token: string): { sub: string; exp: number; role: string; phone: string; name: string } | null {
  try {
    const payload = token.split(".")[1];
    const decoded = JSON.parse(atob(payload));
    return decoded;
  } catch {
    return null;
  }
}

function replaceLoginUrl(returnTo: string) {
  if (typeof window === "undefined") {
    return;
  }

  const url = new URL(window.location.href);
  url.searchParams.delete("mode");
  url.searchParams.delete("error");
  url.hash = "";
  const nextUrl = returnTo && returnTo !== "/" ? `/login?return_to=${encodeURIComponent(returnTo)}` : "/login";
  console.log("[auth-pages] replaceLoginUrl: current URL=", window.location.href, "next URL=", nextUrl);
  window.history.replaceState(null, "", nextUrl);
}

function MessageBar({ message }: { message: AuthMessage | null }) {
  if (!message) {
    return null;
  }

  return (
    <div
      className={`rounded-2xl border px-4 py-3 text-[13px] leading-6 ${
        message.type === "success"
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-rose-200 bg-rose-50 text-rose-600"
      }`}
    >
      {message.text}
    </div>
  );
}

function AuthShell({
  title,
  description,
  buttonText,
  helperText,
  returnTo,
  message,
  submitting,
  onStart,
}: {
  title: string;
  description: string;
  buttonText: string;
  helperText: string;
  returnTo: string;
  message: AuthMessage | null;
  submitting: boolean;
  onStart: () => void;
}) {
  return (
    <div className="min-h-full bg-[linear-gradient(180deg,#f3f7ff_0%,#f7faff_100%)]">
      <section className="relative overflow-hidden px-4 py-16 sm:py-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(0,82,217,0.14),transparent_42%),radial-gradient(circle_at_80%_20%,rgba(0,82,217,0.08),transparent_24%)]" />
        <div className="relative mx-auto max-w-[560px]">
          <div className="rounded-[32px] border border-[#dce8fb] bg-white p-8 shadow-[0_24px_80px_rgba(15,23,42,0.10)] sm:p-10">
            <h1 className="text-[32px] font-black leading-tight text-[#0f172a] sm:text-[38px]">{title}</h1>

            <div className="mt-6 rounded-[22px] bg-[#f7faff] px-5 py-4 text-[14px] leading-7 text-[#5b6b82]">
              {description}
            </div>

            <div className="mt-6">
              <MessageBar message={message} />
            </div>

            <button
              className="mt-6 inline-flex h-[52px] w-full items-center justify-center gap-2 rounded-[18px] bg-[#0052d9] px-6 text-[15px] font-semibold text-white transition-colors hover:bg-[#0046bb] disabled:cursor-not-allowed disabled:opacity-60"
              disabled={submitting}
              onClick={onStart}
              type="button"
            >
              {submitting ? "正在进入..." : buttonText}
              <ArrowRight size={16} />
            </button>

            <p className="mt-4 text-[13px] leading-6 text-[#6b7b92]">
              {returnTo === "/" ? "登录完成后将自动返回门户首页。" : "登录完成后将自动返回你当前访问的页面。"}
            </p>

            <div className="mt-8 border-t border-[#e8eef8] pt-5 text-[13px] leading-6 text-[#7a8aa2]">
              <div>{helperText}</div>
              <div className="mt-2">
                <Link className="font-semibold text-[#0052d9]" href="/">
                  返回首页
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function useSsoFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const handledCallback = useRef(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<AuthMessage | null>(null);

  const returnTo = normalizeReturnTo(searchParams.get("return_to"));
  const mode = searchParams.get("mode");
  const callbackError = searchParams.get("error");

  useEffect(() => {
    // 提前获取当前本地的 Token 状态快照
    const localToken = getSiteAuthToken();

    // 1. 非 callback 模式，如果有 token 则直接跳转到 returnTo
    if (mode !== "callback") {
      if (localToken) {
        router.replace(returnTo);
      }
      return;
    }

    // 2. callback 模式，严格限制单次执行
    if (handledCallback.current) {
      return;
    }
    handledCallback.current = true;

    setSubmitting(true);
    setMessage(null);

    const finishWithError = (text: string) => {
      console.log("[auth-pages] finishWithError:", text);
      // 【修复点 1】只有本地确实没有有效 Token 时，才彻底清空。防止二次并发误杀已写入的 Token
      if (!getSiteAuthToken()) {
        clearSiteAuth();
      }
      setSubmitting(false);
      setMessage({ type: "error", text });

      // 【修复点 2】使用对 Next.js 友好的路由清洗，替代原生的 replaceState
      const nextUrl = returnTo && returnTo !== "/" ? `/login?return_to=${encodeURIComponent(returnTo)}` : "/login";
      router.replace(nextUrl);
    };

    // 检查错误
    if (callbackError) {
      finishWithError(callbackError);
      return;
    }

    // 从 hash 获取 token
    const tokenFromHash = getHashToken();
    if (!tokenFromHash) {
      // 【修复点 3】核心容错：如果 Hash 里的已被清洗，但本地已经存好了 Token，说明前一次尝试已成功，直接安全跳走
      if (localToken) {
        console.log("[auth-pages] Hash token empty, but local token exists. Presuming success, redirecting...");
        router.replace(returnTo);
        setSubmitting(false);
        return;
      }
      finishWithError("登录未返回有效凭证，请稍后重试。");
      return;
    }

    // 解析 token 获取 user 信息
    const decoded = parseJwtToken(tokenFromHash);
    if (!decoded) {
      finishWithError("Token 解析失败，请稍后重试。");
      return;
    }

    // 构造 user 对象
    const user = {
      id: parseInt(decoded.sub),
      name: decoded.name,
      phone: decoded.phone,
      auth_source: "ixiamen",
      status: 1,
      created_at: new Date().toISOString(),
    };

    // 一次性保存 token 和 user
    saveSiteAuth({
      access_token: tokenFromHash,
      token_type: "Bearer",
      expires_in: 3600,
      user,
    });

    setMessage({ type: "success", text: "登录成功，正在进入门户..." });

    // 【修复点 4】直接使用 Next.js 自身的 router 体系切走，它在改变 URL 的同时会自动清理 Hash 并防止树震荡
    router.replace(returnTo);
    setSubmitting(false);
  }, [mode, returnTo, callbackError, router]);

  const startLogin = () => {
    setSubmitting(true);
    setMessage(null);
    try {
      if (typeof window !== "undefined") {
        window.location.assign(buildIxiaMenLoginStartUrl(returnTo));
      }
    } catch (error) {
      setSubmitting(false);
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "登录地址生成失败，请检查环境配置。",
      });
    }
  };

  return {
    mode,
    message,
    returnTo,
    startLogin,
    submitting,
  };
}

export function LoginPageView() {
  const { mode, message, returnTo, startLogin, submitting } = useSsoFlow();

  useEffect(() => {
    if (mode !== "callback") {
      startLogin();
    }
  }, [mode, startLogin]);

  if (mode !== "callback") {
    return <div className="min-h-full bg-[linear-gradient(180deg,#f3f7ff_0%,#f7faff_100%)]" />;
  }

  return (
    <AuthShell
      buttonText={message?.type === "error" ? "重新登录" : "处理中"}
      description={message?.type === "error" ? "统一认证未完成，请重新发起登录。" : "统一认证结果处理中，请稍候。"}
      helperText="完成统一认证后，系统会自动回到当前页面。"
      message={message}
      onStart={startLogin}
      returnTo={returnTo}
      submitting={submitting && !message}
      title={message?.type === "error" ? "登录失败" : "登录结果"}
    />
  );
}

export function RegisterPageView() {
  const { mode, message, returnTo, startLogin, submitting } = useSsoFlow();

  useEffect(() => {
    if (mode !== "callback") {
      startLogin();
    }
  }, [mode, startLogin]);

  if (mode !== "callback") {
    return <div className="min-h-full bg-[linear-gradient(180deg,#f3f7ff_0%,#f7faff_100%)]" />;
  }

  return (
    <AuthShell
      buttonText={message?.type === "error" ? "重新登录" : "处理中"}
      description={message?.type === "error" ? "统一认证未完成，请重新发起登录。" : "统一认证结果处理中，请稍候。"}
      helperText="完成统一认证后，系统会自动回到当前页面。"
      message={message}
      onStart={startLogin}
      returnTo={returnTo}
      submitting={submitting && !message}
      title={message?.type === "error" ? "登录失败" : "登录结果"}
    />
  );
}
