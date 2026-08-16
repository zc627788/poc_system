import { AuditOutlined, ReloadOutlined, SearchOutlined } from "@ant-design/icons";
import { Button, Card, DatePicker, Descriptions, Drawer, Empty, Select, Space, Statistic, Table, Tag, Typography, message } from "antd";
import type { TableColumnsType } from "antd";
import axios from "axios";
import type { Dayjs } from "dayjs";
import { useCallback, useEffect, useMemo, useState } from "react";
import { adminApi } from "../api";
import type {
  ApiResponse,
  PaymentProvider,
  PaymentReconciliationBatch,
  PaymentReconciliationBatchDetailData,
  PaymentReconciliationBatchListData,
  PaymentReconciliationItem,
  PaymentReconciliationResult,
} from "../types";

const resultLabels: Record<PaymentReconciliationResult, string> = {
  MATCHED: "一致",
  AMOUNT_MISMATCH: "金额不一致",
  STATUS_MISMATCH: "状态不一致",
  SYSTEM_ONLY: "系统单边",
  PROVIDER_ONLY: "平台单边",
};
const resultColors: Record<PaymentReconciliationResult, string> = {
  MATCHED: "green",
  AMOUNT_MISMATCH: "orange",
  STATUS_MISMATCH: "gold",
  SYSTEM_ONLY: "red",
  PROVIDER_ONLY: "purple",
};

function errorText(error: unknown) {
  if (axios.isAxiosError(error)) return error.response?.data?.detail || error.message || "请求失败";
  return error instanceof Error ? error.message : "请求失败";
}

function money(value?: string | null) {
  if (!value) return "-";
  return new Intl.NumberFormat("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(value));
}

function dateTime(value?: string | null) {
  return value ? new Intl.DateTimeFormat("zh-CN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "-";
}

export function BillingReconciliationsPage() {
  const [provider] = useState<PaymentProvider>("MOCK");
  const [statementDate, setStatementDate] = useState<Dayjs | null>(null);
  const [appliedDate, setAppliedDate] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);
  const [items, setItems] = useState<PaymentReconciliationBatch[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [detail, setDetail] = useState<PaymentReconciliationBatchDetailData | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailResult, setDetailResult] = useState<PaymentReconciliationResult | undefined>();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await adminApi.get<ApiResponse<PaymentReconciliationBatchListData>>("/admin/billing/reconciliations", {
        params: { page, page_size: pageSize, provider, statement_date: appliedDate },
      });
      setItems(response.data.data.items);
      setTotal(response.data.data.total);
    } catch (error) {
      message.error(errorText(error));
    } finally {
      setLoading(false);
    }
  }, [appliedDate, page, pageSize, provider]);

  useEffect(() => { void load(); }, [load]);

  const run = async () => {
    if (!statementDate) {
      message.warning("请选择对账日期");
      return;
    }
    setRunning(true);
    try {
      await adminApi.post<ApiResponse<PaymentReconciliationBatch>>("/admin/billing/reconciliations", {
        provider,
        statement_date: statementDate.format("YYYY-MM-DD"),
      });
      message.success("对账已完成");
      setAppliedDate(statementDate.format("YYYY-MM-DD"));
      setPage(1);
      await load();
    } catch (error) {
      message.error(errorText(error));
    } finally {
      setRunning(false);
    }
  };

  const openDetail = async (batchId: number, result?: PaymentReconciliationResult) => {
    setDetailLoading(true);
    try {
      const response = await adminApi.get<ApiResponse<PaymentReconciliationBatchDetailData>>(`/admin/billing/reconciliations/${batchId}`, {
        params: { page: 1, page_size: 100, result },
      });
      setDetail(response.data.data);
      setDetailResult(result);
    } catch (error) {
      message.error(errorText(error));
    } finally {
      setDetailLoading(false);
    }
  };

  const columns = useMemo<TableColumnsType<PaymentReconciliationBatch>>(() => [
    { title: "支付平台", dataIndex: "provider", width: 90 },
    { title: "对账日期", dataIndex: "statement_date", width: 120 },
    { title: "平台笔数", dataIndex: "provider_total_count", width: 100 },
    { title: "平台金额", dataIndex: "provider_total_amount", width: 130, align: "right", render: (value: string) => `¥ ${money(value)}` },
    { title: "系统笔数", dataIndex: "system_total_count", width: 100 },
    { title: "系统金额", dataIndex: "system_total_amount", width: 130, align: "right", render: (value: string) => `¥ ${money(value)}` },
    { title: "结果汇总", width: 300, render: (_, item) => <Space size={[6, 6]} wrap><Tag color="green">一致 {item.matched_count}</Tag><Tag color="orange">金额差异 {item.amount_mismatch_count}</Tag><Tag color="gold">状态差异 {item.status_mismatch_count}</Tag><Tag color="red">系统单边 {item.system_only_count}</Tag><Tag color="purple">平台单边 {item.provider_only_count}</Tag></Space> },
    { title: "执行时间", dataIndex: "executed_at", width: 160, render: dateTime },
    { title: "操作", width: 80, render: (_, item) => <Button onClick={() => void openDetail(item.id)} type="link">查看</Button> },
  ], []);

  const detailColumns = useMemo<TableColumnsType<PaymentReconciliationItem>>(() => [
    { title: "结果", dataIndex: "result", width: 120, render: (value: PaymentReconciliationResult) => <Tag color={resultColors[value]}>{resultLabels[value]}</Tag> },
    { title: "商户支付号", dataIndex: "payment_no", width: 210, ellipsis: true, render: (value?: string | null) => value ? <Typography.Text code copyable>{value}</Typography.Text> : "-" },
    { title: "平台交易号", dataIndex: "provider_transaction_no", width: 220, ellipsis: true, render: (value?: string | null) => value ? <Typography.Text copyable>{value}</Typography.Text> : "-" },
    { title: "订单号", dataIndex: "order_no", width: 210, ellipsis: true, render: (value?: string | null) => value ? <Typography.Text copyable>{value}</Typography.Text> : "-" },
    { title: "系统金额", dataIndex: "system_amount", width: 120, align: "right", render: (value?: string | null) => value ? `¥ ${money(value)}` : "-" },
    { title: "平台金额", dataIndex: "provider_amount", width: 120, align: "right", render: (value?: string | null) => value ? `¥ ${money(value)}` : "-" },
    { title: "系统状态", dataIndex: "system_status", width: 110, render: (value?: string | null) => value || "-" },
    { title: "平台状态", dataIndex: "provider_status", width: 110, render: (value?: string | null) => value || "-" },
    { title: "差异说明", dataIndex: "difference_message", ellipsis: true, render: (value?: string | null) => value || "-" },
  ], []);

  return <div className="admin-page billing-admin-page"><Card className="admin-page-card">
    <div className="admin-page-header"><div><h2><AuditOutlined />支付对账</h2><p className="admin-muted">按日拉取 Mock 支付账单，与系统支付尝试做只读差异比对。</p></div></div>
    <div className="billing-order-admin-filters">
      <Select disabled value={provider} options={[{ value: "MOCK", label: "MOCK" }]} />
      <DatePicker onChange={setStatementDate} placeholder="选择对账日期" value={statementDate} />
      <Space>
        <Button icon={<AuditOutlined />} loading={running} onClick={run} type="primary">发起对账</Button>
        <Button icon={<SearchOutlined />} onClick={() => { setAppliedDate(statementDate?.format("YYYY-MM-DD")); setPage(1); }}>查询</Button>
        <Button icon={<ReloadOutlined />} onClick={() => { setStatementDate(null); setAppliedDate(undefined); setPage(1); }}>重置</Button>
      </Space>
    </div>
    <Table columns={columns} dataSource={items} loading={loading} locale={{ emptyText: <Empty description="暂无对账记录" image={Empty.PRESENTED_IMAGE_SIMPLE} /> }} pagination={{ current: page, pageSize, total, showSizeChanger: true, showTotal: (value) => `共 ${value} 条`, onChange: (nextPage, nextPageSize) => { setPage(nextPage); setPageSize(nextPageSize); } }} rowKey="id" scroll={{ x: 1500 }} size="middle" />
  </Card><Drawer onClose={() => setDetail(null)} open={detailLoading || Boolean(detail)} title="对账详情" width={980}>
    {detail ? <><Space direction="vertical" size={16} style={{ display: "flex" }}>
      <Descriptions bordered column={2} size="small">
        <Descriptions.Item label="支付平台">{detail.batch.provider}</Descriptions.Item>
        <Descriptions.Item label="对账日期">{detail.batch.statement_date}</Descriptions.Item>
        <Descriptions.Item label="平台汇总">{detail.batch.provider_total_count} 笔 / ¥ {money(detail.batch.provider_total_amount)}</Descriptions.Item>
        <Descriptions.Item label="系统汇总">{detail.batch.system_total_count} 笔 / ¥ {money(detail.batch.system_total_amount)}</Descriptions.Item>
        <Descriptions.Item label="执行时间">{dateTime(detail.batch.executed_at)}</Descriptions.Item>
        <Descriptions.Item label="执行人 ID">{detail.batch.executed_by_admin_user_id}</Descriptions.Item>
      </Descriptions>
      <Space wrap>
        <Statistic title="一致" value={detail.batch.matched_count} />
        <Statistic title="金额差异" value={detail.batch.amount_mismatch_count} />
        <Statistic title="状态差异" value={detail.batch.status_mismatch_count} />
        <Statistic title="系统单边" value={detail.batch.system_only_count} />
        <Statistic title="平台单边" value={detail.batch.provider_only_count} />
      </Space>
      <Space wrap>
        <Button onClick={() => detail && void openDetail(detail.batch.id)}>全部</Button>
        {Object.entries(resultLabels).map(([value, label]) => <Button key={value} onClick={() => detail && void openDetail(detail.batch.id, value as PaymentReconciliationResult)} type={detailResult === value ? "primary" : "default"}>{label}</Button>)}
      </Space>
      <Table columns={detailColumns} dataSource={detail.items} locale={{ emptyText: "暂无差异明细" }} pagination={false} rowKey="id" scroll={{ x: 1500 }} size="small" />
    </Space></> : null}
  </Drawer></div>;
}
