"use client";

import { ChevronRight, Paperclip, Phone, UserRound } from "lucide-react";
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

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000/api";
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
          return;
        }
        setCurrentUser(profile);
        setFormState((prev) => ({ ...prev, phone: profile.phone }));
      })
      .catch(() => undefined);
  }, []);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!formState.subject.trim() || !formState.content.trim()) {
      setMessage({ type: "error", text: "请填写主题和反馈内容后再提交。" });
      return;
    }

    if (!formState.phone.trim() || !phonePattern.test(formState.phone.trim())) {
      setMessage({ type: "error", text: "请填写合法的联系电话。" });
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
      setMessage({ type: "success", text: "反馈提交成功，我们会尽快处理并在后台跟进。" });
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
    <div className="min-h-full bg-[#f5f7fa] pb-16">
      <div className="mb-8 bg-[#eef3fc] px-4 py-12">
        <div className="container mx-auto max-w-4xl">
          <h1 className="mb-3 text-[28px] font-bold text-[#0052d9] md:text-[32px]">意见反馈</h1>
          <p className="text-lg text-[#0052d9] opacity-90">倾听您的声音，共同打磨更顺畅的门户与服务体验</p>
        </div>
      </div>

      <div className="container mx-auto mb-16 max-w-4xl px-4">
        <div className="mb-8 flex items-center gap-2 text-[14px] font-medium text-gray-900">
          <Link className="transition-colors hover:text-[#0052d9]" href="/">
            首页
          </Link>
          <ChevronRight className="text-gray-400" size={16} />
          <span className="text-[#0052d9]">意见反馈</span>
        </div>

        <h2 className="mb-6 flex items-center text-[22px] font-bold text-gray-900">
          <span className="mr-3 inline-block h-6 w-1.5 rounded-sm bg-[#0052d9]" />
          问题与建议
        </h2>

        <div className="rounded-[24px] border border-gray-200 bg-white p-6 shadow-sm md:p-8">
          {currentUser ? (
            <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-blue-100 bg-blue-50/60 p-4 text-[13px] text-[#33537e] md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-[#0052d9]">
                  <UserRound size={18} />
                </div>
                <div>
                  <div className="font-semibold text-[#0f172a]">{currentUser.name}</div>
                  <div className="mt-1 flex items-center gap-1.5 text-[#56749d]">
                    <Phone size={14} />
                    {currentUser.phone}
                  </div>
                </div>
              </div>
              <div className="text-[12px] text-[#5f7fa8]">已登录状态下提交反馈，系统会自动带出当前手机号。</div>
            </div>
          ) : (
            <div className="mb-6 rounded-2xl border border-[#e7eefb] bg-[#f8fbff] px-4 py-3 text-[13px] text-[#587497]">
              未登录也可以提交反馈；若先
              <Link className="mx-1 font-semibold text-[#0052d9]" href="/login">
                登录
              </Link>
              ，系统会自动带出您的手机号并同步到后台用户信息。
            </div>
          )}

          <form className="space-y-6" onSubmit={onSubmit}>
            <div>
              <label className="mb-2 block text-[14px] font-bold text-gray-700">
                主题 <span className="ml-1 text-red-500">*</span>
              </label>
              <input
                className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-[14px] outline-none transition-all placeholder:text-gray-400 focus:border-[#0052d9] focus:ring-2 focus:ring-blue-100"
                maxLength={20}
                onChange={(event) => setFormState((prev) => ({ ...prev, subject: event.target.value }))}
                placeholder="请输入反馈主题（20字以内）"
                type="text"
                value={formState.subject}
              />
            </div>

            <div>
              <label className="mb-2 block text-[14px] font-bold text-gray-700">
                反馈内容 <span className="ml-1 text-red-500">*</span>
              </label>
              <textarea
                className="w-full resize-y rounded-2xl border border-gray-300 px-4 py-3 text-[14px] outline-none transition-all placeholder:text-gray-400 focus:border-[#0052d9] focus:ring-2 focus:ring-blue-100"
                onChange={(event) => setFormState((prev) => ({ ...prev, content: event.target.value }))}
                placeholder="请详细描述您的意见、建议或使用中遇到的问题..."
                rows={6}
                value={formState.content}
              />
            </div>

            <div>
              <label className="mb-2 block text-[14px] font-bold text-gray-700">
                联系电话 <span className="ml-1 text-red-500">*</span>
              </label>
              <input
                className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-[14px] outline-none transition-all placeholder:text-gray-400 focus:border-[#0052d9] focus:ring-2 focus:ring-blue-100 disabled:bg-gray-50 disabled:text-gray-500"
                onChange={(event) => setFormState((prev) => ({ ...prev, phone: event.target.value }))}
                placeholder="请输入您的联系电话"
                readOnly={Boolean(currentUser)}
                type="tel"
                value={formState.phone}
              />
            </div>

            <div>
              <label className="mb-2 block text-[14px] font-bold text-gray-700">
                附件名称 <span className="ml-1 text-gray-400 font-normal">（可选）</span>
              </label>
              <div className="rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 py-6">
                <div className="mb-3 flex items-center justify-center gap-2 text-gray-500">
                  <Paperclip size={18} />
                  <span className="text-[14px]">首版先记录附件名称，暂不上传文件本体</span>
                </div>
                <div className="px-6">
                  <input
                    className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-[14px] outline-none transition-all placeholder:text-gray-400 focus:border-[#0052d9] focus:ring-2 focus:ring-blue-100"
                    onChange={(event) => setFormState((prev) => ({ ...prev, attachmentName: event.target.value }))}
                    placeholder="例如：问题截图.png / 需求说明.pdf"
                    type="text"
                    value={formState.attachmentName}
                  />
                </div>
              </div>
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
                className="rounded-2xl bg-[#0052d9] px-8 py-3 text-[14px] font-medium text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
                disabled={submitting}
                type="submit"
              >
                {submitting ? "提交中..." : "提交反馈"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
