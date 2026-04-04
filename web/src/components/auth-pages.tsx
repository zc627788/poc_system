"use client";

import { ArrowRight, LockKeyhole, Phone, UserRound } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { clearSiteAuth, getCachedSiteUser, loginSiteUser, registerSiteUser } from "@/lib/site-auth";

type AuthMessage = {
  type: "error" | "success";
  text: string;
};

const phonePattern = /^1[3-9]\d{9}$/;
const passwordPattern = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d~!@#$%^&*()_+\-=[\]{}|;:'",.<>/?]{8,20}$/;

function AuthShell({
  badge,
  title,
  subtitle,
  formTitle,
  formDesc,
  children,
}: {
  badge: string;
  title: string;
  subtitle: string;
  formTitle: string;
  formDesc: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-full bg-[#f5f7fa] pb-16">
      <section className="relative overflow-hidden bg-gradient-to-r from-[#0052d9] via-[#1668f3] to-[#4b92f8] px-4 pb-16 pt-12">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_15%,rgba(255,255,255,0.16),transparent_26%),radial-gradient(circle_at_15%_85%,rgba(255,255,255,0.12),transparent_24%)]" />
        <div className="container relative mx-auto max-w-6xl">
          <div className="inline-flex rounded-full border border-white/25 bg-white/10 px-4 py-1 text-[12px] font-semibold tracking-[0.24em] text-white/90">
            {badge}
          </div>
          <h1 className="mt-5 text-[34px] font-bold leading-tight text-white">{title}</h1>
          <p className="mt-3 max-w-2xl text-[15px] leading-7 text-white/85">{subtitle}</p>
        </div>
      </section>

      <section className="container mx-auto max-w-6xl px-4 pt-8">
        <div className="mx-auto max-w-[620px] rounded-[30px] border border-[#e6edf8] bg-white p-7 shadow-[0_24px_80px_rgba(15,23,42,0.08)] md:p-9">
          <div className="mb-8 rounded-[24px] bg-[linear-gradient(135deg,#eef4ff_0%,#f8fbff_100%)] px-5 py-5">
            <div className="text-[12px] font-semibold uppercase tracking-[0.28em] text-[#7a8db2]">{badge}</div>
            <h2 className="mt-3 text-[30px] font-bold text-[#0f172a]">{formTitle}</h2>
            <p className="mt-2 text-[14px] leading-6 text-[#64748b]">{formDesc}</p>
          </div>

          {children}
        </div>
      </section>
    </div>
  );
}

function MessageBar({ message }: { message: AuthMessage | null }) {
  if (!message) {
    return null;
  }

  return (
    <div
      className={`rounded-2xl border px-4 py-3 text-[13px] ${
        message.type === "success"
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-rose-200 bg-rose-50 text-rose-600"
      }`}
    >
      {message.text}
    </div>
  );
}

export function LoginPageView() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<AuthMessage | null>(null);

  useEffect(() => {
    if (getCachedSiteUser()) {
      router.replace("/");
    }
  }, [router]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);

    if (!phonePattern.test(phone.trim())) {
      setMessage({ type: "error", text: "请输入合法的中国大陆手机号。" });
      return;
    }

    if (!password.trim()) {
      setMessage({ type: "error", text: "请输入登录密码。" });
      return;
    }

    setSubmitting(true);
    try {
      await loginSiteUser({ phone: phone.trim(), password: password.trim() });
      setMessage({ type: "success", text: "登录成功，正在返回首页。" });
      router.push("/");
      router.refresh();
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "登录失败，请检查手机号和密码。",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      badge="MEMBER LOGIN"
      formDesc="登录后可以直接使用当前手机号提交反馈，后台也能识别当前会员身份。"
      formTitle="欢迎回来"
      subtitle="使用已注册的手机号和密码登录，进入门户会员服务。"
      title="门户会员登录"
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        <label className="block">
          <span className="mb-2 block text-[13px] font-semibold text-[#334155]">手机号</span>
          <div className="flex items-center rounded-2xl border border-[#d7e2f1] bg-[#fbfdff] px-4 py-3">
            <Phone className="mr-3 text-[#7a8db2]" size={18} />
            <input
              className="w-full border-0 bg-transparent text-[14px] outline-none placeholder:text-[#94a3b8]"
              maxLength={11}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="请输入 11 位手机号"
              type="tel"
              value={phone}
            />
          </div>
        </label>

        <label className="block">
          <span className="mb-2 block text-[13px] font-semibold text-[#334155]">密码</span>
          <div className="flex items-center rounded-2xl border border-[#d7e2f1] bg-[#fbfdff] px-4 py-3">
            <LockKeyhole className="mr-3 text-[#7a8db2]" size={18} />
            <input
              className="w-full border-0 bg-transparent text-[14px] outline-none placeholder:text-[#94a3b8]"
              onChange={(event) => setPassword(event.target.value)}
              placeholder="请输入登录密码"
              type="password"
              value={password}
            />
          </div>
        </label>

        <MessageBar message={message} />

        <button
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#0052d9] px-6 py-3.5 text-[15px] font-semibold text-white transition-colors hover:bg-[#0046bb] disabled:cursor-not-allowed disabled:opacity-60"
          disabled={submitting}
          type="submit"
        >
          {submitting ? "登录中..." : "登录门户账户"}
          <ArrowRight size={16} />
        </button>
      </form>

      <div className="mt-6 text-[14px] text-[#64748b]">
        还没有账户？
        <Link className="ml-2 font-semibold text-[#0052d9]" href="/register">
          立即注册
        </Link>
      </div>
    </AuthShell>
  );
}

export function RegisterPageView() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<AuthMessage | null>(null);

  useEffect(() => {
    if (getCachedSiteUser()) {
      router.replace("/");
    }
  }, [router]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);

    if (name.trim().length < 2 || name.trim().length > 20) {
      setMessage({ type: "error", text: "姓名需控制在 2 到 20 个字符之间。" });
      return;
    }

    if (!phonePattern.test(phone.trim())) {
      setMessage({ type: "error", text: "请输入合法的中国大陆手机号。" });
      return;
    }

    if (!passwordPattern.test(password.trim())) {
      setMessage({ type: "error", text: "密码需为 8 到 20 位，并同时包含字母和数字。" });
      return;
    }

    if (password !== confirmPassword) {
      setMessage({ type: "error", text: "两次输入的密码不一致，请重新确认。" });
      return;
    }

    setSubmitting(true);
    try {
      clearSiteAuth();
      await registerSiteUser({
        name: name.trim(),
        phone: phone.trim(),
        password: password.trim(),
      });
      setMessage({ type: "success", text: "注册成功，正在进入首页。" });
      router.push("/");
      router.refresh();
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "注册失败，请稍后重试。",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      badge="MEMBER REGISTER"
      formDesc="使用手机号完成注册，无需短信验证码，注册成功后后台会同步生成用户记录。"
      formTitle="创建新会员"
      subtitle="完成注册后即可登录门户，并使用手机号作为统一身份信息。"
      title="注册门户账户"
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        <label className="block">
          <span className="mb-2 block text-[13px] font-semibold text-[#334155]">姓名</span>
          <div className="flex items-center rounded-2xl border border-[#d7e2f1] bg-[#fbfdff] px-4 py-3">
            <UserRound className="mr-3 text-[#7a8db2]" size={18} />
            <input
              className="w-full border-0 bg-transparent text-[14px] outline-none placeholder:text-[#94a3b8]"
              maxLength={20}
              onChange={(event) => setName(event.target.value)}
              placeholder="请输入姓名或昵称"
              type="text"
              value={name}
            />
          </div>
        </label>

        <label className="block">
          <span className="mb-2 block text-[13px] font-semibold text-[#334155]">手机号</span>
          <div className="flex items-center rounded-2xl border border-[#d7e2f1] bg-[#fbfdff] px-4 py-3">
            <Phone className="mr-3 text-[#7a8db2]" size={18} />
            <input
              className="w-full border-0 bg-transparent text-[14px] outline-none placeholder:text-[#94a3b8]"
              maxLength={11}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="请输入 11 位手机号"
              type="tel"
              value={phone}
            />
          </div>
        </label>

        <label className="block">
          <span className="mb-2 block text-[13px] font-semibold text-[#334155]">密码</span>
          <div className="flex items-center rounded-2xl border border-[#d7e2f1] bg-[#fbfdff] px-4 py-3">
            <LockKeyhole className="mr-3 text-[#7a8db2]" size={18} />
            <input
              className="w-full border-0 bg-transparent text-[14px] outline-none placeholder:text-[#94a3b8]"
              onChange={(event) => setPassword(event.target.value)}
              placeholder="8 到 20 位，需包含字母和数字"
              type="password"
              value={password}
            />
          </div>
        </label>

        <label className="block">
          <span className="mb-2 block text-[13px] font-semibold text-[#334155]">确认密码</span>
          <div className="flex items-center rounded-2xl border border-[#d7e2f1] bg-[#fbfdff] px-4 py-3">
            <LockKeyhole className="mr-3 text-[#7a8db2]" size={18} />
            <input
              className="w-full border-0 bg-transparent text-[14px] outline-none placeholder:text-[#94a3b8]"
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="请再次输入密码"
              type="password"
              value={confirmPassword}
            />
          </div>
        </label>

        <MessageBar message={message} />

        <button
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#0052d9] px-6 py-3.5 text-[15px] font-semibold text-white transition-colors hover:bg-[#0046bb] disabled:cursor-not-allowed disabled:opacity-60"
          disabled={submitting}
          type="submit"
        >
          {submitting ? "注册中..." : "注册并进入门户"}
          <ArrowRight size={16} />
        </button>
      </form>

      <div className="mt-6 text-[14px] text-[#64748b]">
        已有账户？
        <Link className="ml-2 font-semibold text-[#0052d9]" href="/login">
          立即登录
        </Link>
      </div>
    </AuthShell>
  );
}
