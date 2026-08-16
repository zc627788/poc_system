import { ReloadOutlined, SearchOutlined, WalletOutlined } from "@ant-design/icons";
import { Button, Card, Empty, Input, Select, Space, Table, Tag, message } from "antd";
import type { TableColumnsType } from "antd";
import axios from "axios";
import { useCallback, useEffect, useMemo, useState } from "react";
import { adminApi } from "../api";
import type { AdminWalletLedgerItem, AdminWalletLedgerListData, ApiResponse } from "../types";

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

const sourceLabels: Record<string, string> = {
  RECHARGE_ORDER: "钱包充值",
  ORDER_PAYMENT: "余额购单",
  PAID_ORDER: "历史入账",
  CONSUMPTION: "历史扣减",
};

export function BillingWalletLedgerPage() {
  const [items, setItems] = useState<AdminWalletLedgerItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [userKeyword, setUserKeyword] = useState("");
  const [userKeywordInput, setUserKeywordInput] = useState("");
  const [entryType, setEntryType] = useState<string | undefined>();
  const [sourceType, setSourceType] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await adminApi.get<ApiResponse<AdminWalletLedgerListData>>("/admin/billing/wallet-ledger", {
        params: {
          page,
          page_size: pageSize,
          user_keyword: userKeyword || undefined,
          entry_type: entryType,
          source_type: sourceType,
        },
      });
      setItems(response.data.data.items);
      setTotal(response.data.data.total);
    } catch (error) {
      message.error(errorText(error));
    } finally {
      setLoading(false);
    }
  }, [entryType, page, pageSize, sourceType, userKeyword]);

  useEffect(() => {
    void load();
  }, [load]);

  const columns = useMemo<TableColumnsType<AdminWalletLedgerItem>>(
    () => [
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
        title: "方向",
        dataIndex: "entry_type",
        width: 90,
        render: (value: string) => <Tag color={value === "CREDIT" ? "green" : "red"}>{value === "CREDIT" ? "入账" : "扣款"}</Tag>,
      },
      {
        title: "类型",
        dataIndex: "source_type",
        width: 110,
        render: (value: string) => sourceLabels[value] || value,
      },
      { title: "标题", dataIndex: "title", width: 220, ellipsis: true },
      {
        title: "金额",
        dataIndex: "amount",
        width: 120,
        align: "right",
        render: (value: string, item) => (
          <strong style={{ color: item.entry_type === "CREDIT" ? "#389e0d" : "#cf1322" }}>
            {item.entry_type === "CREDIT" ? "+" : "-"}¥ {money(value)}
          </strong>
        ),
      },
      { title: "关联单号", dataIndex: "reference_no", width: 180, render: (value?: string | null) => value || "-" },
      { title: "发生时间", dataIndex: "occurred_at", width: 160, render: dateTime },
    ],
    []
  );

  return (
    <div className="admin-page billing-admin-page">
      <Card className="admin-page-card">
        <div className="admin-page-header">
          <div>
            <h2>
              <WalletOutlined /> 钱包流水
            </h2>
            <p className="admin-muted">查询现金钱包充值入账与余额购单扣款记录。</p>
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
              setEntryType(value);
              setPage(1);
            }}
            options={[
              { label: "入账", value: "CREDIT" },
              { label: "扣款", value: "DEBIT" },
            ]}
            placeholder="方向"
            value={entryType}
          />
          <Select
            allowClear
            onChange={(value) => {
              setSourceType(value);
              setPage(1);
            }}
            options={[
              { label: "钱包充值", value: "RECHARGE_ORDER" },
              { label: "余额购单", value: "ORDER_PAYMENT" },
            ]}
            placeholder="类型"
            value={sourceType}
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
                setEntryType(undefined);
                setSourceType(undefined);
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
          locale={{ emptyText: <Empty description="暂无钱包流水" image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
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
