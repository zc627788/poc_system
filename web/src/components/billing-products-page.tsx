"use client";

import { AlertCircle, ArrowLeft, Building2, LoaderCircle, PackageOpen, RefreshCw, ShoppingBag, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { BillingApiError, fetchBillingProduct, fetchBillingProducts } from "@/lib/billing-api";
import { getSiteAuthToken, onSiteAuthChange, redirectToIxiaMenLogin } from "@/lib/site-auth";
import type { BillingMode, BillingProduct } from "@/types";

const modeOptions: Array<{ label: string; value: BillingMode | "ALL" }> = [
  { label: "全部", value: "ALL" },
  { label: "按月", value: "MONTHLY" },
  { label: "预充值", value: "PREPAID" },
];

function formatPrice(price: string) {
  return new Intl.NumberFormat("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(price));
}

function LoginRequired() {
  const pathname = usePathname();
  return (
    <StatePanel icon={<ShoppingBag size={26} />} title="登录后查看商品">
      <button className="billing-primary-button" onClick={() => redirectToIxiaMenLogin(pathname || "/products")} type="button">前往登录</button>
    </StatePanel>
  );
}

function StatePanel({ children, icon, title }: { children?: React.ReactNode; icon: React.ReactNode; title: string }) {
  return <div className="billing-state"><span className="billing-state-icon">{icon}</span><h2>{title}</h2>{children}</div>;
}

function Price({ product }: { product: BillingProduct }) {
  return <div className="billing-price"><span>¥</span><strong>{formatPrice(product.price)}</strong><em>{product.billing_mode === "MONTHLY" ? "/ 月" : "固定面额"}</em></div>;
}

function ProductCard({ product }: { product: BillingProduct }) {
  return (
    <article className="billing-product-card">
      <div className="billing-card-top"><span className={`billing-mode billing-mode-${product.billing_mode.toLowerCase()}`}>{product.billing_mode === "MONTHLY" ? "按月付费" : "预充值"}</span><span className="billing-code">{product.product_code}</span></div>
      <div className="billing-service"><Building2 size={15} />{product.service_name}</div>
      <h2 title={product.name}>{product.name}</h2>
      <p>{product.description || "暂无商品说明"}</p>
      <div className="billing-supplier">服务商：<span>{product.supplier_name}</span></div>
      <div className="billing-card-bottom"><Price product={product} /><div className="billing-card-actions"><Link className="billing-secondary-button" href={`/products/${product.id}`}>详情</Link><Link className="billing-detail-link" href={`/orders/confirm?product_id=${product.id}`}><ShoppingCart size={15} />立即购买</Link></div></div>
    </article>
  );
}

export function BillingProductsPage() {
  const [mode, setMode] = useState<BillingMode | "ALL">("ALL");
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [items, setItems] = useState<BillingProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const hasToken = Boolean(getSiteAuthToken());
    setAuthenticated(hasToken);
    if (!hasToken) return;
    setLoading(true); setError("");
    try { setItems(await fetchBillingProducts(mode === "ALL" ? undefined : mode)); }
    catch (reason) {
      if (reason instanceof BillingApiError && reason.status === 401) setAuthenticated(false);
      else setError(reason instanceof Error ? reason.message : "商品信息加载失败");
    } finally { setLoading(false); }
  }, [mode]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => onSiteAuthChange(() => void load()), [load]);

  return (
    <div className="billing-page">
      <div className="billing-page-heading"><div><span className="billing-eyebrow">商品中心</span><h1>选择服务</h1></div></div>
      <div className="billing-segmented" aria-label="计费模式筛选" role="group">{modeOptions.map((option) => <button aria-pressed={mode === option.value} className={mode === option.value ? "active" : ""} key={option.value} onClick={() => setMode(option.value)} type="button">{option.label}</button>)}</div>
      {authenticated === null || loading ? <StatePanel icon={<LoaderCircle className="billing-spin" size={28} />} title="正在加载商品" /> : null}
      {authenticated === false ? <LoginRequired /> : null}
      {authenticated && error ? <StatePanel icon={<AlertCircle size={28} />} title={error}><button className="billing-secondary-button" onClick={() => void load()} type="button"><RefreshCw size={16} />重新加载</button></StatePanel> : null}
      {authenticated && !loading && !error && items.length === 0 ? <StatePanel icon={<PackageOpen size={28} />} title="暂无可购买商品" /> : null}
      {authenticated && !loading && !error && items.length > 0 ? <div className="billing-products-grid">{items.map((item) => <ProductCard key={item.id} product={item} />)}</div> : null}
    </div>
  );
}

export function BillingProductDetailPage({ productId }: { productId: number }) {
  const pathname = usePathname();
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [product, setProduct] = useState<BillingProduct | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notFound, setNotFound] = useState(false);

  const load = useCallback(async () => {
    const hasToken = Boolean(getSiteAuthToken()); setAuthenticated(hasToken);
    if (!hasToken) return;
    setLoading(true); setError(""); setNotFound(false);
    try { setProduct(await fetchBillingProduct(productId)); }
    catch (reason) {
      if (reason instanceof BillingApiError && reason.status === 401) setAuthenticated(false);
      else if (reason instanceof BillingApiError && reason.status === 404) setNotFound(true);
      else setError(reason instanceof Error ? reason.message : "商品详情加载失败");
    } finally { setLoading(false); }
  }, [productId]);
  useEffect(() => { void load(); }, [load]);
  useEffect(() => onSiteAuthChange(() => void load()), [load]);

  return <div className="billing-page"><Link className="billing-back-link" href="/products"><ArrowLeft size={17} />返回商品列表</Link>
    {authenticated === null || loading ? <StatePanel icon={<LoaderCircle className="billing-spin" size={28} />} title="正在加载商品" /> : null}
    {authenticated === false ? <StatePanel icon={<ShoppingBag size={26} />} title="登录后查看商品"><button className="billing-primary-button" onClick={() => redirectToIxiaMenLogin(pathname || `/products/${productId}`)} type="button">前往登录</button></StatePanel> : null}
    {authenticated && notFound ? <StatePanel icon={<PackageOpen size={28} />} title="商品不存在或已下架"><Link className="billing-secondary-button" href="/products">查看其他商品</Link></StatePanel> : null}
    {authenticated && error ? <StatePanel icon={<AlertCircle size={28} />} title={error}><button className="billing-secondary-button" onClick={() => void load()} type="button"><RefreshCw size={16} />重新加载</button></StatePanel> : null}
    {authenticated && !loading && product ? <article className="billing-product-detail"><div className="billing-detail-main"><div className="billing-card-top"><span className={`billing-mode billing-mode-${product.billing_mode.toLowerCase()}`}>{product.billing_mode === "MONTHLY" ? "按月固定费用" : "固定面额预充值"}</span><span className="billing-code">{product.product_code}</span></div><div className="billing-service"><Building2 size={16} />{product.service_name}</div><h1>{product.name}</h1><p>{product.description || "暂无商品说明"}</p><dl><div><dt>服务编码</dt><dd>{product.service_code}</dd></div><div><dt>服务供应商</dt><dd>{product.supplier_name}</dd></div><div><dt>计费方式</dt><dd>{product.billing_mode === "MONTHLY" ? "按月收取固定费用" : "按固定面额充值"}</dd></div><div><dt>币种</dt><dd>人民币（CNY）</dd></div></dl></div><aside className="billing-purchase-panel"><span>商品价格</span><Price product={product} /><Link className="billing-detail-link" href={`/orders/confirm?product_id=${product.id}`}><ShoppingCart size={17} />立即购买</Link></aside></article> : null}
  </div>;
}
