import { MessageOutlined } from "@ant-design/icons";
import { Alert, Button, Card, Form, Input, Modal, Select, Space, Table, Tag, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useState } from "react";
import { adminApi } from "../api";
import type { ApiResponse, FeedbackItem } from "../types";

type FeedbackFormValues = {
  status: FeedbackItem["status"];
  admin_reply?: string;
};

const statusOptions = [
  { label: "全部状态", value: "all" },
  { label: "待处理", value: "pending" },
  { label: "处理中", value: "processing" },
  { label: "已解决", value: "resolved" },
  { label: "已拒绝", value: "rejected" },
];

const statusTagColorMap: Record<FeedbackItem["status"], string> = {
  pending: "default",
  processing: "processing",
  resolved: "success",
  rejected: "error",
};

const statusLabelMap: Record<FeedbackItem["status"], string> = {
  pending: "待处理",
  processing: "处理中",
  resolved: "已解决",
  rejected: "已拒绝",
};

function formatDateTime(value?: string | null) {
  if (!value) return "-";
  return value.replace("T", " ").slice(0, 19);
}

export function FeedbacksPage() {
  const [form] = Form.useForm<FeedbackFormValues>();
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [open, setOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<FeedbackItem | null>(null);

  const loadItems = async () => {
    setLoading(true);
    try {
      const response = await adminApi.get<ApiResponse<FeedbackItem[]>>("/admin/feedbacks", {
        params: statusFilter === "all" ? {} : { status: statusFilter },
      });
      setItems(response.data.data);
    } catch (error) {
      console.error("Failed to load feedback list", error);
      message.error("反馈列表加载失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadItems();
  }, [statusFilter]);

  const openHandleModal = (item: FeedbackItem) => {
    setEditingItem(item);
    form.setFieldsValue({
      status: item.status,
      admin_reply: item.admin_reply || "",
    });
    setOpen(true);
  };

  const closeModal = () => {
    setOpen(false);
    setEditingItem(null);
  };

  const handleSubmit = async (values: FeedbackFormValues) => {
    if (!editingItem) {
      return;
    }
    setSaving(true);
    try {
      await adminApi.put(`/admin/feedbacks/${editingItem.id}`, values);
      message.success("反馈处理结果已更新");
      closeModal();
      await loadItems();
    } catch (error) {
      console.error("Failed to update feedback", error);
      message.error("反馈处理更新失败");
    } finally {
      setSaving(false);
    }
  };

  const columns: ColumnsType<FeedbackItem> = [
    { title: "编号", dataIndex: "id", key: "id", width: 80 },
    {
      title: "提交人",
      dataIndex: "submitter_name",
      key: "submitter_name",
      width: 140,
      render: (value?: string | null) => value || "-",
    },
    { title: "主题", dataIndex: "subject", key: "subject", width: 220 },
    {
      title: "反馈内容",
      dataIndex: "content",
      key: "content",
      ellipsis: true,
    },
    { title: "联系电话", dataIndex: "phone", key: "phone", width: 140 },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      width: 110,
      render: (value: FeedbackItem["status"]) => <Tag color={statusTagColorMap[value]}>{statusLabelMap[value]}</Tag>,
    },
    {
      title: "提交时间",
      dataIndex: "created_at",
      key: "created_at",
      width: 170,
      render: (value: string) => formatDateTime(value),
    },
    {
      title: "处理人",
      dataIndex: "handled_by",
      key: "handled_by",
      width: 120,
      render: (value?: string | null) => value || "-",
    },
    {
      title: "操作",
      key: "actions",
      width: 130,
      render: (_, record) => (
        <Button icon={<MessageOutlined />} onClick={() => openHandleModal(record)} type="link">
          处理反馈
        </Button>
      ),
    },
  ];

  return (
    <div className="admin-page">
      <Card className="admin-page-card">
        <div className="admin-toolbar">
          <div>
            <h2 style={{ marginTop: 0, marginBottom: 8 }}>意见反馈管理</h2>
            <p className="admin-muted" style={{ marginBottom: 0 }}>
              统一查看用户反馈，跟进处理状态并记录处理回复。
            </p>
          </div>
          <div className="admin-toolbar-left">
            <Select
              onChange={(value) => setStatusFilter(value)}
              options={statusOptions}
              placeholder="选择状态"
              style={{ width: 160 }}
              value={statusFilter}
            />
            <Button onClick={() => void loadItems()} type="default">
              刷新列表
            </Button>
          </div>
        </div>

        <Alert
          description="阶段 5 反馈闭环说明：用户在前台提交后会写入数据库，运营在后台更新状态和回复。首版附件仅记录文件名称，不上传文件本体。"
          message="处理提示"
          showIcon
          style={{ marginTop: 16 }}
          type="info"
        />
      </Card>

      <Card className="admin-page-card">
        <Table
          columns={columns}
          dataSource={items}
          loading={loading}
          pagination={{ pageSize: 10 }}
          rowKey="id"
          scroll={{ x: 1280 }}
        />
      </Card>

      <Modal
        destroyOnHidden
        onCancel={closeModal}
        onOk={() => form.submit()}
        open={open}
        okButtonProps={{ loading: saving }}
        title="处理反馈"
        width={820}
      >
        <div style={{ marginBottom: 16 }}>
          <p style={{ marginBottom: 6 }}>
            <strong>反馈主题：</strong>
            {editingItem?.subject || "-"}
          </p>
          <p style={{ marginBottom: 6 }}>
            <strong>提交人：</strong>
            {editingItem?.submitter_name || "-"}
          </p>
          <p style={{ marginBottom: 6 }}>
            <strong>联系电话：</strong>
            {editingItem?.phone || "-"}
          </p>
          <p style={{ marginBottom: 0 }}>
            <strong>提交时间：</strong>
            {formatDateTime(editingItem?.created_at)}
          </p>
        </div>

        <Card size="small" style={{ marginBottom: 16 }}>
          <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.8 }}>{editingItem?.content || "-"}</div>
          {editingItem?.attachment_name ? (
            <Space style={{ marginTop: 12 }}>
              <Tag color="blue">附件</Tag>
              <span>{editingItem.attachment_name}</span>
            </Space>
          ) : null}
        </Card>

        <Form form={form} layout="vertical" onFinish={handleSubmit} requiredMark={false}>
          <Form.Item label="处理状态" name="status" rules={[{ required: true, message: "请选择处理状态" }]}>
            <Select options={statusOptions.filter((item) => item.value !== "all")} />
          </Form.Item>
          <Form.Item label="处理回复" name="admin_reply">
            <Input.TextArea placeholder="请输入处理说明（可选）" rows={6} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
