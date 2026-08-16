"use client";

import { AlertCircle, ArrowLeft, CalendarDays, CheckCircle2, ChevronDown, CreditCard, LoaderCircle, ReceiptText, RefreshCw, ShoppingCart, Wallet, WalletCards, XCircle } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  BillingApiError,
  cancelBillingOrder,
  createBillingOrder,
  fetchBillingOrder,
  fetchBillingOrderPaymentStatus,
  fetchBillingOrders,
  fetchBillingProduct,
  fetchWalletSummary,
  payBillingOrder,
} from "@/lib/billing-api";
import { getSiteAuthToken, onSiteAuthChange, redirectToIxiaMenLogin } from "@/lib/site-auth";
import type { BillingOrder, BillingOrderPaymentStatus, BillingOrderStatus, BillingProduct, OrderPaymentMethod, PaymentTransaction, PaymentTransactionStatus, WalletSummary } from "@/types";

const statusLabels: Record<BillingOrderStatus, string> = {
  PENDING_PAYMENT: "待支付",
  PAID: "已支付",
  CANCELED: "已取消",
  PAYMENT_FAILED: "支付失败",
};

const statusOptions: Array<{ label: string; value: BillingOrderStatus | "ALL" }> = [
  { label: "全部", value: "ALL" },
  { label: "待支付", value: "PENDING_PAYMENT" },
  { label: "已支付", value: "PAID" },
  { label: "已取消", value: "CANCELED" },
  { label: "支付失败", value: "PAYMENT_FAILED" },
];

const paymentStatusLabels: Record<PaymentTransactionStatus, string> = {
  CREATED: "已创建",
  PENDING: "待支付",
  SUCCESS: "支付成功",
  FAILED: "支付失败",
  CLOSED: "已关闭",
};

function formatMoney(value: string) {
  return new Intl.NumberFormat("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(value));
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

const ORDER_PENDING_MS = 30 * 60 * 1000;

function resolveExpiresAt(order: Pick<BillingOrder, "status" | "created_at" | "expires_at">): string | null {
  if (order.status !== "PENDING_PAYMENT") return null;
  if (order.expires_at) return order.expires_at;
  if (!order.created_at) return null;
  return new Date(new Date(order.created_at).getTime() + ORDER_PENDING_MS).toISOString();
}

function formatCountdown(remainingMs: number) {
  const totalSeconds = Math.max(0, Math.ceil(remainingMs / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const mm = String(minutes).padStart(2, "0");
  const ss = String(seconds).padStart(2, "0");
  if (hours > 0) return `${String(hours).padStart(2, "0")}:${mm}:${ss}`;
  return `${mm}:${ss}`;
}

function PaymentCountdown({
  expiresAt,
  compact = false,
  onExpire,
}: {
  expiresAt: string;
  compact?: boolean;
  onExpire?: () => void;
}) {
  const [remainingMs, setRemainingMs] = useState(() => new Date(expiresAt).getTime() - Date.now());
  const expiredRef = useRef(false);

  useEffect(() => {
    expiredRef.current = false;
    const tick = () => {
      const next = new Date(expiresAt).getTime() - Date.now();
      setRemainingMs(next);
      if (next <= 0 && !expiredRef.current) {
        expiredRef.current = true;
        onExpire?.();
      }
    };
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [expiresAt, onExpire]);

  const expired = remainingMs <= 0;
  const urgent = !expired && remainingMs <= 5 * 60 * 1000;
  const label = expired ? "00:00" : formatCountdown(remainingMs);

  if (compact) {
    return (
      <span className={`billing-countdown billing-countdown-compact ${expired ? "expired" : urgent ? "urgent" : ""}`}>
        {expired ? "已超时" : <>剩余 <b>{label}</b></>}
      </span>
    );
  }

  return (
    <div className={`billing-countdown-panel ${expired ? "expired" : urgent ? "urgent" : ""}`} role="timer" aria-live="polite">
      <span>{expired ? "支付已超时" : "支付剩余时间"}</span>
      <strong>{label}</strong>
      <small>{expired ? "订单将自动取消，请刷新后重新下单" : "超时未支付将自动取消"}</small>
    </div>
  );
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
  return `opc-${Date.now()}-${Math.random().toString(16).slice(2, 12)}`;
}

function statusClass(status: BillingOrderStatus) {
  return `billing-order-status billing-order-status-${status.toLowerCase().replace("_", "-")}`;
}

function canCancel(status: BillingOrderStatus) {
  return status === "PENDING_PAYMENT" || status === "PAYMENT_FAILED";
}

function canPay(status: BillingOrderStatus) {
  return status === "PENDING_PAYMENT" || status === "PAYMENT_FAILED";
}

function OrderState({ children, title, type = "normal" }: { children?: React.ReactNode; title: string; type?: "normal" | "error" }) {
  return <div className={`billing-state ${type === "error" ? "billing-state-error" : ""}`}><span className="billing-state-icon">{type === "error" ? <AlertCircle size={27} /> : <ReceiptText size={27} />}</span><h2>{title}</h2>{children}</div>;
}

function LoginRequired({ returnTo }: { returnTo: string }) {
  return <OrderState title="登录后继续订单操作"><button className="billing-primary-button" onClick={() => redirectToIxiaMenLogin(returnTo)} type="button">前往登录</button></OrderState>;
}

async function launchPayment(orderId: number, paymentMethod: OrderPaymentMethod = "EXTERNAL") {
  const result = await payBillingOrder(orderId, paymentMethod);
  if (paymentMethod === "WALLET" || result.payment_method === "WALLET" || !result.checkout_url) {
    return result;
  }
  window.location.assign(result.checkout_url);
  return result;
}

function MonthCountPicker({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!open) return;
    const onDoc = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);
  return (
    <div className="billing-month-picker" ref={rootRef}>
      <span className="billing-field-label">购买月数</span>
      <div className={`billing-select ${open ? "open" : ""}`}>
        <button aria-expanded={open} aria-haspopup="listbox" aria-label="购买月数" className="billing-select-trigger" onClick={() => setOpen((current) => !current)} type="button">
          <span>{value} 个月</span>
          <ChevronDown size={16} />
        </button>
        {open ? (
          <ul className="billing-select-menu" role="listbox">
            {Array.from({ length: 36 }, (_, index) => index + 1).map((option) => (
              <li key={option}>
                <button
                  aria-selected={option === value}
                  className={option === value ? "active" : ""}
                  onClick={() => { onChange(option); setOpen(false); }}
                  role="option"
                  type="button"
                >
                  {option} 个月
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}

function PaymentMethodPicker({
  method,
  onChange,
  walletBalance,
  orderAmount,
}: {
  method: OrderPaymentMethod;
  onChange: (value: OrderPaymentMethod) => void;
  walletBalance: string | null;
  orderAmount: string;
}) {
  const balance = walletBalance === null ? null : Number(walletBalance);
  const amount = Number(orderAmount);
  const insufficient = balance !== null && Number.isFinite(balance) && balance < amount;
  return (
    <div className="billing-payment-methods-block">
      <span className="billing-field-label">支付方式</span>
      <div className="billing-order-pay-methods">
        <button aria-pressed={method === "WALLET"} className={method === "WALLET" ? "active" : ""} disabled={insufficient || balance === null} onClick={() => onChange("WALLET")} type="button">
          <Wallet size={16} />
          <span>余额支付</span>
          <small>{balance === null ? "加载中" : insufficient ? "余额不足" : `可用 ¥ ${formatMoney(walletBalance || "0")}`}</small>
        </button>
        <button aria-pressed={method === "EXTERNAL"} className={method === "EXTERNAL" ? "active" : ""} onClick={() => onChange("EXTERNAL")} type="button">
          <CreditCard size={16} />
          <span>在线支付</span>
          <small>支付宝 / 微信</small>
        </button>
      </div>
      {insufficient ? <p className="billing-pay-hint">余额不足，请先 <Link href="/my/balances">充值</Link> 或选择在线支付。</p> : null}
    </div>
  );
}

function OrderSnapshot({ order }: { order: BillingOrder }) {
  return <dl className="billing-order-snapshot">
    <div><dt>商品</dt><dd>{order.product_name}<small>{order.product_code}</small></dd></div>
    <div><dt>服务</dt><dd>{order.service_name}<small>{order.service_code}</small></dd></div>
    <div><dt>服务供应商</dt><dd>{order.supplier_name}</dd></div>
    <div><dt>计费模式</dt><dd>{order.billing_mode === "MONTHLY" ? "按月固定费用" : "固定面额预充值"}</dd></div>
    <div><dt>单价</dt><dd>¥ {formatMoney(order.unit_price)}{order.billing_mode === "MONTHLY" ? " / 月" : ""}</dd></div>
    <div><dt>购买月数</dt><dd>{order.month_count ? `${order.month_count} 个月` : "不适用"}</dd></div>
    <div><dt>服务期</dt><dd>{order.service_start_date && order.service_end_date ? `${order.service_start_date} 至 ${order.service_end_date}` : "按用量扣减服务额度"}</dd></div>
    <div><dt>支付渠道</dt><dd>{order.payment_channel === "WALLET" ? "余额支付" : order.payment_channel === "EXTERNAL" ? "在线支付" : order.status === "PAID" ? "已支付" : "未支付"}</dd></div>
    <div><dt>订单金额</dt><dd className="billing-order-amount">¥ {formatMoney(order.order_amount)}</dd></div>
  </dl>;
}

function PaymentAttempts({ transactions }: { transactions: PaymentTransaction[] }) {
  if (transactions.length === 0) return null;
  return <section className="billing-payment-attempts">
    <div className="billing-section-heading"><h2>支付尝试</h2><span>按时间倒序展示每次交易</span></div>
    <div className="billing-payment-attempt-list">
      {transactions.map((item) => <article className="billing-payment-attempt-card" key={item.id}>
        <header>
          <div>
            <span className={`billing-order-status billing-order-status-${item.status.toLowerCase()}`}>{paymentStatusLabels[item.status]}</span>
            <strong>{item.payment_no}</strong>
          </div>
          <span>¥ {formatMoney(item.amount)}</span>
        </header>
        <dl>
          <div><dt>支付平台</dt><dd>{item.provider}</dd></div>
          <div><dt>平台交易号</dt><dd>{item.provider_transaction_no || "-"}</dd></div>
          <div><dt>创建时间</dt><dd>{formatDateTime(item.created_at)}</dd></div>
          <div><dt>完成时间</dt><dd>{item.provider_completed_at ? formatDateTime(item.provider_completed_at) : "-"}</dd></div>
          <div><dt>失败信息</dt><dd>{item.failure_message || "-"}</dd></div>
        </dl>
      </article>)}
    </div>
  </section>;
}

export function BillingOrderConfirmPage({ productId }: { productId: number }) {
  const router = useRouter();
  const requestKey = useRef("");
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [product, setProduct] = useState<BillingProduct | null>(null);
  const [monthCount, setMonthCount] = useState(1);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const hasToken = Boolean(getSiteAuthToken()); setAuthenticated(hasToken);
    if (!hasToken) return;
    setLoading(true); setError("");
    try { setProduct(await fetchBillingProduct(productId)); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "商品信息加载失败"); }
    finally { setLoading(false); }
  }, [productId]);

  useEffect(() => { requestKey.current = generateRequestKey(); void load(); }, [load]);
  useEffect(() => onSiteAuthChange(() => void load()), [load]);

  const submit = async () => {
    if (!product || submitting) return;
    if (!requestKey.current) requestKey.current = generateRequestKey();
    setSubmitting(true); setError("");
    try {
      const order = await createBillingOrder(product.id, product.billing_mode === "MONTHLY" ? monthCount : null, requestKey.current);
      router.push(`/my/orders/${order.id}`);
    } catch (reason) {
      if (reason instanceof BillingApiError && reason.status === 401) setAuthenticated(false);
      setError(reason instanceof Error ? reason.message : "订单创建失败，请重试");
    } finally { setSubmitting(false); }
  };

  const estimatedAmount = product ? Number(product.price) * (product.billing_mode === "MONTHLY" ? monthCount : 1) : 0;
  return <div className="billing-page billing-order-page">
    <Link className="billing-back-link" href={`/products/${productId}`}><ArrowLeft size={17} />返回商品详情</Link>
    <div className="billing-page-heading"><div><span className="billing-eyebrow">确认订单</span><h1>核对购买信息</h1></div></div>
    {authenticated === null || loading ? <OrderState title="正在加载购买信息"><LoaderCircle className="billing-spin" size={24} /></OrderState> : null}
    {authenticated === false ? <LoginRequired returnTo={`/orders/confirm?product_id=${productId}`} /> : null}
    {authenticated && error && !product ? <OrderState title={error} type="error"><button className="billing-secondary-button" onClick={() => void load()} type="button"><RefreshCw size={16} />重新加载</button></OrderState> : null}
    {authenticated && product ? <div className="billing-confirm-layout">
      <section className="billing-confirm-main">
        <div className="billing-card-top"><span className={`billing-mode billing-mode-${product.billing_mode.toLowerCase()}`}>{product.billing_mode === "MONTHLY" ? "按月固定费用" : "固定面额预充值"}</span><span className="billing-code">{product.product_code}</span></div>
        <h2>{product.name}</h2><p>{product.description || "暂无商品说明"}</p>
        <dl><div><dt>服务</dt><dd>{product.service_name}</dd></div><div><dt>服务供应商</dt><dd>{product.supplier_name}</dd></div><div><dt>商品单价</dt><dd>¥ {formatMoney(product.price)}{product.billing_mode === "MONTHLY" ? " / 月" : ""}</dd></div></dl>
        {product.billing_mode === "MONTHLY" ? <MonthCountPicker value={monthCount} onChange={setMonthCount} /> : <div className="billing-fixed-amount"><span className="billing-field-label">充值面额</span><strong>¥ {formatMoney(product.price)}</strong></div>}
      </section>
      <aside className="billing-confirm-summary"><span>预计订单金额</span><strong>¥ {formatMoney(estimatedAmount.toFixed(2))}</strong>{product.billing_mode === "MONTHLY" ? <p>{formatMoney(product.price)} 元/月 × {monthCount} 个月</p> : <p>固定充值面额</p>}{error ? <div className="billing-inline-error"><AlertCircle size={15} />{error}</div> : null}<button disabled={submitting} onClick={() => void submit()} type="button"><ShoppingCart size={17} />{submitting ? "正在创建订单" : "确认并生成订单"}</button><small>提交后请在 30 分钟内完成支付，超时将自动取消</small></aside>
    </div> : null}
  </div>;
}

export function BillingOrdersPage() {
  const pathname = usePathname();
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [status, setStatus] = useState<BillingOrderStatus | "ALL">("ALL");
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<BillingOrder[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [confirmCancelId, setConfirmCancelId] = useState<number | null>(null);
  const [cancelingId, setCancelingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    const hasToken = Boolean(getSiteAuthToken()); setAuthenticated(hasToken);
    if (!hasToken) return;
    setLoading(true); setError("");
    try { const result = await fetchBillingOrders(page, 10, status === "ALL" ? undefined : status); setItems(result.items); setTotal(result.total); }
    catch (reason) { if (reason instanceof BillingApiError && reason.status === 401) setAuthenticated(false); else setError(reason instanceof Error ? reason.message : "订单加载失败"); }
    finally { setLoading(false); }
  }, [page, status]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => onSiteAuthChange(() => void load()), [load]);

  const cancel = async (orderId: number) => {
    setCancelingId(orderId); setError("");
    try { const updated = await cancelBillingOrder(orderId); setItems((current) => current.map((item) => item.id === orderId ? updated : item)); setConfirmCancelId(null); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "取消订单失败"); }
    finally { setCancelingId(null); }
  };

  const handleListExpire = useCallback(() => {
    window.setTimeout(() => { void load(); }, 800);
  }, [load]);

  const pageCount = Math.max(1, Math.ceil(total / 10));
  return <div className="billing-page billing-order-page">
    <div className="billing-page-heading"><div><span className="billing-eyebrow">订单中心</span><h1>我的订单</h1></div><Link className="billing-primary-button" href="/products"><ShoppingCart size={16} />继续选购</Link></div>
    <div className="billing-segmented billing-order-status-filter" aria-label="订单状态筛选" role="group">{statusOptions.map((option) => <button aria-pressed={status === option.value} className={status === option.value ? "active" : ""} key={option.value} onClick={() => { setStatus(option.value); setPage(1); }} type="button">{option.label}</button>)}</div>
    {authenticated === null || loading ? <OrderState title="正在加载订单"><LoaderCircle className="billing-spin" size={24} /></OrderState> : null}
    {authenticated === false ? <LoginRequired returnTo={pathname || "/my/orders"} /> : null}
    {authenticated && error ? <div className="billing-inline-error billing-list-error"><AlertCircle size={16} />{error}<button onClick={() => void load()} type="button">重试</button></div> : null}
    {authenticated && !loading && !error && items.length === 0 ? <OrderState title="暂无符合条件的订单"><Link className="billing-primary-button" href="/products">前往选购</Link></OrderState> : null}
    {authenticated && !loading && items.length > 0 ? <div className="billing-order-list">{items.map((order) => {
      const expiresAt = resolveExpiresAt(order);
      return <article className="billing-order-card" key={order.id}><header><div><span className={statusClass(order.status)}>{statusLabels[order.status]}</span><strong>{order.order_no}</strong></div><time>{formatDateTime(order.created_at)}</time></header><div className="billing-order-card-body"><div><span>{order.billing_mode === "MONTHLY" ? "按月" : "预充值"}</span><h2>{order.product_name}</h2><p>{order.service_name} · {order.supplier_name}</p>{order.month_count ? <small><CalendarDays size={14} />{order.month_count} 个月，{order.service_start_date} 至 {order.service_end_date}</small> : null}{expiresAt ? <small className="billing-order-countdown-line"><PaymentCountdown compact expiresAt={expiresAt} onExpire={handleListExpire} /></small> : null}</div><div className="billing-order-card-amount"><span>订单金额</span><strong>¥ {formatMoney(order.order_amount)}</strong></div></div><footer><Link className="billing-secondary-button" href={`/my/orders/${order.id}`}>查看详情</Link>{canPay(order.status) ? <Link className="billing-primary-button" href={`/my/orders/${order.id}`}><WalletCards size={15} />{order.status === "PAYMENT_FAILED" ? "重新支付" : "去支付"}</Link> : null}{canCancel(order.status) ? confirmCancelId === order.id ? <div className="billing-cancel-confirm"><span>确认取消？</span><button disabled={cancelingId === order.id} onClick={() => void cancel(order.id)} type="button">确认</button><button onClick={() => setConfirmCancelId(null)} type="button">返回</button></div> : <button className="billing-danger-button" onClick={() => setConfirmCancelId(order.id)} type="button"><XCircle size={15} />取消订单</button> : null}</footer></article>;
    })}</div> : null}
    {authenticated && total > 10 ? <div className="billing-pagination"><button disabled={page <= 1} onClick={() => setPage((value) => value - 1)} type="button">上一页</button><span>第 {page} / {pageCount} 页，共 {total} 条</span><button disabled={page >= pageCount} onClick={() => setPage((value) => value + 1)} type="button">下一页</button></div> : null}
  </div>;
}

export function BillingOrderDetailPage({ orderId }: { orderId: number }) {
  const pathname = usePathname();
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [order, setOrder] = useState<BillingOrder | null>(null);
  const [wallet, setWallet] = useState<WalletSummary | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<OrderPaymentMethod>("EXTERNAL");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [paying, setPaying] = useState(false);
  const load = useCallback(async () => {
    const hasToken = Boolean(getSiteAuthToken());
    setAuthenticated(hasToken);
    if (!hasToken) return;
    setLoading(true);
    setError("");
    try {
      const [orderData, walletData] = await Promise.all([fetchBillingOrder(orderId), fetchWalletSummary().catch(() => null)]);
      setOrder(orderData);
      setWallet(walletData);
      if (walletData && Number(walletData.current_balance) >= Number(orderData.order_amount)) {
        setPaymentMethod("WALLET");
      } else {
        setPaymentMethod("EXTERNAL");
      }
    } catch (reason) {
      if (reason instanceof BillingApiError && reason.status === 401) setAuthenticated(false);
      else setError(reason instanceof Error ? reason.message : "订单详情加载失败");
    } finally {
      setLoading(false);
    }
  }, [orderId]);
  useEffect(() => { void load(); }, [load]);
  useEffect(() => onSiteAuthChange(() => void load()), [load]);
  const cancel = async () => {
    setCanceling(true);
    setError("");
    try {
      setOrder(await cancelBillingOrder(orderId));
      setConfirmCancel(false);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "取消订单失败");
    } finally {
      setCanceling(false);
    }
  };
  const handleDetailExpire = useCallback(() => {
    window.setTimeout(() => { void load(); }, 800);
  }, [load]);

  const pay = async () => {
    setPaying(true);
    setError("");
    try {
      const result = await launchPayment(orderId, paymentMethod);
      if (paymentMethod === "WALLET" || result.payment_method === "WALLET" || !result.checkout_url) {
        setOrder(await fetchBillingOrder(orderId));
        setWallet(await fetchWalletSummary().catch(() => null));
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "发起支付失败");
    } finally {
      setPaying(false);
    }
  };

  const detailExpiresAt = order ? resolveExpiresAt(order) : null;

  return <div className="billing-page billing-order-page"><Link className="billing-back-link" href="/my/orders"><ArrowLeft size={17} />返回我的订单</Link>
    {authenticated === null || loading ? <OrderState title="正在加载订单详情"><LoaderCircle className="billing-spin" size={24} /></OrderState> : null}
    {authenticated === false ? <LoginRequired returnTo={pathname || `/my/orders/${orderId}`} /> : null}
    {authenticated && error && !order ? <OrderState title={error} type="error"><button className="billing-secondary-button" onClick={() => void load()} type="button"><RefreshCw size={16} />重新加载</button></OrderState> : null}
    {authenticated && order ? <article className="billing-order-detail">
      <header>
        <div><span className={statusClass(order.status)}>{statusLabels[order.status]}</span><h1>{order.product_name}</h1><p>订单号：{order.order_no}</p></div>
        <div><span>订单金额</span><strong>¥ {formatMoney(order.order_amount)}</strong></div>
      </header>
      <OrderSnapshot order={order} />
      <section className="billing-order-timeline">
        <div><span>创建时间</span><strong>{formatDateTime(order.created_at)}</strong></div>
        {order.canceled_at ? <div><span>取消时间</span><strong>{formatDateTime(order.canceled_at)}</strong></div> : null}
        {order.paid_at ? <div><span>支付时间</span><strong>{formatDateTime(order.paid_at)}</strong></div> : null}
        {detailExpiresAt ? <div><span>支付截止</span><strong>{formatDateTime(detailExpiresAt)}</strong></div> : null}
      </section>
      {detailExpiresAt ? <PaymentCountdown expiresAt={detailExpiresAt} onExpire={handleDetailExpire} /> : null}
      {canPay(order.status) ? <PaymentMethodPicker method={paymentMethod} onChange={setPaymentMethod} orderAmount={order.order_amount} walletBalance={wallet?.current_balance ?? null} /> : null}
      <PaymentAttempts transactions={order.payment_transactions || []} />
      {error ? <div className="billing-inline-error"><AlertCircle size={15} />{error}</div> : null}
      <footer>
        <Link className="billing-secondary-button" href="/products">继续选购</Link>
        {canPay(order.status) ? <button className="billing-primary-button" disabled={paying || (paymentMethod === "WALLET" && (!wallet || Number(wallet.current_balance) < Number(order.order_amount)))} onClick={() => void pay()} type="button">
          {paymentMethod === "WALLET" ? <Wallet size={16} /> : <CreditCard size={16} />}
          {paying ? "处理中" : paymentMethod === "WALLET" ? "余额支付" : order.status === "PAYMENT_FAILED" ? "重新支付" : "在线支付"}
        </button> : null}
        {canCancel(order.status) ? confirmCancel ? <div className="billing-cancel-confirm"><span>取消后不可恢复，确认取消？</span><button disabled={canceling} onClick={() => void cancel()} type="button">{canceling ? "处理中" : "确认取消"}</button><button onClick={() => setConfirmCancel(false)} type="button">返回</button></div> : <button className="billing-danger-button" onClick={() => setConfirmCancel(true)} type="button"><XCircle size={15} />取消订单</button> : null}
      </footer>
    </article> : null}
  </div>;
}

export function BillingOrderPaymentResultPage() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const orderId = Number(searchParams.get("order_id"));
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [statusData, setStatusData] = useState<BillingOrderPaymentStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [timedOut, setTimedOut] = useState(false);
  const startTimeRef = useRef<number>(0);

  const load = useCallback(async (silent = false) => {
    const hasToken = Boolean(getSiteAuthToken()); setAuthenticated(hasToken);
    if (!hasToken) { setLoading(false); return; }
    if (!Number.isSafeInteger(orderId) || orderId <= 0) { setError("订单参数不合法"); setLoading(false); return; }
    if (!silent) setLoading(true);
    try {
      const result = await fetchBillingOrderPaymentStatus(orderId);
      setStatusData(result);
      setError("");
    } catch (reason) {
      if (reason instanceof BillingApiError && reason.status === 401) setAuthenticated(false);
      setError(reason instanceof Error ? reason.message : "支付状态查询失败");
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    startTimeRef.current = Date.now();
    void load();
  }, [load]);
  useEffect(() => onSiteAuthChange(() => void load()), [load]);
  useEffect(() => {
    if (!statusData) return;
    if (statusData.order_status === "PAID" || statusData.order_status === "PAYMENT_FAILED" || statusData.order_status === "CANCELED") return;
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

  const title = statusData?.order_status === "PAID"
    ? "支付已确认"
    : statusData?.order_status === "PAYMENT_FAILED"
      ? "支付未成功"
      : statusData?.order_status === "CANCELED"
        ? "订单已取消"
        : timedOut
          ? "结果确认中"
          : "正在确认支付结果";

  return <div className="billing-page billing-order-page">
    <Link className="billing-back-link" href="/my/orders"><ArrowLeft size={17} />返回我的订单</Link>
    {authenticated === null || loading ? <OrderState title="正在确认支付结果"><LoaderCircle className="billing-spin" size={24} /></OrderState> : null}
    {authenticated === false ? <LoginRequired returnTo={`${pathname || "/orders/payment-result"}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`} /> : null}
    {authenticated && error && !statusData ? <OrderState title={error} type="error"><button className="billing-secondary-button" onClick={() => void load()} type="button"><RefreshCw size={16} />重新查询</button></OrderState> : null}
    {authenticated && !loading && statusData ? <section className="billing-payment-result">
      <div className="billing-result-hero">
        <span className={`billing-result-icon billing-result-icon-${statusData.order_status.toLowerCase().replace("_", "-")}`}>{statusData.order_status === "PAID" ? <CheckCircle2 size={28} /> : statusData.order_status === "PAYMENT_FAILED" ? <AlertCircle size={28} /> : <LoaderCircle className={timedOut ? "" : "billing-spin"} size={28} />}</span>
        <h1>{title}</h1>
        <p>{statusData.order_status === "PAID" ? "支付已完成。" : timedOut ? "支付结果确认中，可稍后在订单中查看。" : "支付结果确认中…"}</p>
      </div>
      <dl className="billing-result-summary">
        <div><dt>订单号</dt><dd>{statusData.order_no}</dd></div>
        <div><dt>订单状态</dt><dd>{statusLabels[statusData.order_status]}</dd></div>
        <div><dt>最近支付状态</dt><dd>{statusData.latest_payment ? paymentStatusLabels[statusData.latest_payment.status] : "-"}</dd></div>
        <div><dt>支付平台</dt><dd>{statusData.latest_payment?.provider || "-"}</dd></div>
      </dl>
      {statusData.latest_payment ? <PaymentAttempts transactions={[statusData.latest_payment]} /> : null}
      {error ? <div className="billing-inline-error"><AlertCircle size={15} />{error}</div> : null}
      <div className="billing-result-actions">
        <Link className="billing-secondary-button" href={`/my/orders/${statusData.order_id}`}>查看订单详情</Link>
        {statusData.order_status !== "PAID" ? <button className="billing-primary-button" onClick={() => void load()} type="button"><RefreshCw size={16} />刷新状态</button> : null}
      </div>
    </section> : null}
  </div>;
}
