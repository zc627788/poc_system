import { EyeOutlined, ReloadOutlined, SearchOutlined, ShoppingCartOutlined } from "@ant-design/icons";
import { Button, Card, DatePicker, Descriptions, Drawer, Empty, Input, Select, Space, Table, Tag, Typography, message } from "antd";
import type { TableColumnsType } from "antd";
import axios from "axios";
import type { Dayjs } from "dayjs";
import { useCallback, useEffect, useMemo, useState } from "react";
import { adminApi } from "../api";
import type { ApiResponse, BillingOrder, BillingOrderListData, BillingOrderStatus, BillingProductListData, PaymentTransactionStatus } from "../types";

const { RangePicker } = DatePicker;
const statusLabels: Record<BillingOrderStatus, string> = { PENDING_PAYMENT: "待支付", PAID: "已支付", CANCELED: "已取消", PAYMENT_FAILED: "支付失败" };
const statusColors: Record<BillingOrderStatus, string> = { PENDING_PAYMENT: "orange", PAID: "green", CANCELED: "default", PAYMENT_FAILED: "red" };
const paymentStatusLabels: Record<PaymentTransactionStatus, string> = { CREATED: "已创建", PENDING: "待支付", SUCCESS: "支付成功", FAILED: "支付失败", CLOSED: "已关闭" };
const paymentStatusColors: Record<PaymentTransactionStatus, string> = { CREATED: "blue", PENDING: "processing", SUCCESS: "green", FAILED: "red", CLOSED: "default" };

function errorText(error: unknown) {
  if (axios.isAxiosError(error)) return error.response?.data?.detail || error.message || "请求失败";
  return error instanceof Error ? error.message : "请求失败";
}

function money(value: string) { return new Intl.NumberFormat("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(value)); }
function dateTime(value?: string | null) { return value ? new Intl.DateTimeFormat("zh-CN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "-"; }

type AppliedFilters = {
  orderNo: string;
  userKeyword: string;
  productId?: number;
  status?: BillingOrderStatus;
  startAt?: string;
  endAt?: string;
};

const emptyFilters: AppliedFilters = { orderNo: "", userKeyword: "" };

export function BillingOrdersPage() {
  const [items, setItems] = useState<BillingOrder[]>([]);
  const [products, setProducts] = useState<Array<{ label: string; value: number }>>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [orderNo, setOrderNo] = useState("");
  const [userKeyword, setUserKeyword] = useState("");
  const [productId, setProductId] = useState<number>();
  const [status, setStatus] = useState<BillingOrderStatus>();
  const [timeRange, setTimeRange] = useState<[Dayjs, Dayjs] | null>(null);
  const [appliedFilters, setAppliedFilters] = useState<AppliedFilters>(emptyFilters);
  const [detail, setDetail] = useState<BillingOrder | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await adminApi.get<ApiResponse<BillingOrderListData>>("/admin/billing/orders", { params: { page, page_size: pageSize, order_no: appliedFilters.orderNo || undefined, user_keyword: appliedFilters.userKeyword || undefined, product_id: appliedFilters.productId, status: appliedFilters.status, start_at: appliedFilters.startAt, end_at: appliedFilters.endAt } });
      setItems(response.data.data.items); setTotal(response.data.data.total);
    } catch (error) { message.error(errorText(error)); }
    finally { setLoading(false); }
  }, [appliedFilters, page, pageSize]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => { void adminApi.get<ApiResponse<BillingProductListData>>("/admin/billing/products", { params: { page: 1, page_size: 100 } }).then((response) => setProducts(response.data.data.items.map((item) => ({ label: `${item.name}（${item.product_code}）`, value: item.id })))).catch(() => setProducts([])); }, []);

  const openDetail = async (orderId: number) => {
    setDetailLoading(true); setDetail(null);
    try { const response = await adminApi.get<ApiResponse<BillingOrder>>(`/admin/billing/orders/${orderId}`); setDetail(response.data.data); }
    catch (error) { message.error(errorText(error)); }
    finally { setDetailLoading(false); }
  };

  const applyFilters = () => {
    setPage(1);
    setAppliedFilters({
      orderNo: orderNo.trim(),
      userKeyword: userKeyword.trim(),
      productId,
      status,
      startAt: timeRange?.[0].startOf("day").toISOString(),
      endAt: timeRange?.[1].endOf("day").toISOString(),
    });
  };

  const resetFilters = () => {
    setOrderNo(""); setUserKeyword(""); setProductId(undefined); setStatus(undefined); setTimeRange(null); setPage(1);
    setAppliedFilters(emptyFilters);
  };

  const columns = useMemo<TableColumnsType<BillingOrder>>(() => [
    { title: "订单号", dataIndex: "order_no", width: 245, ellipsis: true, render: (value: string) => <Typography.Text code copyable>{value}</Typography.Text> },
    { title: "用户", width: 150, render: (_, item) => <div className="billing-admin-product"><strong>{item.user_name}</strong><span>{item.user_phone_masked}</span></div> },
    { title: "商品", width: 220, render: (_, item) => <div className="billing-admin-product"><strong title={item.product_name}>{item.product_name}</strong><span title={item.product_code}>{item.product_code}</span></div> },
    { title: "计费", dataIndex: "billing_mode", width: 95, render: (value) => value === "MONTHLY" ? "按月" : "预充值" },
    { title: "金额", dataIndex: "order_amount", width: 130, align: "right", render: (value: string) => <strong>¥ {money(value)}</strong> },
    { title: "支付渠道", dataIndex: "payment_channel", width: 100, render: (value?: string | null) => value === "WALLET" ? "余额" : value === "EXTERNAL" ? "在线" : "-" },
    { title: "状态", dataIndex: "status", width: 100, render: (value: BillingOrderStatus) => <Tag color={statusColors[value]}>{statusLabels[value]}</Tag> },
    { title: "创建时间", dataIndex: "created_at", width: 165, render: dateTime },
    { title: "操作", fixed: "right", width: 80, render: (_, item) => <Button aria-label={`查看订单 ${item.order_no}`} icon={<EyeOutlined />} onClick={() => void openDetail(item.id)} title="查看详情" type="text" /> },
  ], []);

  return <div className="admin-page billing-admin-page billing-orders-admin-page"><Card className="admin-page-card">
    <div className="admin-page-header"><div><h2><ShoppingCartOutlined />订单管理</h2><p className="admin-muted">查询用户订单和商品快照，本阶段不提供改价、改状态或后台取消。</p></div></div>
    <div className="billing-order-admin-filters"><Input allowClear onChange={(event) => setOrderNo(event.target.value)} onPressEnter={applyFilters} placeholder="订单号" prefix={<SearchOutlined />} value={orderNo} /><Input allowClear onChange={(event) => setUserKeyword(event.target.value)} onPressEnter={applyFilters} placeholder="用户姓名或手机号" value={userKeyword} /><Select allowClear onChange={setProductId} options={products} placeholder="全部商品" showSearch optionFilterProp="label" value={productId} /><Select allowClear onChange={setStatus} options={Object.entries(statusLabels).map(([value, label]) => ({ value, label }))} placeholder="全部状态" value={status} /><RangePicker onChange={(values) => setTimeRange(values?.[0] && values[1] ? [values[0], values[1]] : null)} value={timeRange} /><Space><Button icon={<SearchOutlined />} onClick={applyFilters} type="primary">查询</Button><Button icon={<ReloadOutlined />} onClick={resetFilters}>重置</Button></Space></div>
    <Table columns={columns} dataSource={items} loading={loading} locale={{ emptyText: <Empty description="暂无订单" image={Empty.PRESENTED_IMAGE_SIMPLE} /> }} pagination={{ current: page, pageSize, total, showSizeChanger: true, showTotal: (value) => `共 ${value} 条`, onChange: (nextPage, nextPageSize) => { setPage(nextPage); setPageSize(nextPageSize); } }} rowKey="id" scroll={{ x: 1200 }} size="middle" />
  </Card><Drawer loading={detailLoading} onClose={() => setDetail(null)} open={detailLoading || Boolean(detail)} title="订单详情" width={760}>
    {detail ? <><div className="billing-order-admin-detail-head"><div><Tag color={statusColors[detail.status]}>{statusLabels[detail.status]}</Tag><Typography.Title level={4}>{detail.product_name}</Typography.Title><Typography.Text copyable type="secondary">{detail.order_no}</Typography.Text></div><div><span>订单金额</span><strong>¥ {money(detail.order_amount)}</strong></div></div><Descriptions bordered column={2} size="small"><Descriptions.Item label="用户">{detail.user_name}（{detail.user_phone_masked}）</Descriptions.Item><Descriptions.Item label="用户 ID">{detail.site_user_id}</Descriptions.Item><Descriptions.Item label="商品编码">{detail.product_code}</Descriptions.Item><Descriptions.Item label="原商品 ID">{detail.product_id}</Descriptions.Item><Descriptions.Item label="服务">{detail.service_name}（{detail.service_code}）</Descriptions.Item><Descriptions.Item label="供应商">{detail.supplier_name}</Descriptions.Item><Descriptions.Item label="计费模式">{detail.billing_mode === "MONTHLY" ? "按月固定费用" : "固定面额预充值"}</Descriptions.Item><Descriptions.Item label="支付渠道">{detail.payment_channel === "WALLET" ? "余额支付" : detail.payment_channel === "EXTERNAL" ? "在线支付" : "-"}</Descriptions.Item><Descriptions.Item label="商品单价">¥ {money(detail.unit_price)}</Descriptions.Item><Descriptions.Item label="购买月数">{detail.month_count ? `${detail.month_count} 个月` : "-"}</Descriptions.Item><Descriptions.Item label="服务期">{detail.service_start_date && detail.service_end_date ? `${detail.service_start_date} 至 ${detail.service_end_date}` : "-"}</Descriptions.Item><Descriptions.Item label="创建时间">{dateTime(detail.created_at)}</Descriptions.Item><Descriptions.Item label="更新时间">{dateTime(detail.updated_at)}</Descriptions.Item><Descriptions.Item label="支付时间">{dateTime(detail.paid_at)}</Descriptions.Item><Descriptions.Item label="取消时间">{dateTime(detail.canceled_at)}</Descriptions.Item></Descriptions><div style={{ marginTop: 20 }}><Typography.Title level={5}>支付尝试</Typography.Title><Table columns={[{ title: "商户支付号", dataIndex: "payment_no", render: (value: string) => <Typography.Text code copyable>{value}</Typography.Text> }, { title: "平台", dataIndex: "provider", width: 90 }, { title: "平台交易号", dataIndex: "provider_transaction_no", width: 220, render: (value?: string | null) => value ? <Typography.Text copyable>{value}</Typography.Text> : "-" }, { title: "金额", dataIndex: "amount", width: 120, align: "right", render: (value: string) => `¥ ${money(value)}` }, { title: "状态", dataIndex: "status", width: 100, render: (value: PaymentTransactionStatus) => <Tag color={paymentStatusColors[value]}>{paymentStatusLabels[value]}</Tag> }, { title: "完成时间", dataIndex: "provider_completed_at", width: 160, render: dateTime }, { title: "失败原因", dataIndex: "failure_message", ellipsis: true, render: (value?: string | null) => value || "-" }]} dataSource={detail.payment_transactions || []} locale={{ emptyText: "暂无支付尝试" }} pagination={false} rowKey="id" scroll={{ x: 980 }} size="small" /></div></> : null}
  </Drawer></div>;
}
