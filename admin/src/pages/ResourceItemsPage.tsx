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
import { useEffect, useMemo, useState } from "react";
import { adminApi } from "../api";
import type { ApiResponse, ResourceCategory, ResourceItem } from "../types";

type ResourceItemFormValues = {
  resource_type: string;
  category_code: string;
  title: string;
  summary: string;
  icon?: string;
  image_url?: string;
  badge_text?: string;
  price?: string;
  unit_label?: string;
  status_text?: string;
  link_type: string;
  link_value?: string;
  tags_json?: string;
  meta_json?: string;
  sort_order: number;
  is_published: number;
};

const resourceTypeOptions = [
  { label: "资源集市", value: "marketplace" },
  { label: "API市场", value: "api_market" },
  { label: "MCP市场", value: "mcp_market" },
];

const defaultValues: ResourceItemFormValues = {
  resource_type: "marketplace",
  category_code: "",
  title: "",
  summary: "",
  icon: "",
  image_url: "",
  badge_text: "",
  price: "",
  unit_label: "",
  status_text: "",
  link_type: "none",
  link_value: "",
  tags_json: "",
  meta_json: "",
  sort_order: 0,
  is_published: 1,
};

const resourceTypeLabelMap = Object.fromEntries(resourceTypeOptions.map((item) => [item.value, item.label]));

export function ResourceItemsPage() {
  const [form] = Form.useForm<ResourceItemFormValues>();
  const [items, setItems] = useState<ResourceItem[]>([]);
  const [categories, setCategories] = useState<ResourceCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ResourceItem | null>(null);
  const [resourceTypeFilter, setResourceTypeFilter] = useState<string>("marketplace");
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>(undefined);

  const categoryOptions = useMemo(
    () =>
      categories.map((item) => ({
        label: item.name,
        value: item.code,
      })),
    [categories]
  );

  const loadCategories = async (resourceType: string) => {
    const response = await adminApi.get<ApiResponse<ResourceCategory[]>>("/admin/resource-categories", {
      params: { resource_type: resourceType },
    });
    setCategories(response.data.data);
    return response.data.data;
  };

  const loadItems = async () => {
    setLoading(true);
    try {
      await loadCategories(resourceTypeFilter);
      const response = await adminApi.get<ApiResponse<ResourceItem[]>>("/admin/resource-items", {
        params: {
          resource_type: resourceTypeFilter,
          category_code: categoryFilter,
        },
      });
      setItems(response.data.data);
    } catch (error) {
      console.error("Failed to load resource items", error);
      message.error("资源条目加载失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadItems();
  }, [resourceTypeFilter, categoryFilter]);

  const openCreateModal = async () => {
    setEditingItem(null);
    const loadedCategories = await loadCategories(resourceTypeFilter);
    form.setFieldsValue({
      ...defaultValues,
      resource_type: resourceTypeFilter,
      category_code: loadedCategories[0]?.code || "",
    });
    setOpen(true);
  };

  const openEditModal = async (item: ResourceItem) => {
    setEditingItem(item);
    await loadCategories(item.resource_type);
    form.setFieldsValue({
      resource_type: item.resource_type,
      category_code: item.category.code,
      title: item.title,
      summary: item.summary,
      icon: item.icon || "",
      image_url: item.image_url || "",
      badge_text: item.badge_text || "",
      price: item.price || "",
      unit_label: item.unit_label || "",
      status_text: item.status_text || "",
      link_type: item.link_type,
      link_value: item.link_value || "",
      tags_json: item.tags_json || "",
      meta_json: item.meta_json || "",
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
      await adminApi.delete(`/admin/resource-items/${id}`);
      message.success("资源条目已删除");
      await loadItems();
    } catch (error) {
      console.error("Failed to delete resource item", error);
      message.error("资源条目删除失败");
    }
  };

  const handleSubmit = async (values: ResourceItemFormValues) => {
    setSaving(true);
    try {
      const payload = {
        ...values,
        icon: values.icon || null,
        image_url: values.image_url || null,
        badge_text: values.badge_text || null,
        price: values.price || null,
        unit_label: values.unit_label || null,
        status_text: values.status_text || null,
        link_value: values.link_value || null,
        tags_json: values.tags_json || null,
        meta_json: values.meta_json || null,
      };
      if (editingItem) {
        await adminApi.put(`/admin/resource-items/${editingItem.id}`, payload);
        message.success("资源条目已更新");
      } else {
        await adminApi.post("/admin/resource-items", payload);
        message.success("资源条目已新增");
      }
      closeModal();
      await loadItems();
    } catch (error) {
      console.error("Failed to save resource item", error);
      message.error("资源条目保存失败，请检查 JSON 字段格式");
    } finally {
      setSaving(false);
    }
  };

  const columns: ColumnsType<ResourceItem> = [
    { title: "标题", dataIndex: "title", key: "title", width: 220 },
    {
      title: "分类",
      key: "category",
      width: 160,
      render: (_, record) => <Tag color="blue">{record.category.name}</Tag>,
    },
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
          <Button icon={<EditOutlined />} onClick={() => void openEditModal(record)} type="link">
            编辑
          </Button>
          <Popconfirm onConfirm={() => void handleDelete(record.id)} title="确认删除这个资源条目吗？">
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
            <h2 style={{ marginTop: 0, marginBottom: 8 }}>资源条目管理</h2>
            <p className="admin-muted" style={{ marginBottom: 0 }}>
              对应阶段 4 的资源卡片内容，包括资源集市列表、API 市场卡片和 MCP 服务卡片。
            </p>
          </div>
          <div className="admin-toolbar-left">
            <Select
              onChange={(value) => {
                setResourceTypeFilter(value);
                setCategoryFilter(undefined);
              }}
              options={resourceTypeOptions}
              style={{ width: 160 }}
              value={resourceTypeFilter}
            />
            <Select
              allowClear
              onChange={(value) => setCategoryFilter(value)}
              options={categoryOptions}
              placeholder="按分类过滤"
              style={{ width: 180 }}
              value={categoryFilter}
            />
            <Button icon={<PlusOutlined />} onClick={() => void openCreateModal()} type="primary">
              新增资源条目
            </Button>
          </div>
        </div>

        <Alert
          description={`当前正在维护 ${resourceTypeLabelMap[resourceTypeFilter] || resourceTypeFilter}。tags_json 和 meta_json 需要填写合法 JSON。资源集市里推荐把卡片扩展字段放在 meta_json 里，例如 publish_date、owner、logo_text、items。`}
          message="字段映射提示"
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
          pagination={false}
          rowKey="id"
          scroll={{ x: 1320 }}
        />
      </Card>

      <Modal
        destroyOnHidden
        onCancel={closeModal}
        onOk={() => form.submit()}
        open={open}
        okButtonProps={{ loading: saving }}
        title={editingItem ? "编辑资源条目" : "新增资源条目"}
        width={920}
      >
        <Form form={form} initialValues={defaultValues} layout="vertical" onFinish={handleSubmit} requiredMark={false}>
          <Form.Item label="资源类型" name="resource_type" rules={[{ required: true, message: "请选择资源类型" }]}>
            <Select
              onChange={async (value) => {
                const loadedCategories = await loadCategories(value);
                form.setFieldValue("category_code", loadedCategories[0]?.code || "");
              }}
              options={resourceTypeOptions}
            />
          </Form.Item>
          <Form.Item label="归属分类" name="category_code" rules={[{ required: true, message: "请选择归属分类" }]}>
            <Select options={categoryOptions} />
          </Form.Item>
          <Form.Item label="条目标题" name="title" rules={[{ required: true, message: "请输入条目标题" }]}>
            <Input placeholder="请输入条目标题" />
          </Form.Item>
          <Form.Item label="条目简介" name="summary" rules={[{ required: true, message: "请输入条目简介" }]}>
            <Input.TextArea placeholder="请输入条目简介" rows={4} />
          </Form.Item>
          <Form.Item label="图标名" name="icon">
            <Input placeholder="例如 Database / Zap / Workflow / Cpu / ScanFace" />
          </Form.Item>
          <Form.Item label="图片地址" name="image_url">
            <Input placeholder="如果卡片需要图片可填写" />
          </Form.Item>
          <Form.Item label="徽标文案" name="badge_text">
            <Input placeholder="例如 可租赁 / 限免" />
          </Form.Item>
          <div className="admin-grid-3">
            <Form.Item label="价格" name="price">
              <Input placeholder="例如 4,320" />
            </Form.Item>
            <Form.Item label="价格单位" name="unit_label">
              <Input placeholder="例如 / 月" />
            </Form.Item>
            <Form.Item label="状态文案" name="status_text">
              <Input placeholder="例如 未开通" />
            </Form.Item>
          </div>
          <Form.Item label="跳转类型" name="link_type">
            <Select
              options={[
                { label: "无动作", value: "none" },
                { label: "站内跳转", value: "internal" },
                { label: "外部链接", value: "external" },
              ]}
            />
          </Form.Item>
          <Form.Item label="跳转值" name="link_value">
            <Input placeholder="内部填写 /api-market，外链填写 https://..." />
          </Form.Item>
          <Form.Item label="标签 JSON" name="tags_json">
            <Input.TextArea placeholder='例如 ["免费","支持MCP"]' rows={4} />
          </Form.Item>
          <Form.Item label="扩展 JSON" name="meta_json">
            <Input.TextArea
              placeholder='例如 {"type":"API","owner":"市交通运输局","publish_date":"2025-12-12"}'
              rows={6}
            />
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
