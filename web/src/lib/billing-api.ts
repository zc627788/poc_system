"use client";

import { clearSiteAuth, getSiteAuthHeaders, siteApiBaseUrl } from "@/lib/site-auth";
import type {
  ApiResponse,
  BillingBalance,
  BillingConsumptionList,
  BillingMode,
  BillingOrder,
  BillingOrderList,
  BillingOrderPaymentStatus,
  BillingOrderStatus,
  BillingProduct,
  OrderPaymentMethod,
  PaymentLaunchResponse,
  WalletLedgerList,
  WalletPaymentMethod,
  WalletRechargeLaunchResponse,
  WalletRechargePaymentStatus,
  WalletSummary,
  WalletTransactionList,
  WalletTransactionType,
} from "@/types";

export class BillingApiError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = "BillingApiError";
  }
}

function buildUrl(path: string) {
  const base = siteApiBaseUrl.replace(/\/$/, "");
  if (/^https?:\/\//.test(base)) return `${base}${path}`;
  const origin = typeof window === "undefined" ? "http://127.0.0.1:3000" : window.location.origin;
  return `${origin}${base}${path}`;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(buildUrl(path), {
    ...init,
    headers: {
      ...getSiteAuthHeaders(),
      ...(init?.headers || {}),
    },
    cache: "no-store",
  });
  const result = (await response.json().catch(() => null)) as (ApiResponse<T> & { detail?: string }) | null;
  if (response.status === 401) clearSiteAuth();
  if (!response.ok || !result || result.code !== 0) {
    throw new BillingApiError(result?.detail || result?.message || "商品信息加载失败", response.status);
  }
  return result.data;
}

export function fetchBillingProducts(mode?: BillingMode) {
  const query = mode ? `?billing_mode=${mode}` : "";
  return request<BillingProduct[]>(`/public/billing/products${query}`);
}

export function fetchBillingProduct(productId: number) {
  return request<BillingProduct>(`/public/billing/products/${productId}`);
}

export function createBillingOrder(productId: number, monthCount: number | null, idempotencyKey: string) {
  return request<BillingOrder>("/public/billing/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Idempotency-Key": idempotencyKey },
    body: JSON.stringify({ product_id: productId, ...(monthCount === null ? {} : { month_count: monthCount }) }),
  });
}

export function fetchBillingOrders(page = 1, pageSize = 10, status?: BillingOrderStatus) {
  const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) });
  if (status) params.set("status", status);
  return request<BillingOrderList>(`/public/billing/orders?${params.toString()}`);
}

export function fetchBillingOrder(orderId: number) {
  return request<BillingOrder>(`/public/billing/orders/${orderId}`);
}

export function cancelBillingOrder(orderId: number) {
  return request<BillingOrder>(`/public/billing/orders/${orderId}/cancel`, { method: "POST" });
}

export function payBillingOrder(orderId: number, paymentMethod: OrderPaymentMethod = "EXTERNAL") {
  return request<PaymentLaunchResponse>(`/public/billing/orders/${orderId}/pay`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ payment_method: paymentMethod }),
  });
}

export function fetchBillingOrderPaymentStatus(orderId: number) {
  return request<BillingOrderPaymentStatus>(`/public/billing/orders/${orderId}/payment-status`);
}

export function fetchBillingBalances() {
  return request<BillingBalance[]>("/public/billing/balances");
}

export function fetchBillingConsumptions(
  page = 1,
  pageSize = 10,
  filters?: {
    serviceCode?: string;
    startAt?: string;
    endAt?: string;
    orderNo?: string;
  }
) {
  const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) });
  if (filters?.serviceCode) params.set("service_code", filters.serviceCode);
  if (filters?.startAt) params.set("start_at", filters.startAt);
  if (filters?.endAt) params.set("end_at", filters.endAt);
  if (filters?.orderNo) params.set("order_no", filters.orderNo);
  return request<BillingConsumptionList>(`/public/billing/consumptions?${params.toString()}`);
}

export function fetchWalletSummary() {
  return request<WalletSummary>("/public/wallet/summary");
}

export function fetchWalletRecords(page = 1, pageSize = 10) {
  return request<WalletLedgerList>(`/public/wallet/records?page=${page}&page_size=${pageSize}`);
}

export function fetchWalletTransactions(page = 1, pageSize = 10, transactionType?: WalletTransactionType) {
  const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) });
  if (transactionType) params.set("transaction_type", transactionType);
  return request<WalletTransactionList>(`/public/wallet/transactions?${params.toString()}`);
}

export function launchWalletRecharge(amount: string, paymentMethod: WalletPaymentMethod, idempotencyKey: string) {
  return request<WalletRechargeLaunchResponse>("/public/wallet/recharges/launch", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Idempotency-Key": idempotencyKey },
    body: JSON.stringify({ amount, payment_method: paymentMethod }),
  });
}

export function fetchWalletRechargePaymentStatus(rechargeId: number) {
  return request<WalletRechargePaymentStatus>(`/public/wallet/recharges/${rechargeId}/payment-status`);
}
