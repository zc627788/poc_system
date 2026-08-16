import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import {
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
  primary_button_text?: string;
  secondary_link_type: string;
  secondary_link_value?: string;
  secondary_button_text?: string;
  tags_json?: string;
  meta_json?: string;
  show_on_home: number;
  sort_order: number;
  is_published: number;
};

type ResourceItemsPageProps = {
  resourceTypePreset?: string;
  groupKeyPreset?: string;
  categoryCodePreset?: string;
  titleOverride?: string;
  descriptionOverride?: string;
  lockResourceType?: boolean;
  lockCategory?: boolean;
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
  primary_button_text: "",
  secondary_link_type: "none",
  secondary_link_value: "",
  secondary_button_text: "",
  tags_json: "",
  meta_json: "",
  show_on_home: 1,
  sort_order: 0,
  is_published: 1,
};

const resourceTypeLabelMap = Object.fromEntries(resourceTypeOptions.map((item) => [item.value, item.label]));

function isModelPlazaCategory(categoryCode?: string) {
  return categoryCode === "marketplace_model_plaza";
}

function getTagsJsonPlaceholder(resourceType: string, categoryCode?: string) {
  if (resourceType === "marketplace" && isModelPlazaCategory(categoryCode)) {
    return '例如 ["大语言模型","文本生成"]；会显示为模型卡片底部标签，建议 1-3 个';
  }
  if (resourceType === "mcp_market") {
    return '例如 ["query_train_tickets","book_train_ticket","pay_train_ticket"]，MCP 页面会渲染为能力列表';
  }
  if (resourceType === "api_market") {
    return '例如 ["付费","企业专用","支持MCP"]；免费和付费二选一，其他可选：企业专用、个人高级认证、支持MCP';
  }
  return '例如 ["免费","支持MCP"]';
}

function getMetaJsonPlaceholder(resourceType: string, categoryCode?: string) {
  if (resourceType === "marketplace" && isModelPlazaCategory(categoryCode)) {
    return '例如 {"vendor":"MiniMax","highlight":"MiniMax 高性能大模型，深度推理、工具调用能力强。","logo_text":"MM"}；highlight 会优先作为模型简介展示';
  }
  if (resourceType === "mcp_market") {
    return '例如 {"status":"未开通","tools":["get_weather"],"button_text":"请先创建MCP服务"}';
  }
  return '例如 {"type":"API","owner":"市交通运输局","publish_date":"2025-12-12"}';
}

function getImageUrlPlaceholder(resourceType: string, categoryCode?: string) {
  if (resourceType === "marketplace" && isModelPlazaCategory(categoryCode)) {
    return "模型头像地址，例如 /model-icons/glm-5.svg、/uploads/models/glm-5.png 或 https://...";
  }
  return "如果卡片需要图片可填写";
}

export function ResourceItemsPage({
  resourceTypePreset = "marketplace",
  groupKeyPreset,
  categoryCodePreset,
  titleOverride,
  descriptionOverride,
  lockResourceType = false,
  lockCategory = false,
}: ResourceItemsPageProps = {}) {
  const [form] = Form.useForm<ResourceItemFormValues>();
  const [items, setItems] = useState<ResourceItem[]>([]);
  const [categories, setCategories] = useState<ResourceCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ResourceItem | null>(null);
  const [resourceTypeFilter, setResourceTypeFilter] = useState<string>(resourceTypePreset);
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>(categoryCodePreset);
  const activeCategoryCode = categoryCodePreset || categoryFilter;
  const isModelPlaza = resourceTypeFilter === "marketplace" && isModelPlazaCategory(activeCategoryCode);

  const filteredCategories = useMemo(
    () =>
      categories.filter((item) => {
        if (groupKeyPreset && item.group_key !== groupKeyPreset) {
          return false;
        }
        if (categoryCodePreset && item.code !== categoryCodePreset) {
          return false;
        }
        return true;
      }),
    [categories, categoryCodePreset, groupKeyPreset]
  );

  const visibleItems = useMemo(
    () =>
      items.filter((item) => {
        if (groupKeyPreset && item.category.group_key !== groupKeyPreset) {
          return false;
        }
        if (categoryCodePreset && item.category.code !== categoryCodePreset) {
          return false;
        }
        return true;
      }),
    [categoryCodePreset, groupKeyPreset, items]
  );

  const categoryOptions = useMemo(
    () =>
      filteredCategories.map((item) => ({
        label: item.name,
        value: item.code,
      })),
    [filteredCategories]
  );

  const loadCategories = async (resourceType: string) => {
    const response = await adminApi.get<ApiResponse<ResourceCategory[]>>("/admin/resource-categories", {
      params: { resource_type: resourceType, group_key: groupKeyPreset },
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
          category_code: categoryCodePreset || categoryFilter,
          group_key: groupKeyPreset,
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
  }, [categoryCodePreset, categoryFilter, groupKeyPreset, resourceTypeFilter]);

  useEffect(() => {
    setResourceTypeFilter(resourceTypePreset);
    setCategoryFilter(categoryCodePreset);
  }, [categoryCodePreset, resourceTypePreset]);

  const openCreateModal = async () => {
    setEditingItem(null);
    const loadedCategories = await loadCategories(resourceTypeFilter);
    const availableCategories = loadedCategories.filter((item) => {
      if (groupKeyPreset && item.group_key !== groupKeyPreset) {
        return false;
      }
      if (categoryCodePreset && item.code !== categoryCodePreset) {
        return false;
      }
      return true;
    });
    form.setFieldsValue({
      ...defaultValues,
      resource_type: resourceTypeFilter,
      category_code: categoryCodePreset || availableCategories[0]?.code || "",
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
      primary_button_text: item.primary_button_text || "",
      secondary_link_type: item.secondary_link_type,
      secondary_link_value: item.secondary_link_value || "",
      secondary_button_text: item.secondary_button_text || "",
      tags_json: item.tags_json || "",
      meta_json: item.meta_json || "",
      show_on_home: item.show_on_home,
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
        resource_type: lockResourceType ? resourceTypePreset : values.resource_type,
        category_code: categoryCodePreset || values.category_code,
        icon: values.icon || null,
        image_url: values.image_url || null,
        badge_text: values.badge_text || null,
        price: values.price || null,
        unit_label: values.unit_label || null,
        status_text: values.status_text || null,
        link_value: values.link_value || null,
        primary_button_text: values.primary_button_text || null,
        secondary_link_value: values.secondary_link_value || null,
        secondary_button_text: values.secondary_button_text || null,
        tags_json: values.tags_json || null,
        meta_json: values.meta_json || null,
        show_on_home: values.show_on_home,
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
    { title: "标题", dataIndex: "title", key: "title", width: 140, fixed: "left" },
    {
      title: "分类",
      key: "category",
      width: 100,
      render: (_, record) => <Tag color="blue">{record.category.name}</Tag>,
    },
    { title: "简介", dataIndex: "summary", key: "summary", width: 220, ellipsis: true },
    { title: "图标", dataIndex: "icon", key: "icon", width: 90 },
    {
      title: "状态文案",
      dataIndex: "status_text",
      key: "status_text",
      width: 90,
      render: (value?: string | null) => (value ? <Tag>{value}</Tag> : "-"),
    },
    {
      title: "首页展示",
      dataIndex: "show_on_home",
      key: "show_on_home",
      width: 80,
      render: (value: number) => (value === 1 ? <Tag color="processing">显示</Tag> : <Tag>隐藏</Tag>),
    },
    { title: "排序", dataIndex: "sort_order", key: "sort_order", width: 60 },
    {
      title: "状态",
      dataIndex: "is_published",
      key: "is_published",
      width: 60,
      render: (value: number) => (value === 1 ? <Tag color="success">已发布</Tag> : <Tag>草稿</Tag>),
    },
    {
      title: "操作",
      key: "actions",
      width: 140,
      fixed: "right",
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
        <div className="admin-toolbar" style={{ maxWidth: 1200 }}>
          <div>
            <h2 style={{ marginTop: 0, marginBottom: 8 }}>{titleOverride || "资源条目管理"}</h2>
            <p className="admin-muted" style={{ marginBottom: 0 }}>
              {descriptionOverride || "对应阶段 4 的资源卡片内容，包括资源集市列表、API 市场卡片和 MCP 服务卡片。"}
            </p>
          </div>
          <div className="admin-toolbar-left">
            <Select
              disabled={lockResourceType}
              onChange={(value) => {
                setResourceTypeFilter(value);
                setCategoryFilter(categoryCodePreset);
              }}
              options={resourceTypeOptions}
              style={{ width: 160 }}
              value={resourceTypeFilter}
            />
            <Select
              allowClear
              disabled={lockCategory || Boolean(categoryCodePreset)}
              onChange={(value) => setCategoryFilter(value)}
              options={categoryOptions}
              placeholder="按分类过滤"
              style={{ width: 180 }}
              value={categoryCodePreset || categoryFilter}
            />
            <Button icon={<PlusOutlined />} onClick={() => void openCreateModal()} type="primary">
              新增资源条目
            </Button>
          </div>
        </div>

      </Card>

      <Card className="admin-page-card">
        <Table
          columns={columns}
          dataSource={visibleItems}
          loading={loading}
          pagination={false}
          rowKey="id"
          scroll={{ x: 1120 }}
          tableLayout="fixed"
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
              disabled={lockResourceType}
              onChange={async (value) => {
                const loadedCategories = await loadCategories(value);
                const availableCategories = loadedCategories.filter((item) => {
                  if (groupKeyPreset && item.group_key !== groupKeyPreset) {
                    return false;
                  }
                  if (categoryCodePreset && item.code !== categoryCodePreset) {
                    return false;
                  }
                  return true;
                });
                form.setFieldValue("category_code", categoryCodePreset || availableCategories[0]?.code || "");
              }}
              options={resourceTypeOptions}
            />
          </Form.Item>
          <Form.Item label="归属分类" name="category_code" rules={[{ required: true, message: "请选择归属分类" }]}>
            <Select disabled={lockCategory || Boolean(categoryCodePreset)} options={categoryOptions} />
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
            <Input placeholder={getImageUrlPlaceholder(resourceTypeFilter, activeCategoryCode)} />
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
          <div className="admin-grid-2">
            <Form.Item label="主按钮文案" name="primary_button_text">
              <Input placeholder="例如 立即使用 / 去体验" />
            </Form.Item>
            <Form.Item label="副按钮动作类型" name="secondary_link_type">
              <Select
                options={[
                  { label: "无动作", value: "none" },
                  { label: "站内跳转", value: "internal" },
                  { label: "外部链接", value: "external" },
                ]}
              />
            </Form.Item>
          </div>
          <div className="admin-grid-2">
            <Form.Item label="副按钮跳转值" name="secondary_link_value">
              <Input placeholder="例如 /marketplace 或 https://..." />
            </Form.Item>
            <Form.Item label="副按钮文案" name="secondary_button_text">
              <Input placeholder="例如 详情 / 查看说明" />
            </Form.Item>
          </div>
          <Form.Item label="标签 JSON" name="tags_json">
            <Input.TextArea placeholder={getTagsJsonPlaceholder(resourceTypeFilter, activeCategoryCode)} rows={4} />
          </Form.Item>
          <Form.Item label="扩展 JSON" name="meta_json">
            <Input.TextArea
              placeholder={getMetaJsonPlaceholder(resourceTypeFilter, activeCategoryCode)}
              rows={6}
            />
          </Form.Item>
          <Form.Item label="排序" name="sort_order">
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item label="是否显示在首页" name="show_on_home">
            <Select
              options={[
                { label: "显示", value: 1 },
                { label: "隐藏", value: 0 },
              ]}
            />
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
