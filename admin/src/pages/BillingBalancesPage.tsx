import { AlertOutlined, ReloadOutlined, SearchOutlined, WalletOutlined } from "@ant-design/icons";
import { Button, Card, Empty, Input, Select, Space, Table, Tag, message } from "antd";
import type { TableColumnsType } from "antd";
import axios from "axios";
import { useCallback, useEffect, useMemo, useState } from "react";
import { adminApi } from "../api";
import type { ApiResponse, BillingBalanceListData, BillingBalanceSummary } from "../types";

function errorText(error: unknown) {
  if (axios.isAxiosError(error)) return error.response?.data?.detail || error.message || "请求失败";
  return error instanceof Error ? error.message : "请求失败";
}

function money(value: string) {
  const normalized = value.trim();
  const negative = normalized.startsWith("-");
  const [rawIntegerPart, rawDecimalPart = "00"] = (negative ? normalized.slice(1) : normalized).split(".");
  const integerPart = rawIntegerPart.replace(/^0+(?=\d)/, "") || "0";
  const decimalPart = rawDecimalPart.padEnd(2, "0").slice(0, 2);
  return `${negative ? "-" : ""}${integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}.${decimalPart}`;
}

function dateTime(value?: string | null) {
  return value ? new Intl.DateTimeFormat("zh-CN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Shanghai" }).format(new Date(value)) : "-";
}

export function BillingBalancesPage() {
  const [items, setItems] = useState<BillingBalanceSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [userKeyword, setUserKeyword] = useState("");
  const [userKeywordInput, setUserKeywordInput] = useState("");
  const [serviceCode, setServiceCode] = useState("");
  const [insufficient, setInsufficient] = useState<"ALL" | "YES" | "NO">("ALL");
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await adminApi.get<ApiResponse<BillingBalanceListData>>("/admin/billing/balances", {
        params: {
          page,
          page_size: pageSize,
          user_keyword: userKeyword || undefined,
          service_code: serviceCode || undefined,
          insufficient: insufficient === "ALL" ? undefined : insufficient === "YES",
        },
      });
      setItems(response.data.data.items);
      setTotal(response.data.data.total);
    } catch (error) {
      message.error(errorText(error));
    } finally {
      setLoading(false);
    }
  }, [insufficient, page, pageSize, serviceCode, userKeyword]);

  useEffect(() => { void load(); }, [load]);

  const columns = useMemo<TableColumnsType<BillingBalanceSummary>>(() => [
    { title: "用户", width: 150, render: (_, item) => <div className="billing-admin-product"><strong>{item.user_name}</strong><span>{item.user_phone_masked}</span></div> },
    { title: "服务", width: 200, render: (_, item) => <div className="billing-admin-product"><strong>{item.service_name}</strong><span>{item.service_code}</span></div> },
    { title: "累计充值", dataIndex: "total_recharged", width: 120, align: "right", render: (value: string) => `¥ ${money(value)}` },
    { title: "累计消费", dataIndex: "total_consumed", width: 120, align: "right", render: (value: string) => `¥ ${money(value)}` },
    { title: "剩余额度", width: 160, align: "right", render: (_, item) => <div><strong style={{ color: item.insufficient ? "#c81e1e" : "#1677ff" }}>¥ {money(item.remaining_balance)}</strong>{item.insufficient ? <div><Tag color="red" icon={<AlertOutlined />}>额度不足</Tag></div> : <div><Tag color="green" icon={<WalletOutlined />}>余额正常</Tag></div>}</div> },
    { title: "最后更新时间", dataIndex: "last_updated_at", width: 160, render: dateTime },
  ], []);

  return <div className="admin-page billing-admin-page">
    <Card className="admin-page-card">
      <div className="admin-page-header">
        <div>
          <h2><WalletOutlined />服务额度</h2>
          <p className="admin-muted">按用户和服务查看预充值服务额度、累计消费和负余额告警（非现金钱包）。</p>
        </div>
      </div>
      <div className="billing-stage4-filters">
        <Input allowClear onChange={(event) => setUserKeywordInput(event.target.value)} onPressEnter={() => { setUserKeyword(userKeywordInput.trim()); setPage(1); }} placeholder="用户姓名或手机号" prefix={<SearchOutlined />} value={userKeywordInput} />
        <Input allowClear onChange={(event) => { setServiceCode(event.target.value.trim().toUpperCase()); setPage(1); }} placeholder="服务编码" value={serviceCode} />
        <Select onChange={(value) => { setInsufficient(value); setPage(1); }} options={[{ label: "全部余额", value: "ALL" }, { label: "仅看额度不足", value: "YES" }, { label: "仅看余额正常", value: "NO" }]} value={insufficient} />
        <Space>
          <Button icon={<SearchOutlined />} onClick={() => { setUserKeyword(userKeywordInput.trim()); setPage(1); }} type="primary">查询</Button>
          <Button icon={<ReloadOutlined />} onClick={() => { setUserKeywordInput(""); setUserKeyword(""); setServiceCode(""); setInsufficient("ALL"); setPage(1); }}>重置</Button>
        </Space>
      </div>
      <Table columns={columns} dataSource={items} loading={loading} locale={{ emptyText: <Empty description="暂无额度流水" image={Empty.PRESENTED_IMAGE_SIMPLE} /> }} pagination={{ current: page, pageSize, total, showSizeChanger: true, showTotal: (value) => `共 ${value} 条`, onChange: (nextPage, nextPageSize) => { setPage(nextPage); setPageSize(nextPageSize); } }} rowKey={(item) => `${item.site_user_id}-${item.service_code}`} scroll={{ x: 1100 }} size="middle" />
    </Card>
  </div>;
}
