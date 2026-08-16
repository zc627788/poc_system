import { ReloadOutlined, SearchOutlined, UnorderedListOutlined } from "@ant-design/icons";
import { Button, Card, Empty, Input, Space, Statistic, Table, Tag, Typography, message } from "antd";
import type { TableColumnsType } from "antd";
import axios from "axios";
import { useCallback, useEffect, useMemo, useState } from "react";
import { adminApi } from "../api";
import type { ApiResponse, BillingConsumption, BillingConsumptionListData } from "../types";

function errorText(error: unknown) {
  if (axios.isAxiosError(error)) return error.response?.data?.detail || error.message || "请求失败";
  return error instanceof Error ? error.message : "请求失败";
}

function dateTime(value?: string | null) {
  return value ? new Intl.DateTimeFormat("zh-CN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Shanghai" }).format(new Date(value)) : "-";
}

function money(value: string) {
  const normalized = value.trim();
  const negative = normalized.startsWith("-");
  const [rawIntegerPart, rawDecimalPart = "00"] = (negative ? normalized.slice(1) : normalized).split(".");
  const integerPart = rawIntegerPart.replace(/^0+(?=\d)/, "") || "0";
  const decimalPart = rawDecimalPart.padEnd(2, "0").slice(0, 2);
  return `${negative ? "-" : ""}${integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}.${decimalPart}`;
}

function buildDateRange(startDate: string, endDate: string) {
  const startAt = startDate ? new Date(`${startDate}T00:00:00+08:00`).toISOString() : undefined;
  const endAt = endDate ? new Date(`${endDate}T23:59:59+08:00`).toISOString() : undefined;
  return { startAt, endAt };
}

export function BillingConsumptionsPage() {
  const [items, setItems] = useState<BillingConsumption[]>([]);
  const [total, setTotal] = useState(0);
  const [summaryAmount, setSummaryAmount] = useState("0.00");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [userKeyword, setUserKeyword] = useState("");
  const [userKeywordInput, setUserKeywordInput] = useState("");
  const [serviceCode, setServiceCode] = useState("");
  const [supplierName, setSupplierName] = useState("");
  const [orderNo, setOrderNo] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await adminApi.get<ApiResponse<BillingConsumptionListData>>("/admin/billing/consumptions", {
        params: {
          page,
          page_size: pageSize,
          user_keyword: userKeyword || undefined,
          service_code: serviceCode || undefined,
          supplier_name: supplierName || undefined,
          order_no: orderNo || undefined,
          ...buildDateRange(startDate, endDate),
        },
      });
      setItems(response.data.data.items);
      setTotal(response.data.data.total);
      setSummaryAmount(response.data.data.summary.total_amount);
    } catch (error) {
      message.error(errorText(error));
    } finally {
      setLoading(false);
    }
  }, [endDate, orderNo, page, pageSize, serviceCode, startDate, supplierName, userKeyword]);

  useEffect(() => { void load(); }, [load]);

  const columns = useMemo<TableColumnsType<BillingConsumption>>(() => [
    { title: "用户", width: 150, render: (_, item) => <div className="billing-admin-product"><strong>{item.user_name}</strong><span>{item.user_phone_masked}</span></div> },
    { title: "服务", width: 200, render: (_, item) => <div className="billing-admin-product"><strong>{item.service_name}</strong><span>{item.service_code}</span></div> },
    { title: "消费项目", dataIndex: "item_name", width: 160, ellipsis: true },
    { title: "供应商", dataIndex: "supplier_name", width: 150, ellipsis: true },
    { title: "供应商流水号", dataIndex: "supplier_record_no", width: 180, ellipsis: true, render: (value: string) => <Typography.Text copyable>{value}</Typography.Text> },
    { title: "金额", dataIndex: "amount", width: 120, align: "right", render: (value: string) => `¥ ${money(value)}` },
    { title: "数量", width: 110, render: (_, item) => item.quantity ? `${item.quantity}${item.unit || ""}` : "-" },
    { title: "订单", dataIndex: "order_no", width: 180, ellipsis: true, render: (value?: string | null) => value ? <Tag>{value}</Tag> : "-" },
    { title: "消费时间", dataIndex: "consumed_at", width: 160, render: dateTime },
  ], []);

  return <div className="admin-page billing-admin-page">
    <Card className="admin-page-card">
      <div className="admin-page-header">
        <div>
          <h2><UnorderedListOutlined />消费明细</h2>
          <p className="admin-muted">查询已导入的消费记录，并汇总当前筛选范围金额。</p>
        </div>
      </div>
      <div className="billing-stage4-filters">
        <Input allowClear onChange={(event) => setUserKeywordInput(event.target.value)} onPressEnter={() => { setUserKeyword(userKeywordInput.trim()); setPage(1); }} placeholder="用户姓名或手机号" prefix={<SearchOutlined />} value={userKeywordInput} />
        <Input allowClear onChange={(event) => { setServiceCode(event.target.value.trim().toUpperCase()); setPage(1); }} placeholder="服务编码" value={serviceCode} />
        <Input allowClear onChange={(event) => { setSupplierName(event.target.value.trim()); setPage(1); }} placeholder="供应商名称" value={supplierName} />
        <Input allowClear onChange={(event) => { setStartDate(event.target.value); setPage(1); }} placeholder="开始日期" type="date" value={startDate} />
        <Input allowClear onChange={(event) => { setEndDate(event.target.value); setPage(1); }} placeholder="结束日期" type="date" value={endDate} />
        <Input allowClear onChange={(event) => { setOrderNo(event.target.value.trim()); setPage(1); }} placeholder="关联订单号" value={orderNo} />
        <Space>
          <Button icon={<SearchOutlined />} onClick={() => { setUserKeyword(userKeywordInput.trim()); setPage(1); }} type="primary">查询</Button>
          <Button icon={<ReloadOutlined />} onClick={() => { setUserKeywordInput(""); setUserKeyword(""); setServiceCode(""); setSupplierName(""); setStartDate(""); setEndDate(""); setOrderNo(""); setPage(1); }}>重置</Button>
        </Space>
      </div>
      <div className="billing-stage4-stat"><Statistic title="当前筛选消费合计" value={`¥ ${money(summaryAmount)}`} /></div>
      <Table columns={columns} dataSource={items} loading={loading} locale={{ emptyText: <Empty description="暂无消费记录" image={Empty.PRESENTED_IMAGE_SIMPLE} /> }} pagination={{ current: page, pageSize, total, showSizeChanger: true, showTotal: (value) => `共 ${value} 条`, onChange: (nextPage, nextPageSize) => { setPage(nextPage); setPageSize(nextPageSize); } }} rowKey="id" scroll={{ x: 1600 }} size="middle" />
    </Card>
  </div>;
}
