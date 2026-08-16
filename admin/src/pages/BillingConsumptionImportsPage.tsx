import { DownloadOutlined, ExclamationCircleOutlined, FileExcelOutlined, ReloadOutlined, UploadOutlined } from "@ant-design/icons";
import { Alert, App, Button, Card, Descriptions, Modal, Pagination, Select, Space, Statistic, Table, Tag, Typography, Upload } from "antd";
import type { TableColumnsType } from "antd";
import type { UploadFile } from "antd/es/upload/interface";
import axios from "axios";
import { useState } from "react";
import { adminApi, downloadAuthorizedFile } from "../api";
import type {
  ApiResponse,
  ConsumptionImportBatch,
  ConsumptionImportBatchDetailData,
  ConsumptionImportRow,
  ConsumptionImportRowStatus,
} from "../types";

const rowStatusLabels: Record<ConsumptionImportRowStatus, string> = {
  VALID: "有效",
  INVALID: "错误",
  IMPORTED: "已导入",
};
const rowStatusColors: Record<ConsumptionImportRowStatus, string> = {
  VALID: "green",
  INVALID: "red",
  IMPORTED: "blue",
};

function errorText(error: unknown) {
  if (axios.isAxiosError(error)) return error.response?.data?.detail || error.message || "请求失败";
  return error instanceof Error ? error.message : "请求失败";
}

function dateTime(value?: string | null) {
  return value ? new Intl.DateTimeFormat("zh-CN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Shanghai" }).format(new Date(value)) : "-";
}

function formatMoney(value?: string | null) {
  if (!value) return "-";
  const normalized = value.trim();
  const negative = normalized.startsWith("-");
  const [rawIntegerPart, rawDecimalPart = "00"] = (negative ? normalized.slice(1) : normalized).split(".");
  const integerPart = rawIntegerPart.replace(/^0+(?=\d)/, "") || "0";
  const decimalPart = rawDecimalPart.padEnd(2, "0").slice(0, 2);
  return `${negative ? "-" : ""}${integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}.${decimalPart}`;
}

export function BillingConsumptionImportsPage() {
  const { message } = App.useApp();
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState<ConsumptionImportBatchDetailData | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [rowStatus, setRowStatus] = useState<ConsumptionImportRowStatus | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);

  const uploadFile = async () => {
    const file = fileList[0]?.originFileObj;
    if (!file) {
      message.warning("请先选择 .xlsx 文件");
      return;
    }
    const formData = new FormData();
    formData.append("file", file);
    setLoading(true);
    try {
      const response = await adminApi.post<ApiResponse<ConsumptionImportBatchDetailData>>(
        "/admin/billing/consumption-imports/preview",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      setDetail(response.data.data);
      setRowStatus(undefined);
      setPage(1);
      setPageSize(response.data.data.page_size);
      message.success("文件已完成预览校验");
    } catch (error) {
      message.error(errorText(error));
    } finally {
      setLoading(false);
    }
  };

  const reloadDetail = async (
    batchId: number,
    options?: { page?: number; pageSize?: number; rowStatus?: ConsumptionImportRowStatus }
  ) => {
    const nextPage = options?.page ?? page;
    const nextPageSize = options?.pageSize ?? pageSize;
    const nextRowStatus = options?.rowStatus ?? rowStatus;
    const response = await adminApi.get<ApiResponse<ConsumptionImportBatchDetailData>>(`/admin/billing/consumption-imports/${batchId}`, {
      params: {
        page: nextPage,
        page_size: nextPageSize,
        row_status: nextRowStatus,
      },
    });
    setDetail(response.data.data);
    setPage(nextPage);
    setPageSize(nextPageSize);
    setRowStatus(nextRowStatus);
  };

  const confirmImport = async () => {
    if (!detail) return;
    Modal.confirm({
      title: "确认导入有效记录",
      icon: <ExclamationCircleOutlined />,
      content: `本次将导入 ${detail.batch.valid_rows} 条有效记录，错误行不会入库。确认继续？`,
      okText: "确认导入",
      cancelText: "取消",
      okButtonProps: { loading: confirming },
      onOk: async () => {
        setConfirming(true);
        try {
          await adminApi.post<ApiResponse<ConsumptionImportBatch>>(`/admin/billing/consumption-imports/${detail.batch.id}/confirm`);
          await reloadDetail(detail.batch.id, { page: 1 });
          message.success("消费明细已导入");
        } catch (error) {
          message.error(errorText(error));
        } finally {
          setConfirming(false);
        }
      },
    });
  };

  const columns: TableColumnsType<ConsumptionImportRow> = [
    { title: "Excel 行号", dataIndex: "row_no", width: 90 },
    { title: "状态", dataIndex: "row_status", width: 90, render: (value: ConsumptionImportRowStatus) => <Tag color={rowStatusColors[value]}>{rowStatusLabels[value]}</Tag> },
    { title: "用户手机号", dataIndex: "user_phone", width: 140 },
    { title: "服务编码", dataIndex: "service_code", width: 140 },
    { title: "供应商流水号", dataIndex: "supplier_record_no", width: 180, ellipsis: true },
    { title: "消费项目", dataIndex: "item_name", width: 170, ellipsis: true },
    { title: "金额", dataIndex: "amount", width: 110, align: "right", render: (value?: string | null) => value ? `¥ ${formatMoney(value)}` : "-" },
    { title: "关联订单", dataIndex: "order_no", width: 190, ellipsis: true, render: (value?: string | null) => value ? <Typography.Text copyable>{value}</Typography.Text> : "-" },
    { title: "错误原因", dataIndex: "error_message", ellipsis: true, render: (value?: string | null) => value || "-" },
  ];

  return <div className="admin-page billing-admin-page">
    <Card className="admin-page-card">
      <div className="admin-page-header">
        <div>
          <h2><FileExcelOutlined />消费导入</h2>
          <p className="admin-muted">按模板上传 `.xlsx`，先预览校验，再确认导入有效记录。</p>
        </div>
      </div>
      <div className="billing-import-toolbar">
        <Space wrap>
          <Button icon={<DownloadOutlined />} onClick={() => void downloadAuthorizedFile("/admin/billing/consumption-imports/template", "opc-consumption-import-template.xlsx")}>下载模板</Button>
          <Upload
            accept=".xlsx"
            beforeUpload={(file) => {
              setFileList([{ uid: file.uid, name: file.name, status: "done", originFileObj: file }]);
              return false;
            }}
            fileList={fileList}
            maxCount={1}
            onRemove={() => { setFileList([]); return true; }}
          >
            <Button icon={<UploadOutlined />}>选择文件</Button>
          </Upload>
          <Button icon={<UploadOutlined />} loading={loading} onClick={() => void uploadFile()} type="primary">上传并预览</Button>
          <Button icon={<ReloadOutlined />} onClick={() => { setFileList([]); setDetail(null); }}>重置</Button>
        </Space>
      </div>
      <Alert message="仅支持第一工作表，单文件最大 10 MB，最多 10000 条数据行。错误行会正常返回预览结果，可下载错误明细继续修正。" showIcon type="info" />
    </Card>

    {detail ? <Card className="admin-page-card">
      <div className="billing-import-summary">
        <Statistic title="总行数" value={detail.batch.total_rows} />
        <Statistic title="有效行" value={detail.batch.valid_rows} />
        <Statistic title="错误行" value={detail.batch.invalid_rows} />
        <Statistic title="已导入" value={detail.batch.imported_rows} />
      </div>
      <Descriptions bordered column={2} size="small">
        <Descriptions.Item label="批次号">{detail.batch.batch_no}</Descriptions.Item>
        <Descriptions.Item label="状态">{detail.batch.status}</Descriptions.Item>
        <Descriptions.Item label="文件名">{detail.batch.file_name}</Descriptions.Item>
        <Descriptions.Item label="SHA-256">{detail.batch.file_sha256}</Descriptions.Item>
        <Descriptions.Item label="上传时间">{dateTime(detail.batch.uploaded_at)}</Descriptions.Item>
        <Descriptions.Item label="过期时间">{dateTime(detail.batch.expires_at)}</Descriptions.Item>
      </Descriptions>
      <div className="billing-import-actions">
        <Space wrap>
          <Button disabled={detail.batch.valid_rows <= 0 || detail.batch.status === "COMPLETED"} loading={confirming} onClick={() => void confirmImport()} type="primary">将导入 {detail.batch.valid_rows} 条有效记录</Button>
          <Button disabled={detail.batch.invalid_rows <= 0} icon={<DownloadOutlined />} onClick={() => void downloadAuthorizedFile(`/admin/billing/consumption-imports/${detail.batch.id}/errors`, `opc-consumption-import-errors-${detail.batch.id}.xlsx`)}>下载错误明细</Button>
          <Select
            allowClear
            onChange={(value) => void reloadDetail(detail.batch.id, { page: 1, rowStatus: value })}
            options={[
              { label: "仅看有效", value: "VALID" },
              { label: "仅看错误", value: "INVALID" },
              { label: "仅看已导入", value: "IMPORTED" },
            ]}
            placeholder="筛选行状态"
            style={{ minWidth: 140 }}
            value={rowStatus}
          />
          <Button icon={<ReloadOutlined />} onClick={() => void reloadDetail(detail.batch.id)}>刷新批次</Button>
        </Space>
      </div>
      <Table columns={columns} dataSource={detail.items} pagination={false} rowKey="id" scroll={{ x: 1400 }} size="middle" />
      <Pagination
        current={page}
        onChange={(nextPage, nextPageSize) => void reloadDetail(detail.batch.id, { page: nextPage, pageSize: nextPageSize })}
        pageSize={pageSize}
        showSizeChanger
        showTotal={(value) => `共 ${value} 条`}
        style={{ marginTop: 16, textAlign: "right" }}
        total={detail.total}
      />
    </Card> : null}
  </div>;
}
