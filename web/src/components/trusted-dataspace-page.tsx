"use client";

import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  ExternalLink,
  FileCheck2,
  LoaderCircle,
  LockKeyhole,
  RefreshCw,
  Send,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import {
  fetchTrustedDataspaceRegistration,
  submitTrustedDataspaceRegistration,
  syncTrustedDataspaceRegistration,
  TrustedDataspaceApiError,
} from "@/lib/trusted-dataspace-api";
import { getCachedSiteUser, getSiteAuthToken, onSiteAuthChange, redirectToIxiaMenLogin } from "@/lib/site-auth";
import type { TrustedDataspaceRegistration, TrustedDataspaceRegistrationSubmitPayload, TrustedDataspaceStatus } from "@/types";

const initialForm: TrustedDataspaceRegistrationSubmitPayload = {
  dept_name: "",
  credit_code: "",
  legal_person_name: "",
  legal_person_id_card: "",
  legal_person_phone: "",
  account: "",
  privacy_consent: false,
};

const statusCopy: Record<TrustedDataspaceStatus, { label: string; description: string; tone: string }> = {
  SUBMITTING: { label: "正在提交", description: "OPC 正在向可信数据空间提交注册资料。", tone: "pending" },
  PENDING: { label: "等待平台审核", description: "注册资料已受理，可刷新查看最新审核进度。", tone: "pending" },
  COMPLETED: { label: "注册已完成", description: "可信数据空间账号已创建，请留意法人手机号收到的账号密码短信。", tone: "success" },
  REJECTED: { label: "审核未通过", description: "请根据返回原因核对资料后重新提交。", tone: "danger" },
  SUBMIT_FAILED: { label: "提交未成功", description: "对方已明确返回失败，可修改资料后重新提交。", tone: "danger" },
  SUBMISSION_UNKNOWN: { label: "提交结果待确认", description: "请求发出后响应超时。为避免重复创建，当前不能再次提交，请联系平台处理。", tone: "warning" },
};

function createIdempotencyKey() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return `tds-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

function formatDate(value?: string | null) {
  return value
    ? new Intl.DateTimeFormat("zh-CN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Shanghai" }).format(new Date(value))
    : "-";
}

function hasValidIdCardChecksum(value: string) {
  const normalized = value.trim().toUpperCase();
  if (!/^\d{17}[0-9X]$/.test(normalized)) return false;
  const weights = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
  const checks = "10X98765432";
  const sum = normalized.slice(0, 17).split("").reduce((total, character, index) => total + Number(character) * weights[index], 0);
  return checks[sum % 11] === normalized[17];
}

function validate(form: TrustedDataspaceRegistrationSubmitPayload) {
  if (form.dept_name.trim().length < 2) return "请填写完整企业名称";
  if (!/^[0-9A-Z]{18}$/.test(form.credit_code.trim().toUpperCase())) return "统一社会信用代码须为18位大写字母或数字";
  if (!form.legal_person_name.trim()) return "请填写法人姓名";
  if (!/^\d{17}[0-9Xx]$/.test(form.legal_person_id_card.trim())) return "请输入18位法人身份证号码";
  if (!hasValidIdCardChecksum(form.legal_person_id_card)) return "法人身份证号码校验位不正确，请核对后重新输入";
  if (!/^1[3-9]\d{9}$/.test(form.legal_person_phone.trim())) return "请输入11位有效法人手机号";
  if (!/^[A-Za-z][A-Za-z0-9_]{7,31}$/.test(form.account.trim())) return "登录账号须为8-32位，以英文字母开头";
  if (!form.privacy_consent) return "请先阅读并同意信息授权说明";
  return "";
}

function LoginRequired() {
  return (
    <section className="tds-state-card">
      <LockKeyhole size={28} />
      <h2>登录后申请可信数据空间账号</h2>
      <p>登录后填写企业及法人资料，审核完成后账号密码将由可信数据空间短信发送。</p>
      <button onClick={() => redirectToIxiaMenLogin("/trusted-data-space")} type="button">前往登录</button>
    </section>
  );
}

function RegistrationForm({ busy, error, onSubmit }: { busy: boolean; error: string; onSubmit: (value: TrustedDataspaceRegistrationSubmitPayload) => void }) {
  const cachedUser = getCachedSiteUser();
  const [form, setForm] = useState<TrustedDataspaceRegistrationSubmitPayload>(() => ({
    ...initialForm,
    legal_person_name: cachedUser?.real_name || "",
    legal_person_phone: cachedUser?.phone || "",
  }));
  const update = (field: keyof TrustedDataspaceRegistrationSubmitPayload, value: string | boolean) => {
    setForm((current) => ({ ...current, [field]: value }));
  };
  return (
    <form className="tds-form" onSubmit={(event) => { event.preventDefault(); onSubmit(form); }}>
      <div className="tds-form-heading"><span>注册申请</span><h2>创建可信数据空间企业账号</h2><p>请确保资料与企业证照一致。带 * 的字段均为对方平台必填项。</p></div>
      <div className="tds-form-grid">
        <label className="tds-field tds-field-wide"><span>企业全称 *</span><input autoComplete="organization" maxLength={255} onChange={(event) => update("dept_name", event.target.value)} placeholder="请输入营业执照上的企业全称" value={form.dept_name} /></label>
        <label className="tds-field tds-field-wide"><span>统一社会信用代码 *</span><input autoCapitalize="characters" maxLength={18} onChange={(event) => update("credit_code", event.target.value.toUpperCase().replace(/[^0-9A-Z]/g, ""))} placeholder="18位统一社会信用代码" value={form.credit_code} /></label>
        <label className="tds-field"><span>法人姓名 *</span><input autoComplete="name" maxLength={128} onChange={(event) => update("legal_person_name", event.target.value)} placeholder="请输入法人姓名" value={form.legal_person_name} /></label>
        <label className="tds-field"><span>法人手机号 *</span><input autoComplete="tel" inputMode="numeric" maxLength={11} onChange={(event) => update("legal_person_phone", event.target.value.replace(/\D/g, ""))} placeholder="用于接收账号密码短信" value={form.legal_person_phone} /></label>
        <label className="tds-field tds-field-wide"><span>法人身份证号码 *</span><input autoComplete="off" maxLength={18} onChange={(event) => update("legal_person_id_card", event.target.value.toUpperCase().replace(/[^0-9X]/g, ""))} placeholder="18位身份证号码" value={form.legal_person_id_card} /></label>
        <label className="tds-field tds-field-wide"><span>登录账号 *</span><input autoCapitalize="none" autoComplete="off" maxLength={32} onChange={(event) => update("account", event.target.value.replace(/[^A-Za-z0-9_]/g, ""))} placeholder="8-32位，以英文字母开头" value={form.account} /><small>审核通过后，初始密码将通过短信发送至法人手机号。</small></label>
      </div>
      <label className="tds-consent"><input checked={form.privacy_consent} onChange={(event) => update("privacy_consent", event.target.checked)} type="checkbox" /><span>我已确认资料真实有效，并同意 OPC 将上述企业及法人信息提交至厦门城市可信数据空间用于创建平台账号。</span></label>
      {error ? <div className="tds-inline-error"><AlertTriangle size={16} />{error}</div> : null}
      <button className="tds-submit" disabled={busy} type="submit">{busy ? <LoaderCircle className="tds-spin" size={18} /> : <Send size={18} />}{busy ? "正在安全提交" : "提交注册申请"}</button>
    </form>
  );
}

function RegistrationStatus({ item, busy, error, onRefresh, onRetry }: { item: TrustedDataspaceRegistration; busy: boolean; error: string; onRefresh: () => void; onRetry: () => void }) {
  const copy = statusCopy[item.status];
  const canSync = Boolean(item.seq_no) && item.status !== "COMPLETED";
  return (
    <section className={`tds-status-card tds-status-${copy.tone}`}>
      <div className="tds-status-icon">{item.status === "COMPLETED" ? <CheckCircle2 size={30} /> : <FileCheck2 size={30} />}</div>
      <div className="tds-status-heading"><span>注册进度</span><h2>{copy.label}</h2><p>{copy.description}</p></div>
      {(item.last_error_message || error) ? <div className="tds-status-message"><AlertTriangle size={17} /><span>{error || item.last_error_message}</span></div> : null}
      <dl className="tds-status-details">
        <div><dt>企业名称</dt><dd>{item.dept_name}</dd></div>
        <div><dt>登录账号</dt><dd>{item.account}</dd></div>
        <div><dt>法人</dt><dd>{item.legal_person_name} · {item.legal_person_phone}</dd></div>
        <div><dt>信用代码</dt><dd>{item.credit_code}</dd></div>
        <div><dt>流程序列号</dt><dd>{item.seq_no || "暂未取得"}</dd></div>
        <div><dt>提交时间</dt><dd>{formatDate(item.submitted_at || item.created_at)}</dd></div>
      </dl>
      <div className="tds-status-actions">
        {canSync ? <button disabled={busy} onClick={onRefresh} type="button"><RefreshCw className={busy ? "tds-spin" : ""} size={17} />{busy ? "正在刷新" : "刷新进度"}</button> : null}
        {item.can_retry ? <button className="secondary" disabled={busy} onClick={onRetry} type="button">修改并重新提交</button> : null}
        {item.status === "COMPLETED" && item.portal_url ? <a href={item.portal_url} rel="noopener noreferrer" target="_blank">前往可信数据空间 <ExternalLink size={16} /></a> : null}
      </div>
    </section>
  );
}

export function TrustedDataspacePage() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [registration, setRegistration] = useState<TrustedDataspaceRegistration | null>(null);
  const [retrying, setRetrying] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const hasToken = Boolean(getSiteAuthToken());
    setAuthenticated(hasToken);
    if (!hasToken) { setLoading(false); return; }
    setLoading(true);
    setError("");
    try {
      const item = await fetchTrustedDataspaceRegistration();
      setRegistration(item);
      if (item?.status === "PENDING") {
        try { setRegistration(await syncTrustedDataspaceRegistration()); }
        catch (reason) { setError(reason instanceof Error ? reason.message : "进度刷新失败"); }
      }
    } catch (reason) {
      if (reason instanceof TrustedDataspaceApiError && reason.status === 401) setAuthenticated(false);
      else setError(reason instanceof Error ? reason.message : "注册信息加载失败");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => onSiteAuthChange(() => void load()), [load]);

  const submit = async (form: TrustedDataspaceRegistrationSubmitPayload) => {
    const validationError = validate(form);
    if (validationError) { setError(validationError); return; }
    setBusy(true); setError("");
    try {
      const result = await submitTrustedDataspaceRegistration({ ...form, credit_code: form.credit_code.toUpperCase(), legal_person_id_card: form.legal_person_id_card.toUpperCase() }, createIdempotencyKey());
      setRegistration(result); setRetrying(false);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "提交失败，请稍后重试");
      if (reason instanceof TrustedDataspaceApiError && reason.status === 401) setAuthenticated(false);
      else if (reason instanceof TrustedDataspaceApiError && reason.status === 502) await load();
    } finally { setBusy(false); }
  };

  const refresh = async () => {
    setBusy(true); setError("");
    try { setRegistration(await syncTrustedDataspaceRegistration()); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "进度刷新失败"); }
    finally { setBusy(false); }
  };

  return (
    <main className="tds-page">
      <section className="tds-hero">
        <div><span className="tds-kicker"><ShieldCheck size={16} /> OPC × 厦门城市可信数据空间</span><h1>可信连接，从一个企业账号开始</h1><p>在 OPC 完成企业用户创建，审核通过后由可信数据空间直接向法人手机号发送账号密码。</p></div>
        <div className="tds-hero-mark"><ShieldCheck size={72} /></div>
      </section>
      <section className="tds-layout">
        <aside className="tds-guide">
          <span>服务流程</span><h2>一次提交，持续查看进度</h2>
          <ol><li><Building2 /><div><strong>填写企业资料</strong><p>提交企业证照和法人身份信息。</p></div></li><li><FileCheck2 /><div><strong>平台审核创建</strong><p>OPC 保存流程序列号并同步审核状态。</p></div></li><li><UserRound /><div><strong>短信接收凭证</strong><p>完成后由可信数据空间发送账号密码。</p></div></li></ol>
        </aside>
        <div className="tds-workspace">
          {loading || authenticated === null ? <section className="tds-state-card"><LoaderCircle className="tds-spin" size={28} /><h2>正在读取注册状态</h2><p>请稍候，正在建立安全连接。</p></section> : null}
          {!loading && authenticated === false ? <LoginRequired /> : null}
          {!loading && authenticated && (!registration || retrying) ? <RegistrationForm busy={busy} error={error} onSubmit={(value) => void submit(value)} /> : null}
          {!loading && authenticated && registration && !retrying ? <RegistrationStatus busy={busy} error={error} item={registration} onRefresh={() => void refresh()} onRetry={() => { setRetrying(true); setError(""); }} /> : null}
        </div>
      </section>
    </main>
  );
}
