import { ReloadOutlined, SafetyCertificateOutlined, SearchOutlined } from "@ant-design/icons";
import { Button, Card, DatePicker, Empty, Input, Select, Space, Table, Tag, Tooltip, message } from "antd";
import type { TableColumnsType } from "antd";
import axios from "axios";
import type { Dayjs } from "dayjs";
import { useCallback, useEffect, useMemo, useState } from "react";
import { adminApi } from "../api";
import type { AdminTrustedDataspaceRegistration, AdminTrustedDataspaceRegistrationListData, ApiResponse, TrustedDataspaceStatus } from "../types";

const statusLabels: Record<TrustedDataspaceStatus, string> = {
  SUBMITTING: "正在提交",
  PENDING: "待平台审核",
  COMPLETED: "已完成",
  REJECTED: "审核未通过",
  SUBMIT_FAILED: "提交失败",
  SUBMISSION_UNKNOWN: "结果待确认",
};

const statusColors: Record<TrustedDataspaceStatus, string> = {
  SUBMITTING: "processing",
  PENDING: "gold",
  COMPLETED: "green",
  REJECTED: "red",
  SUBMIT_FAILED: "red",
  SUBMISSION_UNKNOWN: "orange",
};

function errorText(error: unknown) {
  if (axios.isAxiosError(error)) return error.response?.data?.detail || error.message || "请求失败";
  return error instanceof Error ? error.message : "请求失败";
}

function dateTime(value?: string | null) {
  return value
    ? new Intl.DateTimeFormat("zh-CN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Shanghai" }).format(new Date(value))
    : "-";
}

export function TrustedDataspaceRegistrationsPage() {
  const [items, setItems] = useState<AdminTrustedDataspaceRegistration[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [keywordInput, setKeywordInput] = useState("");
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState<TrustedDataspaceStatus | undefined>();
  const [updatedRange, setUpdatedRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);
  const [loading, setLoading] = useState(false);
  const [syncingId, setSyncingId] = useState<number | null>(null);

  const load = useCallback(async (background = false) => {
    if (!background) setLoading(true);
    try {
      const response = await adminApi.get<ApiResponse<AdminTrustedDataspaceRegistrationListData>>("/admin/trusted-data-space/registrations", {
        params: {
          page,
          page_size: pageSize,
          keyword: keyword || undefined,
          status,
          start_at: updatedRange?.[0]?.startOf("day").toISOString(),
          end_at: updatedRange?.[1]?.endOf("day").toISOString(),
        },
      });
      setItems(response.data.data.items);
      setTotal(response.data.data.total);
      if (response.data.data.sync_warning) message.warning(response.data.data.sync_warning);
    } catch (error) {
      message.error(errorText(error));
    } finally {
      if (!background) setLoading(false);
    }
  }, [keyword, page, pageSize, status, updatedRange]);

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(true), 30_000);
    return () => window.clearInterval(timer);
  }, [load]);

  const sync = async (id: number) => {
    setSyncingId(id);
    try {
      await adminApi.post(`/admin/trusted-data-space/registrations/${id}/sync`);
      message.success("注册进度已刷新");
      await load();
    } catch (error) {
      message.error(errorText(error));
    } finally {
      setSyncingId(null);
    }
  };

  const columns = useMemo<TableColumnsType<AdminTrustedDataspaceRegistration>>(
    () => [
      {
        title: "OPC用户",
        width: 150,
        render: (_, item) => <div className="billing-admin-product"><strong>{item.site_user_name}</strong><span>{item.site_user_phone_masked}</span></div>,
      },
      { title: "企业名称", dataIndex: "dept_name", width: 220, ellipsis: true },
      { title: "信用代码", dataIndex: "credit_code_masked", width: 190 },
      {
        title: "法人",
        width: 170,
        render: (_, item) => <div className="billing-admin-product"><strong>{item.legal_person_name}</strong><span>{item.legal_person_phone_masked}</span></div>,
      },
      { title: "登录账号", dataIndex: "account", width: 170, ellipsis: true },
      {
        title: "状态",
        dataIndex: "status",
        width: 120,
        render: (value: TrustedDataspaceStatus) => <Tag color={statusColors[value]}>{statusLabels[value]}</Tag>,
      },
      { title: "流程序列号", dataIndex: "seq_no", width: 180, ellipsis: true, render: (value?: string | null) => value || "-" },
      {
        title: "错误信息",
        dataIndex: "last_error_message",
        width: 220,
        ellipsis: true,
        render: (value?: string | null) => value ? <Tooltip title={value}>{value}</Tooltip> : "-",
      },
      { title: "更新时间", dataIndex: "updated_at", width: 170, render: dateTime },
      {
        title: "操作",
        fixed: "right",
        width: 110,
        render: (_, item) => (
          <Button
            disabled={!item.seq_no || item.status === "COMPLETED"}
            icon={<ReloadOutlined spin={syncingId === item.id} />}
            loading={syncingId === item.id}
            onClick={() => void sync(item.id)}
            size="small"
          >
            刷新
          </Button>
        ),
      },
    ],
    [syncingId]
  );

  return (
    <div className="admin-page billing-admin-page">
      <Card className="admin-page-card">
        <div className="admin-page-header">
          <div><h2><SafetyCertificateOutlined /> 可信数据空间注册</h2><p className="admin-muted">查看企业账号创建进度和脱敏错误信息，仅提供状态刷新。</p></div>
        </div>
        <div className="billing-stage4-filters">
          <Input
            allowClear
            onChange={(event) => setKeywordInput(event.target.value)}
            onPressEnter={() => { setKeyword(keywordInput.trim()); setPage(1); }}
            placeholder="用户、企业、账号或信用代码"
            prefix={<SearchOutlined />}
            value={keywordInput}
          />
          <Select
            allowClear
            onChange={(value) => { setStatus(value); setPage(1); }}
            options={Object.entries(statusLabels).map(([value, label]) => ({ value, label }))}
            placeholder="注册状态"
            value={status}
          />
          <DatePicker.RangePicker
            allowClear
            onChange={(value) => { setUpdatedRange(value ? [value[0], value[1]] : null); setPage(1); }}
            placeholder={["更新开始日期", "更新结束日期"]}
            value={updatedRange}
          />
          <Space>
            <Button icon={<SearchOutlined />} onClick={() => { setKeyword(keywordInput.trim()); setPage(1); }} type="primary">查询</Button>
            <Button icon={<ReloadOutlined />} onClick={() => { setKeywordInput(""); setKeyword(""); setStatus(undefined); setUpdatedRange(null); setPage(1); }}>重置</Button>
          </Space>
        </div>
        <Table
          columns={columns}
          dataSource={items}
          loading={loading}
          locale={{ emptyText: <Empty description="暂无可信数据空间注册记录" image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
          pagination={{ current: page, pageSize, total, showSizeChanger: true, showTotal: (value) => `共 ${value} 条`, onChange: (nextPage, nextPageSize) => { setPage(nextPage); setPageSize(nextPageSize); } }}
          rowKey="id"
          scroll={{ x: 1600 }}
          size="middle"
        />
      </Card>
    </div>
  );
}
