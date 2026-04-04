import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import {
  Alert,
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
  message,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useState } from "react";
import { adminApi } from "../api";
import type { ApiResponse, ServiceItem } from "../types";

type ServiceFormValues = {
  module_key: string;
  title: string;
  summary: string;
  icon?: string;
  target_type: string;
  target_value?: string;
  sort_order: number;
  is_published: number;
};

const defaultValues: ServiceFormValues = {
  module_key: "home_service_entries",
  title: "",
  summary: "",
  icon: "",
  target_type: "internal",
  target_value: "",
  sort_order: 0,
  is_published: 1,
};

export function HomeServicesPage() {
  const [form] = Form.useForm<ServiceFormValues>();
  const [items, setItems] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ServiceItem | null>(null);

  const loadItems = async () => {
    setLoading(true);
    try {
      const response = await adminApi.get<ApiResponse<ServiceItem[]>>("/admin/service-items", {
        params: { module_key: "home_service_entries" },
      });
      setItems(response.data.data);
    } catch (error) {
      console.error("Failed to load service items", error);
      message.error("首页服务入口加载失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadItems();
  }, []);

  const openCreateModal = () => {
    setEditingItem(null);
    form.setFieldsValue(defaultValues);
    setOpen(true);
  };

  const openEditModal = (item: ServiceItem) => {
    setEditingItem(item);
    form.setFieldsValue({
      module_key: item.module_key,
      title: item.title,
      summary: item.summary,
      icon: item.icon || "",
      target_type: item.target_type,
      target_value: item.target_value || "",
      sort_order: item.sort_order,
      is_published: item.is_published,
    });
    setOpen(true);
  };

  const closeModal = () => {
    setOpen(false);
    setEditingItem(null);
  };

  const handleDelete = async (id: number) => {
    try {
      await adminApi.delete(`/admin/service-items/${id}`);
      message.success("首页服务入口已删除");
      await loadItems();
    } catch (error) {
      console.error("Failed to delete service item", error);
      message.error("首页服务入口删除失败");
    }
  };

  const handleSubmit = async (values: ServiceFormValues) => {
    setSaving(true);
    try {
      const payload = { ...values, module_key: "home_service_entries" };
      if (editingItem) {
        await adminApi.put(`/admin/service-items/${editingItem.id}`, payload);
        message.success("首页服务入口已更新");
      } else {
        await adminApi.post("/admin/service-items", payload);
        message.success("首页服务入口已新增");
      }
      closeModal();
      await loadItems();
    } catch (error) {
      console.error("Failed to save service item", error);
      message.error("首页服务入口保存失败");
    } finally {
      setSaving(false);
    }
  };

  const columns: ColumnsType<ServiceItem> = [
    { title: "标题", dataIndex: "title", key: "title", width: 180 },
    { title: "简介", dataIndex: "summary", key: "summary", ellipsis: true },
    { title: "图标", dataIndex: "icon", key: "icon", width: 120 },
    { title: "排序", dataIndex: "sort_order", key: "sort_order", width: 80 },
    {
      title: "状态",
      dataIndex: "is_published",
      key: "is_published",
      width: 100,
      render: (value: number) => (value === 1 ? <Tag color="success">已发布</Tag> : <Tag>草稿</Tag>),
    },
    {
      title: "操作",
      key: "actions",
      width: 150,
      render: (_, record) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => openEditModal(record)} type="link">
            编辑
          </Button>
          <Popconfirm onConfirm={() => void handleDelete(record.id)} title="确认删除这个服务入口吗？">
            <Button danger icon={<DeleteOutlined />} type="link">
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="admin-page">
      <Card className="admin-page-card">
        <div className="admin-toolbar">
          <div>
            <h2 style={{ marginTop: 0, marginBottom: 8 }}>首页服务入口</h2>
            <p className="admin-muted" style={{ marginBottom: 0 }}>
              对应首页右侧 4 张创业服务卡片，标题、简介、图标和跳转都在这里维护。
            </p>
          </div>
          <Button icon={<PlusOutlined />} onClick={openCreateModal} type="primary">
            新增服务入口
          </Button>
        </div>

        <Alert
          description="建议图标沿用 FileCheck / Shield / Home / Coins 这类原型命名，内部跳转值填写 /services、/setup、/financing、/settlement。"
          message="字段映射提示"
          showIcon
          style={{ marginTop: 16 }}
          type="info"
        />
      </Card>

      <Card className="admin-page-card">
        <Table columns={columns} dataSource={items} loading={loading} pagination={false} rowKey="id" />
      </Card>

      <Modal
        destroyOnHidden
        onCancel={closeModal}
        onOk={() => form.submit()}
        open={open}
        okButtonProps={{ loading: saving }}
        title={editingItem ? "编辑首页服务入口" : "新增首页服务入口"}
        width={760}
      >
        <Form form={form} initialValues={defaultValues} layout="vertical" onFinish={handleSubmit} requiredMark={false}>
          <Form.Item label="模块标识" name="module_key">
            <Input disabled />
          </Form.Item>
          <Form.Item label="卡片标题" name="title" rules={[{ required: true, message: "请输入卡片标题" }]}>
            <Input placeholder="例如：OPC开办" />
          </Form.Item>
          <Form.Item label="卡片简介" name="summary" rules={[{ required: true, message: "请输入卡片简介" }]}>
            <Input.TextArea placeholder="请输入卡片简介" rows={4} />
          </Form.Item>
          <Form.Item label="图标名称" name="icon">
            <Input placeholder="例如：FileCheck / Shield / Home / Coins" />
          </Form.Item>
          <Form.Item label="跳转类型" name="target_type">
            <Select
              options={[
                { label: "站内页面", value: "internal" },
                { label: "外部链接", value: "external" },
              ]}
            />
          </Form.Item>
          <Form.Item label="跳转值" name="target_value">
            <Input placeholder="内部填写 /services，外链填写 https://..." />
          </Form.Item>
          <Form.Item label="排序" name="sort_order">
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item label="发布状态" name="is_published">
            <Select
              options={[
                { label: "已发布", value: 1 },
                { label: "草稿", value: 0 },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
