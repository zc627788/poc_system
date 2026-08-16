import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import {
  Button,
  Card,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Select,
  Space,
  Switch,
  Table,
  Tabs,
  Tag,
  message,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs, { Dayjs } from "dayjs";
import { useEffect, useMemo, useState } from "react";
import { adminApi } from "../api";
import type { ApiResponse, ArticleItem } from "../types";

type ArticleFormValues = {
  category_code: string;
  title: string;
  summary: string;
  external_url?: string;
  publish_at: Dayjs | null;
  source_name?: string;
  is_published: boolean;
  sort_order: number;
};

const categoryOptions = [
  { label: "活动通知", value: "activity" },
  { label: "政策文件", value: "policy" },
  { label: "文章信息", value: "article" },
  { label: "申报通知", value: "notice" },
];

const defaultValues: ArticleFormValues = {
  category_code: "activity",
  title: "",
  summary: "",
  external_url: "",
  publish_at: dayjs("2026-04-03 10:00:00"),
  source_name: "",
  is_published: true,
  sort_order: 0,
};

function formatDate(value: string) {
  return value.replace("T", " ").slice(0, 16);
}

function resolveLinkType(url?: string) {
  if (!url) {
    return "internal";
  }

  return /^https?:\/\//i.test(url) ? "external" : "internal";
}

function buildArticlePayload(values: ArticleFormValues) {
  return {
    category_code: values.category_code,
    title: values.title,
    summary: values.summary,
    link_type: resolveLinkType(values.external_url),
    external_url: values.external_url || "",
    publish_at: (values.publish_at || dayjs()).format("YYYY-MM-DDTHH:mm:ss"),
    source_name: values.source_name || "",
    is_top: 0,
    is_published: values.is_published ? 1 : 0,
    sort_order: values.sort_order,
  };
}

export function ArticlesPage() {
  const [form] = Form.useForm<ArticleFormValues>();
  const [items, setItems] = useState<ArticleItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ArticleItem | null>(null);
  const [activeTab, setActiveTab] = useState("activity");

  const loadItems = async () => {
    setLoading(true);
    try {
      const response = await adminApi.get<ApiResponse<ArticleItem[]>>("/admin/articles");
      setItems(response.data.data);
    } catch (error) {
      console.error("Failed to load articles", error);
      message.error("资讯列表加载失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadItems();
  }, []);

  const filteredItems = useMemo(
    () => items.filter((item) => item.category.code === activeTab),
    [activeTab, items]
  );

  const openCreateModal = () => {
    setEditingItem(null);
    form.setFieldsValue({ ...defaultValues, category_code: activeTab });
    setOpen(true);
  };

  const openEditModal = (item: ArticleItem) => {
    setEditingItem(item);
    form.setFieldsValue({
      category_code: item.category.code,
      title: item.title,
      summary: item.summary,
      external_url: item.external_url || "",
      publish_at: dayjs(item.publish_at),
      source_name: item.source_name || "",
      is_published: item.is_published === 1,
      sort_order: item.sort_order,
    });
    setOpen(true);
  };

  const closeModal = () => {
    setOpen(false);
    setEditingItem(null);
  };

  const handleDelete = async (id: number) => {
    try {
      await adminApi.delete(`/admin/articles/${id}`);
      message.success("资讯已删除");
      await loadItems();
    } catch (error) {
      console.error("Failed to delete article", error);
      message.error("资讯删除失败");
    }
  };

  const handleSubmit = async (values: ArticleFormValues) => {
    setSaving(true);
    try {
      const payload = buildArticlePayload(values);
      if (editingItem) {
        await adminApi.put(`/admin/articles/${editingItem.id}`, payload);
        message.success("资讯已更新");
      } else {
        await adminApi.post("/admin/articles", payload);
        message.success("资讯已新增");
      }
      closeModal();
      await loadItems();
    } catch (error) {
      console.error("Failed to save article", error);
      message.error("资讯保存失败");
    } finally {
      setSaving(false);
    }
  };

  const columns: ColumnsType<ArticleItem> = [
    { title: "标题", dataIndex: "title", key: "title", width: 260, fixed: "left", ellipsis: true },
    { title: "来源", dataIndex: "source_name", key: "source_name", width: 120, render: (value?: string) => value || "-" },
    { title: "发布时间", dataIndex: "publish_at", key: "publish_at", width: 160, render: formatDate },
    { title: "排序", dataIndex: "sort_order", key: "sort_order", width: 80 },
    {
      title: "状态",
      dataIndex: "is_published",
      key: "is_published",
      width: 90,
      render: (value: number) => (value === 1 ? <Tag color="blue">发布</Tag> : <Tag>草稿</Tag>),
    },
    {
      title: "操作",
      key: "actions",
      width: 140,
      fixed: "right",
      render: (_, record) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => openEditModal(record)} type="link">
            编辑
          </Button>
          <Popconfirm onConfirm={() => void handleDelete(record.id)} title="确认删除这条资讯吗？">
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
            <h2 style={{ marginTop: 0, marginBottom: 8 }}>最新动态</h2>
            <p className="admin-muted" style={{ marginBottom: 0 }}>
              这里维护“最新动态”列表内容，按活动通知、政策文件、文章信息、申报通知分别管理。
            </p>
          </div>
          <Button icon={<PlusOutlined />} onClick={openCreateModal} type="primary">
            新增资讯
          </Button>
        </div>

      </Card>

      <Card className="admin-page-card">
        <Tabs
          activeKey={activeTab}
          items={categoryOptions.map((item) => ({
            key: item.value,
            label: item.label,
          }))}
          onChange={setActiveTab}
        />
        <Table columns={columns} dataSource={filteredItems} loading={loading} rowKey="id" scroll={{ x: 980 }} />
      </Card>

      <Modal
        destroyOnHidden
        onCancel={closeModal}
        onOk={() => form.submit()}
        open={open}
        okButtonProps={{ loading: saving }}
        title={editingItem ? "编辑资讯" : "新增资讯"}
        width={760}
      >
        <Form
          form={form}
          initialValues={defaultValues}
          layout="vertical"
          onFinish={handleSubmit}
          requiredMark
        >
          <Form.Item label="资讯分类" name="category_code" rules={[{ required: true, message: "请选择资讯分类" }]}>
            <Select options={categoryOptions} />
          </Form.Item>
          <Form.Item label="资讯标题" name="title" rules={[{ required: true, message: "请输入资讯标题" }]}>
            <Input placeholder="请输入资讯标题" />
          </Form.Item>
          <Form.Item label="摘要" name="summary">
            <Input.TextArea placeholder="请输入摘要文案" rows={4} />
          </Form.Item>
          <Form.Item label="跳转地址" name="external_url">
            <Input placeholder="可留空；外链填写 https://...，站内填写 /news" />
          </Form.Item>
          <Form.Item label="发布时间" name="publish_at" rules={[{ required: true, message: "请选择发布时间" }]}>
            <DatePicker format="YYYY-MM-DD HH:mm:ss" showTime style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item label="来源" name="source_name">
            <Input placeholder="例如：微信公众号" />
          </Form.Item>
          <Form.Item extra="数字越小，排序越靠前。" label="排序" name="sort_order">
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>
          <div style={{ display: "flex", gap: 32, marginBottom: 24, marginTop: 8, flexWrap: "wrap" }}>
            <div style={{ alignItems: "center", display: "flex", gap: 12 }}>
              <span>是否发布</span>
              <Form.Item name="is_published" noStyle valuePropName="checked">
                <Switch checkedChildren="发布" unCheckedChildren="草稿" />
              </Form.Item>
            </div>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
