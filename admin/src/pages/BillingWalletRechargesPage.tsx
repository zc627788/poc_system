import { ReloadOutlined, SearchOutlined, WalletOutlined } from "@ant-design/icons";
import { Button, Card, Empty, Input, Select, Space, Table, Tag, message } from "antd";
import type { TableColumnsType } from "antd";
import axios from "axios";
import { useCallback, useEffect, useMemo, useState } from "react";
import { adminApi } from "../api";
import type { AdminWalletRechargeItem, AdminWalletRechargeListData, ApiResponse } from "../types";

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
  return value
    ? new Intl.DateTimeFormat("zh-CN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Shanghai" }).format(new Date(value))
    : "-";
}

const statusLabels: Record<string, string> = {
  PENDING_PAYMENT: "待支付",
  PAID: "已支付",
  CANCELED: "已取消",
  PAYMENT_FAILED: "支付失败",
};

const statusColors: Record<string, string> = {
  PENDING_PAYMENT: "gold",
  PAID: "green",
  CANCELED: "default",
  PAYMENT_FAILED: "red",
};

export function BillingWalletRechargesPage() {
  const [items, setItems] = useState<AdminWalletRechargeItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [userKeyword, setUserKeyword] = useState("");
  const [userKeywordInput, setUserKeywordInput] = useState("");
  const [status, setStatus] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await adminApi.get<ApiResponse<AdminWalletRechargeListData>>("/admin/billing/wallet-recharges", {
        params: {
          page,
          page_size: pageSize,
          user_keyword: userKeyword || undefined,
          status,
        },
      });
      setItems(response.data.data.items);
      setTotal(response.data.data.total);
    } catch (error) {
      message.error(errorText(error));
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, status, userKeyword]);

  useEffect(() => {
    void load();
  }, [load]);

  const columns = useMemo<TableColumnsType<AdminWalletRechargeItem>>(
    () => [
      { title: "充值单号", dataIndex: "recharge_no", width: 210, ellipsis: true },
      {
        title: "用户",
        width: 150,
        render: (_, item) => (
          <div className="billing-admin-product">
            <strong>{item.user_name}</strong>
            <span>{item.user_phone_masked}</span>
          </div>
        ),
      },
      {
        title: "金额",
        dataIndex: "amount",
        width: 120,
        align: "right",
        render: (value: string) => `¥ ${money(value)}`,
      },
      {
        title: "支付方式",
        dataIndex: "payment_method",
        width: 110,
        render: (value: string) => (value === "ALIPAY" ? "支付宝" : "微信支付"),
      },
      {
        title: "状态",
        dataIndex: "status",
        width: 110,
        render: (value: string) => <Tag color={statusColors[value]}>{statusLabels[value] || value}</Tag>,
      },
      { title: "支付时间", dataIndex: "paid_at", width: 160, render: dateTime },
      { title: "创建时间", dataIndex: "created_at", width: 160, render: dateTime },
    ],
    []
  );

  return (
    <div className="admin-page billing-admin-page">
      <Card className="admin-page-card">
        <div className="admin-page-header">
          <div>
            <h2>
              <WalletOutlined /> 钱包充值单
            </h2>
            <p className="admin-muted">查询用户钱包充值订单与支付状态。</p>
          </div>
        </div>
        <div className="billing-stage4-filters">
          <Input
            allowClear
            onChange={(event) => setUserKeywordInput(event.target.value)}
            onPressEnter={() => {
              setUserKeyword(userKeywordInput.trim());
              setPage(1);
            }}
            placeholder="用户姓名或手机号"
            prefix={<SearchOutlined />}
            value={userKeywordInput}
          />
          <Select
            allowClear
            onChange={(value) => {
              setStatus(value);
              setPage(1);
            }}
            options={Object.entries(statusLabels).map(([value, label]) => ({ value, label }))}
            placeholder="状态"
            value={status}
          />
          <Space>
            <Button
              icon={<SearchOutlined />}
              onClick={() => {
                setUserKeyword(userKeywordInput.trim());
                setPage(1);
              }}
              type="primary"
            >
              查询
            </Button>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => {
                setUserKeywordInput("");
                setUserKeyword("");
                setStatus(undefined);
                setPage(1);
              }}
            >
              重置
            </Button>
          </Space>
        </div>
        <Table
          columns={columns}
          dataSource={items}
          loading={loading}
          locale={{ emptyText: <Empty description="暂无充值单" image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            showTotal: (value) => `共 ${value} 条`,
            onChange: (nextPage, nextPageSize) => {
              setPage(nextPage);
              setPageSize(nextPageSize);
            },
          }}
          rowKey="id"
          scroll={{ x: 1100 }}
          size="middle"
        />
      </Card>
    </div>
  );
}
