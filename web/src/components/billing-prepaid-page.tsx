"use client";

import { AlertCircle, ArrowLeft, ArrowUpRight, CheckCircle2, Coins, DatabaseZap, LoaderCircle, MessageCircle, ReceiptText, RefreshCw, ShoppingBag, Wallet, WalletCards } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { BillingApiError, fetchBillingBalances, fetchBillingConsumptions, fetchWalletRechargePaymentStatus, fetchWalletSummary, fetchWalletTransactions, launchWalletRecharge } from "@/lib/billing-api";
import { getSiteAuthToken, onSiteAuthChange, redirectToIxiaMenLogin } from "@/lib/site-auth";
import type { BillingBalance, BillingConsumption, WalletPaymentMethod, WalletRechargePaymentStatus, WalletSummary, WalletTransaction, WalletTransactionType } from "@/types";

function formatMoney(value: string) {
  const normalized = value.trim();
  const negative = normalized.startsWith("-");
  const [rawIntegerPart, rawDecimalPart = "00"] = (negative ? normalized.slice(1) : normalized).split(".");
  const integerPart = rawIntegerPart.replace(/^0+(?=\d)/, "") || "0";
  const decimalPart = rawDecimalPart.padEnd(2, "0").slice(0, 2);
  return `${negative ? "-" : ""}${integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}.${decimalPart}`;
}

function formatDateTime(value?: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function StatePanel({ title, children, error = false }: { title: string; children?: React.ReactNode; error?: boolean }) {
  return <div className={`billing-state ${error ? "billing-state-error" : ""}`}>
    <span className="billing-state-icon">{error ? <AlertCircle size={28} /> : <DatabaseZap size={28} />}</span>
    <h2>{title}</h2>
    {children}
  </div>;
}

function LoginRequired({ returnTo }: { returnTo: string }) {
  return <StatePanel title="登录后查看钱包和交易记录">
    <button className="billing-primary-button" onClick={() => redirectToIxiaMenLogin(returnTo)} type="button">前往登录</button>
  </StatePanel>;
}

function generateRequestKey() {
  if (typeof globalThis !== "undefined" && globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  if (typeof globalThis !== "undefined" && globalThis.crypto?.getRandomValues) {
    const bytes = new Uint8Array(16);
    globalThis.crypto.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes, (value) => value.toString(16).padStart(2, "0")).join("");
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }
  return `wallet-${Date.now()}-${Math.random().toString(16).slice(2, 12)}`;
}

function formatInputMoney(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (!/^\d+(\.\d{0,2})?$/.test(trimmed)) return trimmed;
  const [integerPart, decimalPart = ""] = trimmed.split(".");
  const normalizedInteger = integerPart.replace(/^0+(?=\d)/, "") || "0";
  return decimalPart ? `${normalizedInteger}.${decimalPart}` : normalizedInteger;
}

function parseRechargeAmount(value: string) {
  const normalized = value.trim();
  if (!normalized) return null;
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null;
  const amount = Number(normalized);
  if (!Number.isFinite(amount) || amount <= 0) return null;
  return amount.toFixed(2);
}

const presetAmounts = ["100.00", "200.00", "500.00", "1000.00", "2000.00", "5000.00"] as const;
const paymentMethods: Array<{ label: string; value: WalletPaymentMethod }> = [
  { label: "支付宝", value: "ALIPAY" },
  { label: "微信支付", value: "WECHAT" },
];

const transactionLabels: Record<WalletTransactionType, string> = {
  RECHARGE: "钱包充值",
  ORDER_PAYMENT: "余额购单",
  PREPAID_CREDIT: "历史入账",
  CONSUMPTION: "历史扣减",
  DIRECT_PURCHASE: "直接购买",
};

function PaymentBrand({ method }: { method: WalletPaymentMethod }) {
  return method === "ALIPAY"
    ? <span aria-hidden="true" className="billing-pay-brand billing-pay-brand-alipay">支</span>
    : <span aria-hidden="true" className="billing-pay-brand billing-pay-brand-wechat"><MessageCircle size={19} strokeWidth={2.4} /></span>;
}

function TransactionRow({ item }: { item: WalletTransaction }) {
  const credit = item.transaction_type === "RECHARGE" || item.transaction_type === "PREPAID_CREDIT";
  const debit = item.transaction_type === "ORDER_PAYMENT" || item.transaction_type === "CONSUMPTION";
  return <article className="billing-transaction-row">
    <span className={`billing-transaction-icon billing-transaction-${item.transaction_type.toLowerCase().replace("_", "-")}`}>
      {item.transaction_type === "RECHARGE" ? <WalletCards size={18} /> : debit ? <ReceiptText size={18} /> : <ShoppingBag size={18} />}
    </span>
    <div className="billing-transaction-copy">
      <div><strong>{item.title}</strong><span>{transactionLabels[item.transaction_type]}</span></div>
      <p>{formatDateTime(item.occurred_at)}{item.reference_no ? ` · ${item.reference_no}` : ""}{item.service_name ? ` · ${item.service_name}` : ""}</p>
    </div>
    <div className="billing-transaction-value">
      <strong className={credit ? "credit" : debit ? "debit" : "purchase"}>{credit ? "+" : debit ? "-" : ""}¥ {formatMoney(item.amount)}</strong>
      {item.order_id ? <Link href={`/my/orders/${item.order_id}`}>订单详情 <ArrowUpRight size={13} /></Link> : null}
    </div>
  </article>;
}

export function BillingBalancesPage() {
  const pathname = usePathname();
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [summary, setSummary] = useState<WalletSummary | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [transactionTotal, setTransactionTotal] = useState(0);
  const [amountInput, setAmountInput] = useState("100");
  const [paymentMethod, setPaymentMethod] = useState<WalletPaymentMethod>("ALIPAY");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const hasToken = Boolean(getSiteAuthToken());
    setAuthenticated(hasToken);
    if (!hasToken) return;
    setLoading(true);
    setError("");
    try {
      const [walletSummary, transactionList] = await Promise.all([
        fetchWalletSummary(),
        fetchWalletTransactions(1, 5),
      ]);
      setSummary(walletSummary);
      setTransactions(transactionList.items);
      setTransactionTotal(transactionList.total);
    } catch (reason) {
      if (reason instanceof BillingApiError && reason.status === 401) setAuthenticated(false);
      else setError(reason instanceof Error ? reason.message : "钱包中心加载失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => onSiteAuthChange(() => void load()), [load]);
  const selectedAmount = parseRechargeAmount(amountInput);

  const submitRecharge = async () => {
    if (!selectedAmount || submitting) {
      if (!selectedAmount) setError("请输入正确的充值金额，最多两位小数");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const result = await launchWalletRecharge(selectedAmount, paymentMethod, generateRequestKey());
      window.location.assign(result.checkout_url);
    } catch (reason) {
      if (reason instanceof BillingApiError && reason.status === 401) setAuthenticated(false);
      else setError(reason instanceof Error ? reason.message : "发起钱包充值失败");
    } finally {
      setSubmitting(false);
    }
  };

  return <div className="billing-page billing-balance-page">
    <div className="billing-page-heading">
      <div>
        <span className="billing-eyebrow">钱包中心</span>
        <h1>我的钱包</h1>
      </div>
    </div>
    {authenticated === null || loading ? <StatePanel title="正在加载钱包中心"><LoaderCircle className="billing-spin" size={24} /></StatePanel> : null}
    {authenticated === false ? <LoginRequired returnTo={pathname || "/my/balances"} /> : null}
    {authenticated && error && !summary ? <StatePanel error title={error}><button className="billing-secondary-button" onClick={() => void load()} type="button"><RefreshCw size={16} />重新加载</button></StatePanel> : null}
    {authenticated && !loading && summary ? <>
      <section className="billing-wallet-overview">
        <article className="billing-wallet-balance">
          <div className="billing-wallet-balance-label"><Wallet size={18} /><span>可用余额</span></div>
          <strong>¥ {formatMoney(summary.current_balance)}</strong>
          <div className="billing-wallet-metrics"><span>累计充值 <b>¥ {formatMoney(summary.total_recharged)}</b></span><span>累计消费 <b>¥ {formatMoney(summary.total_consumed)}</b></span></div>
        </article>
        <div className="billing-wallet-recharge">
          <header><div><span className="billing-eyebrow">账户充值</span><h2>充值金额</h2></div></header>
          <label className="billing-wallet-amount"><span>¥</span><input aria-label="充值金额" inputMode="decimal" onChange={(event) => setAmountInput(formatInputMoney(event.target.value.replace(/[^\d.]/g, "")))} placeholder="0.00" value={amountInput} /></label>
          <div className="billing-wallet-presets"><div>{presetAmounts.map((item) => <button className={selectedAmount === item ? "active" : ""} key={item} onClick={() => setAmountInput(item.replace(/\.00$/, ""))} type="button">¥ {Number(item).toLocaleString("zh-CN")}</button>)}</div></div>
          <div className="billing-wallet-payment-methods"><span>支付方式</span><div>{paymentMethods.map((item) => <button aria-pressed={paymentMethod === item.value} className={paymentMethod === item.value ? `active ${item.value.toLowerCase()}` : item.value.toLowerCase()} key={item.value} onClick={() => setPaymentMethod(item.value)} type="button"><PaymentBrand method={item.value} /><span>{item.label}</span><i /></button>)}</div></div>
          {error ? <div className="billing-inline-error"><AlertCircle size={15} />{error}</div> : null}
          <div className="billing-wallet-submit"><div><span>本次支付</span><strong>{selectedAmount ? `¥ ${formatMoney(selectedAmount)}` : "--"}</strong></div><button className="billing-primary-button" disabled={submitting || !selectedAmount} onClick={() => void submitRecharge()} type="button">{submitting ? <LoaderCircle className="billing-spin" size={17} /> : <WalletCards size={17} />}{submitting ? "正在跳转" : "确认充值"}</button></div>
        </div>
      </section>
      <section className="billing-transactions-panel">
        <header>
          <div><h2>最近交易</h2></div>
          <div className="billing-transactions-header-links">
            <Link href="/my/service-balances">服务额度与用量</Link>
            {transactionTotal > 0 ? <Link href="/my/consumptions">全部交易 <ArrowUpRight size={15} /></Link> : null}
          </div>
        </header>
        {transactions.length ? <div className="billing-transaction-list">{transactions.map((item) => <TransactionRow item={item} key={item.id} />)}</div> : <StatePanel title="暂无交易记录"><Link className="billing-secondary-button" href="/products">去选购商品</Link></StatePanel>}
      </section>
    </> : null}
  </div>;
}

export function BillingConsumptionsPage() {
  const pathname = usePathname();
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [items, setItems] = useState<WalletTransaction[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState<"ALL" | WalletTransactionType>("ALL");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const hasToken = Boolean(getSiteAuthToken());
    setAuthenticated(hasToken);
    if (!hasToken) return;
    setLoading(true);
    setError("");
    try {
      const transactions = await fetchWalletTransactions(page, 20, filter === "ALL" ? undefined : filter);
      setItems(transactions.items);
      setTotal(transactions.total);
    } catch (reason) {
      if (reason instanceof BillingApiError && reason.status === 401) setAuthenticated(false);
      else setError(reason instanceof Error ? reason.message : "交易记录加载失败");
    } finally {
      setLoading(false);
    }
  }, [filter, page]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => onSiteAuthChange(() => void load()), [load]);

  const pageCount = Math.max(1, Math.ceil(total / 20));

  return <div className="billing-page billing-consumption-page">
    <Link className="billing-back-link" href="/my/balances"><ArrowLeft size={17} />返回钱包中心</Link>
    <div className="billing-page-heading">
      <div>
        <span className="billing-eyebrow">交易记录</span>
        <h1>全部交易</h1>
      </div>
    </div>
    <div className="billing-transaction-tabs">{(["ALL", "RECHARGE", "ORDER_PAYMENT"] as const).map((value) => <button className={filter === value ? "active" : ""} key={value} onClick={() => { setFilter(value); setPage(1); }} type="button">{value === "ALL" ? "全部" : transactionLabels[value]}</button>)}</div>
    {authenticated === null || loading ? <StatePanel title="正在加载交易记录"><LoaderCircle className="billing-spin" size={24} /></StatePanel> : null}
    {authenticated === false ? <LoginRequired returnTo={pathname || "/my/consumptions"} /> : null}
    {authenticated && error ? <StatePanel error title={error}><button className="billing-secondary-button" onClick={() => void load()} type="button"><RefreshCw size={16} />重新加载</button></StatePanel> : null}
    {authenticated && !loading && !error && items.length === 0 ? <StatePanel title="当前分类暂无交易记录" /> : null}
    {authenticated && !loading && !error && items.length > 0 ? <section className="billing-transactions-panel billing-transactions-page"><div className="billing-transaction-list">{items.map((item) => <TransactionRow item={item} key={item.id} />)}</div></section> : null}
    {authenticated && total > 10 ? <div className="billing-pagination">
      <button disabled={page <= 1} onClick={() => setPage((value) => value - 1)} type="button">上一页</button>
      <span>第 {page} / {pageCount} 页，共 {total} 条</span>
      <button disabled={page >= pageCount} onClick={() => setPage((value) => value + 1)} type="button">下一页</button>
    </div> : null}
  </div>;
}

export function ServiceBalancesPage() {
  const pathname = usePathname();
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [balances, setBalances] = useState<BillingBalance[]>([]);
  const [consumptions, setConsumptions] = useState<BillingConsumption[]>([]);
  const [summaryAmount, setSummaryAmount] = useState("0.00");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const hasToken = Boolean(getSiteAuthToken());
    setAuthenticated(hasToken);
    if (!hasToken) return;
    setLoading(true);
    setError("");
    try {
      const [balanceList, consumptionList] = await Promise.all([
        fetchBillingBalances(),
        fetchBillingConsumptions(1, 20),
      ]);
      setBalances(balanceList);
      setConsumptions(consumptionList.items);
      setSummaryAmount(consumptionList.summary.total_amount);
    } catch (reason) {
      if (reason instanceof BillingApiError && reason.status === 401) setAuthenticated(false);
      else setError(reason instanceof Error ? reason.message : "服务额度加载失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => onSiteAuthChange(() => void load()), [load]);

  return <div className="billing-page billing-balance-page">
    <Link className="billing-back-link" href="/my/balances"><ArrowLeft size={17} />返回钱包中心</Link>
    <div className="billing-page-heading">
      <div>
        <span className="billing-eyebrow">服务额度</span>
        <h1>额度与用量</h1>
      </div>
    </div>
    {authenticated === null || loading ? <StatePanel title="正在加载服务额度"><LoaderCircle className="billing-spin" size={24} /></StatePanel> : null}
    {authenticated === false ? <LoginRequired returnTo={pathname || "/my/service-balances"} /> : null}
    {authenticated && error ? <StatePanel error title={error}><button className="billing-secondary-button" onClick={() => void load()} type="button"><RefreshCw size={16} />重新加载</button></StatePanel> : null}
    {authenticated && !loading && !error ? <>
      <section className="billing-service-balance-grid">
        {balances.length === 0 ? <StatePanel title="暂无服务额度" /> : balances.map((item) => (
          <article className={`billing-service-balance-card ${item.insufficient ? "insufficient" : ""}`} key={item.service_code}>
            <header><strong>{item.service_name}</strong><span>{item.service_code}</span></header>
            <div className="billing-service-balance-main">剩余 <b>¥ {formatMoney(item.remaining_balance)}</b></div>
            <div className="billing-wallet-metrics">
              <span>累计充值 <b>¥ {formatMoney(item.total_recharged)}</b></span>
              <span>累计消费 <b>¥ {formatMoney(item.total_consumed)}</b></span>
            </div>
            {item.insufficient ? <div className="billing-inline-error"><AlertCircle size={15} />额度不足</div> : null}
          </article>
        ))}
      </section>
      <section className="billing-transactions-panel">
        <header><div><h2>最近服务用量</h2><p>合计 ¥ {formatMoney(summaryAmount)}</p></div></header>
        {consumptions.length === 0 ? <StatePanel title="暂无用量记录" /> : (
          <div className="billing-transaction-list">
            {consumptions.map((item) => (
              <article className="billing-transaction-row" key={item.id}>
                <span className="billing-transaction-icon billing-transaction-consumption"><ReceiptText size={18} /></span>
                <div className="billing-transaction-copy">
                  <div><strong>{item.item_name}</strong><span>{item.service_name}</span></div>
                  <p>{formatDateTime(item.consumed_at)} · {item.supplier_name}{item.order_no ? ` · ${item.order_no}` : ""}</p>
                </div>
                <div className="billing-transaction-value"><strong className="debit">-¥ {formatMoney(item.amount)}</strong></div>
              </article>
            ))}
          </div>
        )}
      </section>
    </> : null}
  </div>;
}

export function WalletPaymentResultPage() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const rechargeId = Number(searchParams.get("recharge_id"));
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [statusData, setStatusData] = useState<WalletRechargePaymentStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [timedOut, setTimedOut] = useState(false);
  const startTimeRef = useRef<number>(0);

  const load = useCallback(async (silent = false) => {
    const hasToken = Boolean(getSiteAuthToken());
    setAuthenticated(hasToken);
    if (!hasToken) {
      setLoading(false);
      return;
    }
    if (!Number.isSafeInteger(rechargeId) || rechargeId <= 0) {
      setError("充值单参数不合法");
      setLoading(false);
      return;
    }
    if (!silent) setLoading(true);
    try {
      const result = await fetchWalletRechargePaymentStatus(rechargeId);
      setStatusData(result);
      setError("");
    } catch (reason) {
      if (reason instanceof BillingApiError && reason.status === 401) setAuthenticated(false);
      else setError(reason instanceof Error ? reason.message : "钱包支付状态查询失败");
    } finally {
      setLoading(false);
    }
  }, [rechargeId]);

  useEffect(() => {
    startTimeRef.current = Date.now();
    void load();
  }, [load]);
  useEffect(() => onSiteAuthChange(() => void load()), [load]);
  useEffect(() => {
    if (!statusData) return;
    if (statusData.recharge_status === "PAID" || statusData.recharge_status === "PAYMENT_FAILED" || statusData.recharge_status === "CANCELED") return;
    const timer = window.setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      if (elapsed >= 30000) {
        setTimedOut(true);
        window.clearInterval(timer);
        return;
      }
      void load(true);
    }, 3000);
    return () => window.clearInterval(timer);
  }, [load, statusData]);

  const title = statusData?.recharge_status === "PAID"
    ? "充值已到账"
    : statusData?.recharge_status === "PAYMENT_FAILED"
      ? "充值未成功"
      : statusData?.recharge_status === "CANCELED"
        ? "充值已取消"
        : timedOut
          ? "结果确认中"
          : "正在确认充值结果";

  return <div className="billing-page billing-order-page">
    <Link className="billing-back-link" href="/my/balances"><ArrowLeft size={17} />返回钱包中心</Link>
    {authenticated === null || loading ? <StatePanel title="正在确认充值结果"><LoaderCircle className="billing-spin" size={24} /></StatePanel> : null}
    {authenticated === false ? <LoginRequired returnTo={`${pathname || "/wallet/payment-result"}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`} /> : null}
    {authenticated && error && !statusData ? <StatePanel error title={error}><button className="billing-secondary-button" onClick={() => void load()} type="button"><RefreshCw size={16} />重新查询</button></StatePanel> : null}
    {authenticated && !loading && statusData ? <section className="billing-payment-result">
      <div className="billing-result-hero">
        <span className={`billing-result-icon billing-result-icon-${statusData.recharge_status.toLowerCase().replace("_", "-")}`}>{statusData.recharge_status === "PAID" ? <CheckCircle2 size={28} /> : statusData.recharge_status === "PAYMENT_FAILED" ? <AlertCircle size={28} /> : <LoaderCircle className={timedOut ? "" : "billing-spin"} size={28} />}</span>
        <h1>{title}</h1>
        <p>{statusData.recharge_status === "PAID" ? "充值已到账。" : timedOut ? "充值结果确认中，可稍后在钱包中查看。" : "充值结果确认中…"}</p>
      </div>
      <dl className="billing-result-summary">
        <div><dt>充值单号</dt><dd>{statusData.recharge_no}</dd></div>
        <div><dt>充值状态</dt><dd>{statusData.recharge_status === "PAID" ? "已支付" : statusData.recharge_status === "PAYMENT_FAILED" ? "支付失败" : statusData.recharge_status === "CANCELED" ? "已取消" : "待支付"}</dd></div>
        <div><dt>支付方式</dt><dd>{statusData.payment_method === "ALIPAY" ? "支付宝" : "微信支付"}</dd></div>
        <div><dt>充值金额</dt><dd>¥ {formatMoney(statusData.amount)}</dd></div>
      </dl>
      {statusData.latest_payment ? <div className="billing-wallet-result-payment"><span>支付流水</span><strong>{statusData.latest_payment.payment_no}</strong><small>{statusData.latest_payment.status}</small></div> : null}
      {error ? <div className="billing-inline-error"><AlertCircle size={15} />{error}</div> : null}
      <div className="billing-result-actions">
        <Link className="billing-secondary-button" href="/my/balances">返回钱包中心</Link>
        {statusData.recharge_status !== "PAID" ? <button className="billing-primary-button" onClick={() => void load()} type="button"><RefreshCw size={16} />刷新状态</button> : null}
      </div>
    </section> : null}
  </div>;
}
