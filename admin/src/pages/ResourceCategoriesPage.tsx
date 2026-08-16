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
import type { ApiResponse, ResourceCategory } from "../types";

type CategoryFormValues = {
  code: string;
  name: string;
  resource_type: string;
  group_key?: string;
  description: string;
  icon?: string;
  image_url?: string;
  display_template: string;
  action_type: string;
  action_value?: string;
  button_text?: string;
  show_on_home: number;
  sort_order: number;
  is_published: number;
};

type ResourceCategoriesPageProps = {
  resourceTypePreset?: string;
  groupKeyPreset?: string;
  categoryCodePreset?: string;
  titleOverride?: string;
  descriptionOverride?: string;
  lockResourceType?: boolean;
  lockGroupKey?: boolean;
};

const resourceTypeOptions = [
  { label: "资源集市", value: "marketplace" },
  { label: "API市场", value: "api_market" },
  { label: "MCP市场", value: "mcp_market" },
];

const groupOptions = [
  { label: "数据", value: "data" },
  { label: "工具包", value: "tools" },
  { label: "算力", value: "compute" },
];

const defaultValues: CategoryFormValues = {
  code: "",
  name: "",
  resource_type: "marketplace",
  group_key: "data",
  description: "",
  icon: "",
  image_url: "",
  display_template: "default",
  action_type: "none",
  action_value: "",
  button_text: "",
  show_on_home: 1,
  sort_order: 0,
  is_published: 1,
};

const resourceTypeLabelMap = Object.fromEntries(resourceTypeOptions.map((item) => [item.value, item.label]));

export function ResourceCategoriesPage({
  resourceTypePreset = "marketplace",
  groupKeyPreset,
  categoryCodePreset,
  titleOverride,
  descriptionOverride,
  lockResourceType = false,
  lockGroupKey = false,
}: ResourceCategoriesPageProps = {}) {
  const [form] = Form.useForm<CategoryFormValues>();
  const [items, setItems] = useState<ResourceCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ResourceCategory | null>(null);
  const [resourceTypeFilter, setResourceTypeFilter] = useState<string>(resourceTypePreset);

  const visibleItems = useMemo(() => {
    return items.filter((item) => {
      if (groupKeyPreset && item.group_key !== groupKeyPreset) {
        return false;
      }
      if (categoryCodePreset && item.code !== categoryCodePreset) {
        return false;
      }
      return true;
    });
  }, [categoryCodePreset, groupKeyPreset, items]);

  const loadItems = async () => {
    setLoading(true);
    try {
      const response = await adminApi.get<ApiResponse<ResourceCategory[]>>("/admin/resource-categories", {
        params: { resource_type: resourceTypeFilter, group_key: groupKeyPreset },
      });
      setItems(response.data.data);
    } catch (error) {
      console.error("Failed to load resource categories", error);
      message.error("资源分类加载失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadItems();
  }, [groupKeyPreset, resourceTypeFilter]);

  useEffect(() => {
    setResourceTypeFilter(resourceTypePreset);
  }, [resourceTypePreset]);

  const openCreateModal = () => {
    setEditingItem(null);
    form.setFieldsValue({
      ...defaultValues,
      code: categoryCodePreset || "",
      resource_type: resourceTypeFilter,
      group_key: resourceTypeFilter === "marketplace" ? groupKeyPreset || defaultValues.group_key : "",
    });
    setOpen(true);
  };

  const openEditModal = (item: ResourceCategory) => {
    setEditingItem(item);
    form.setFieldsValue({
      code: item.code,
      name: item.name,
      resource_type: item.resource_type,
      group_key: item.group_key || "",
      description: item.description,
      icon: item.icon || "",
      image_url: item.image_url || "",
      display_template: item.display_template,
      action_type: item.action_type,
      action_value: item.action_value || "",
      button_text: item.button_text || "",
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
      await adminApi.delete(`/admin/resource-categories/${id}`);
      message.success("资源分类已删除");
      await loadItems();
    } catch (error) {
      console.error("Failed to delete resource category", error);
      message.error("资源分类删除失败");
    }
  };

  const handleSubmit = async (values: CategoryFormValues) => {
    setSaving(true);
    try {
      const payload = {
        ...values,
        resource_type: lockResourceType ? resourceTypePreset : values.resource_type,
        group_key:
          (lockResourceType ? resourceTypePreset : values.resource_type) === "marketplace"
            ? lockGroupKey
              ? groupKeyPreset || null
              : values.group_key || null
            : null,
        icon: values.icon || null,
        image_url: values.image_url || null,
        display_template: values.display_template,
        action_value: values.action_value || null,
        button_text: values.button_text || null,
        show_on_home: values.show_on_home,
      };
      if (editingItem) {
        await adminApi.put(`/admin/resource-categories/${editingItem.id}`, payload);
        message.success("资源分类已更新");
      } else {
        await adminApi.post("/admin/resource-categories", payload);
        message.success("资源分类已新增");
      }
      closeModal();
      await loadItems();
    } catch (error) {
      console.error("Failed to save resource category", error);
      message.error("资源分类保存失败");
    } finally {
      setSaving(false);
    }
  };

  const columns: ColumnsType<ResourceCategory> = [
    { title: "分类名称", dataIndex: "name", key: "name", width: 120 },
    { title: "分类编码", dataIndex: "code", key: "code", width: 180 },
    {
      title: "资源类型",
      dataIndex: "resource_type",
      key: "resource_type",
      width: 80,
      render: (value: string) => <Tag color="blue">{resourceTypeLabelMap[value] || value}</Tag>,
    },
    {
      title: "分组",
      dataIndex: "group_key",
      key: "group_key",
      width: 80,
      render: (value?: string | null) => (value ? <Tag>{value}</Tag> : <span className="admin-muted">-</span>),
    },
    { title: "模板", dataIndex: "display_template", key: "display_template", width: 100 },
    { title: "图标", dataIndex: "icon", key: "icon", width: 80 },
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
      width: 150,
      fixed: "right",
      render: (_, record) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => openEditModal(record)} type="link">
            编辑
          </Button>
          <Popconfirm onConfirm={() => void handleDelete(record.id)} title="确认删除这个资源分类吗？">
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
            <h2 style={{ marginTop: 0, marginBottom: 8 }}>{titleOverride || "资源分类管理"}</h2>
            <p className="admin-muted" style={{ marginBottom: 0 }}>
              {descriptionOverride || "对应阶段 4 的资源集市、API 市场和 MCP 市场的分类入口、分组说明和跳转配置。"}
            </p>
          </div>
          <div className="admin-toolbar-left">
            <Select
              disabled={lockResourceType}
              onChange={setResourceTypeFilter}
              options={resourceTypeOptions}
              style={{ width: 160 }}
              value={resourceTypeFilter}
            />
            <Button icon={<PlusOutlined />} onClick={openCreateModal} type="primary">
              新增资源分类
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
        title={editingItem ? "编辑资源分类" : "新增资源分类"}
        width={860}
      >
        <Form form={form} initialValues={defaultValues} layout="vertical" onFinish={handleSubmit} requiredMark={false}>
          <Form.Item label="分类编码" name="code" rules={[{ required: true, message: "请输入分类编码" }]}>
            <Input placeholder="例如 marketplace_data_center / api_all / mcp_default" />
          </Form.Item>
          <Form.Item label="分类名称" name="name" rules={[{ required: true, message: "请输入分类名称" }]}>
            <Input placeholder="例如 数据资源中心 / 全部 / MCP 服务" />
          </Form.Item>
          <Form.Item label="资源类型" name="resource_type" rules={[{ required: true, message: "请选择资源类型" }]}>
            <Select disabled={lockResourceType} options={resourceTypeOptions} />
          </Form.Item>
          <Form.Item noStyle shouldUpdate={(prev, next) => prev.resource_type !== next.resource_type}>
            {({ getFieldValue }) =>
              getFieldValue("resource_type") === "marketplace" ? (
                <Form.Item label="资源分组" name="group_key">
                  <Select allowClear disabled={lockGroupKey} options={groupOptions} placeholder="请选择分组" />
                </Form.Item>
              ) : null
            }
          </Form.Item>
          <Form.Item label="分类说明" name="description" rules={[{ required: true, message: "请输入分类说明" }]}>
            <Input.TextArea placeholder="请输入分类说明" rows={4} />
          </Form.Item>
          <Form.Item label="图标名" name="icon">
            <Input placeholder="例如 Server / Database / Zap / Workflow / Cpu" />
          </Form.Item>
          <Form.Item label="图片地址" name="image_url">
            <Input placeholder="首页摘要卡片可配置图片或本地静态资源路径" />
          </Form.Item>
          <Form.Item label="展示模板" name="display_template">
            <Select
              options={[
                { label: "默认", value: "default" },
                { label: "数据摘要卡", value: "summary_data" },
                { label: "工具摘要卡", value: "summary_tool" },
                { label: "首页大卡-数据", value: "featured_data" },
                { label: "首页大卡-算力", value: "featured_compute" },
              ]}
            />
          </Form.Item>
          <Form.Item label="按钮动作类型" name="action_type">
            <Select
              options={[
                { label: "无动作", value: "none" },
                { label: "站内跳转", value: "internal" },
                { label: "外部链接", value: "external" },
              ]}
            />
          </Form.Item>
          <Form.Item label="按钮动作值" name="action_value">
            <Input placeholder="内部填写 /api-market，外链填写 https://..." />
          </Form.Item>
          <Form.Item label="按钮文案" name="button_text">
            <Input placeholder="例如 查看详情 / 了解更多" />
          </Form.Item>
          <Form.Item label="是否显示在首页" name="show_on_home">
            <Select
              options={[
                { label: "显示", value: 1 },
                { label: "隐藏", value: 0 },
              ]}
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
