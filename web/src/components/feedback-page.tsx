"use client";

import { ChevronRight, Phone, UserRound } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchCurrentSiteUser, getCachedSiteUser, getSiteAuthHeaders } from "@/lib/site-auth";
import type { FeedbackSubmitPayload, FeedbackSubmitResult, SiteUserProfile } from "@/types";

type FormState = {
  subject: string;
  content: string;
  phone: string;
  attachmentName: string;
};

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "/api";
const phonePattern = /^1[3-9]\d{9}$/;

async function submitFeedback(payload: FeedbackSubmitPayload): Promise<FeedbackSubmitResult> {
  const response = await fetch(`${apiBaseUrl}/public/feedbacks`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getSiteAuthHeaders(),
    },
    body: JSON.stringify(payload),
  });
  const result = (await response.json()) as { code?: number; message?: string; detail?: string; data?: FeedbackSubmitResult };
  if (!response.ok || result?.code !== 0) {
    throw new Error(result?.detail || result?.message || "提交失败");
  }
  return result.data as FeedbackSubmitResult;
}

export function FeedbackPageView() {
  const [formState, setFormState] = useState<FormState>({
    subject: "",
    content: "",
    phone: "",
    attachmentName: "",
  });
  const [currentUser, setCurrentUser] = useState<SiteUserProfile | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    const cachedUser = getCachedSiteUser();
    if (cachedUser) {
      setCurrentUser(cachedUser);
      setFormState((prev) => ({ ...prev, phone: cachedUser.phone }));
    }

    void fetchCurrentSiteUser()
      .then((profile) => {
        if (!profile) {
          // token 已失效或已退出，清空用户显示
          setCurrentUser(null);
          setFormState((prev) => ({ ...prev, phone: "" }));
          return;
        }
        setCurrentUser(profile);
        setFormState((prev) => ({ ...prev, phone: profile.phone }));
      })
      .catch(() => undefined);

    // 监听全局登出/登入事件，实时同步用户状态
    const handleAuthChange = () => {
      const user = getCachedSiteUser();
      setCurrentUser(user);
      setFormState((prev) => ({ ...prev, phone: user?.phone || "" }));
    };

    window.addEventListener("opc-site-auth-change", handleAuthChange);
    return () => window.removeEventListener("opc-site-auth-change", handleAuthChange);
  }, []);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!formState.subject.trim() || !formState.content.trim()) {
      setMessage({ type: "error", text: "请先填写您的需求主题和具体说明，方便我们尽快协助您。" });
      return;
    }

    if (!formState.phone.trim() || !phonePattern.test(formState.phone.trim())) {
      setMessage({ type: "error", text: "请填写正确的联系电话，方便我们及时与您联系。" });
      return;
    }

    setSubmitting(true);
    setMessage(null);
    try {
      await submitFeedback({
        subject: formState.subject.trim(),
        content: formState.content.trim(),
        phone: formState.phone.trim(),
        attachment_name: formState.attachmentName.trim() || null,
        attachment_url: null,
      });
      setMessage({ type: "success", text: "已收到您的联系信息与需求说明，我们会尽快安排专人跟进。" });
      setFormState({
        subject: "",
        content: "",
        phone: currentUser?.phone || "",
        attachmentName: "",
      });
    } catch (error) {
      const reason = error instanceof Error ? error.message : "提交失败，请稍后重试。";
      setMessage({ type: "error", text: reason });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="min-h-full bg-[#f5f7fa] pb-16"
      style={{ fontFamily: '"PingFang SC", "Microsoft YaHei", sans-serif' }}
    >
      <div className="container mx-auto mb-16 max-w-4xl px-4 pt-8 lg:min-w-[1200px] lg:pt-10">
        <div className="mb-6 flex flex-wrap items-center gap-2 text-[12px] font-medium text-[#8898b6] sm:mb-8">
          <Link className="transition-colors hover:text-[#0052d9]" href="/">
            首页
          </Link>
          <ChevronRight size={14} />
          <span className="text-[#0052d9]">联系我们</span>
        </div>

        <h2 className="mb-6 flex items-center text-[22px] text-gray-900">
          <span className="mr-3 inline-block h-6 w-1.5 rounded-sm bg-[#0052d9]" />
          联系我们
        </h2>

        <div className="rounded-[24px] border border-gray-200 bg-white p-6 shadow-sm md:p-8">
          {currentUser ? (
            <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-blue-100 bg-blue-50/60 p-4 text-[13px] text-[#33537e] md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-[#0052d9]">
                  <UserRound size={18} />
                </div>
                <div>
                  <div className="text-[#0f172a]">{currentUser.name}</div>
                  <div className="mt-1 flex items-center gap-1.5 text-[#56749d]">
                    <Phone size={14} />
                    {currentUser.phone}
                  </div>
                </div>
              </div>
              <div className="text-[12px] text-[#5f7fa8]">欢迎告诉我们您当前遇到的问题或需要的协助，我们会尽快安排专人跟进，为您提供支持。</div>
            </div>
          ) : null}

          <form className="space-y-6" onSubmit={onSubmit}>
            <div>
              <label className="mb-2 block text-[14px] text-gray-700">
                <span className="mr-1 text-red-500">*</span>需求主题
              </label>
              <input
                className="w-full rounded-2xl border border-gray-300 px-3.5 py-2.5 text-[13px] outline-none transition-all placeholder:text-gray-400 focus:border-[#0052d9] focus:ring-2 focus:ring-blue-100 sm:px-4 sm:py-3 sm:text-[14px]"
                maxLength={20}
                onChange={(event) => setFormState((prev) => ({ ...prev, subject: event.target.value }))}
                placeholder="请简要填写您需要协助的事项"
                type="text"
                value={formState.subject}
              />
            </div>

            <div>
              <label className="mb-2 block text-[14px] text-gray-700">
                <span className="mr-1 text-red-500">*</span>具体说明
              </label>
              <textarea
                className="w-full resize-y rounded-2xl border border-gray-300 px-3.5 py-2.5 text-[13px] outline-none transition-all placeholder:text-gray-400 focus:border-[#0052d9] focus:ring-2 focus:ring-blue-100 sm:px-4 sm:py-3 sm:text-[14px]"
                onChange={(event) => setFormState((prev) => ({ ...prev, content: event.target.value }))}
                placeholder="请详细描述您当前遇到的情况，或希望我们协助处理的事项..."
                rows={6}
                value={formState.content}
              />
            </div>

            <div>
              <label className="mb-2 block text-[14px] text-gray-700">
                <span className="mr-1 text-red-500">*</span>联系电话
              </label>
              <input
                className="w-full rounded-2xl border border-gray-300 px-3.5 py-2.5 text-[13px] outline-none transition-all placeholder:text-gray-400 focus:border-[#0052d9] focus:ring-2 focus:ring-blue-100 disabled:bg-gray-50 disabled:text-gray-500 sm:px-4 sm:py-3 sm:text-[14px]"
                onChange={(event) => setFormState((prev) => ({ ...prev, phone: event.target.value }))}
                placeholder="请填写方便联系您的手机号"
                readOnly={Boolean(currentUser)}
                type="tel"
                value={formState.phone}
              />
            </div>



            {message ? (
              <div
                className={`rounded-2xl px-4 py-3 text-[13px] ${
                  message.type === "success"
                    ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border border-red-200 bg-red-50 text-red-600"
                }`}
              >
                {message.text}
              </div>
            ) : null}

            <div className="pt-2">
              <button
                className="flex h-[43px] min-w-[113px] items-center justify-center rounded-[5px] bg-[#BEEC00] px-[16px] whitespace-nowrap text-center text-[14px] text-black transition-all hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={submitting}
                style={{ fontFamily: '"PingFang SC", "Microsoft YaHei", sans-serif', fontStyle: "normal", textTransform: "none" }}
                type="submit"
              >
                {submitting ? "提交中..." : "提交给我们"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
