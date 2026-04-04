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
import type { ApiResponse, ArticleItem } from "../types";

type ArticleFormValues = {
  category_code: string;
  title: string;
  summary: string;
  link_type: string;
  external_url?: string;
  publish_at: string;
  source_name?: string;
  is_top: number;
  is_published: number;
  sort_order: number;
};

const categoryOptions = [
  { label: "活动通知", value: "activity" },
  { label: "政策文件", value: "policy" },
  { label: "文章信息", value: "article" },
  { label: "申报通知", value: "notice" }
];

const defaultValues: ArticleFormValues = {
  category_code: "activity",
  title: "",
  summary: "",
  link_type: "external",
  external_url: "",
  publish_at: "2026-04-03T10:00:00",
  source_name: "",
  is_top: 0,
  is_published: 1,
  sort_order: 0
};

function formatDate(value: string) {
  return value.replace("T", " ").slice(0, 16);
}

export function ArticlesPage() {
  const [form] = Form.useForm<ArticleFormValues>();
  const [items, setItems] = useState<ArticleItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ArticleItem | null>(null);

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

  const openCreateModal = () => {
    setEditingItem(null);
    form.setFieldsValue(defaultValues);
    setOpen(true);
  };

  const openEditModal = (item: ArticleItem) => {
    setEditingItem(item);
    form.setFieldsValue({
      category_code: item.category.code,
      title: item.title,
      summary: item.summary,
      link_type: item.link_type,
      external_url: item.external_url || "",
      publish_at: item.publish_at.slice(0, 19),
      source_name: item.source_name || "",
      is_top: item.is_top ? 1 : 0,
      is_published: item.is_published,
      sort_order: item.sort_order
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
      if (editingItem) {
        await adminApi.put(`/admin/articles/${editingItem.id}`, values);
        message.success("资讯已更新");
      } else {
        await adminApi.post("/admin/articles", values);
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
    { title: "标题", dataIndex: "title", key: "title", ellipsis: true },
    {
      title: "分类",
      dataIndex: "category",
      key: "category",
      width: 120,
      render: (value: ArticleItem["category"]) => <Tag color="blue">{value.name}</Tag>
    },
    { title: "来源", dataIndex: "source_name", key: "source_name", width: 140 },
    { title: "发布时间", dataIndex: "publish_at", key: "publish_at", width: 170, render: formatDate },
    {
      title: "置顶",
      dataIndex: "is_top",
      key: "is_top",
      width: 80,
      render: (value: boolean) => (value ? <Tag color="gold">置顶</Tag> : <Tag>普通</Tag>)
    },
    {
      title: "状态",
      dataIndex: "is_published",
      key: "is_published",
      width: 100,
      render: (value: number) => (value === 1 ? <Tag color="blue">已发布</Tag> : <Tag>草稿</Tag>)
    },
    {
      title: "操作",
      key: "actions",
      width: 140,
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
      )
    }
  ];

  return (
    <div className="admin-page">
      <Card className="admin-page-card">
        <Alert
          description="这里不仅控制首页“最新动态”摘要，也会直接作为最新动态完整页的列表数据源。前台会按分类读取并展示最新内容。"
          message="前台映射"
          showIcon
          style={{ marginBottom: 16 }}
          type="info"
        />
        <Button icon={<PlusOutlined />} onClick={openCreateModal} type="primary">
          新增资讯
        </Button>
      </Card>
      <Card className="admin-page-card">
        <Table columns={columns} dataSource={items} loading={loading} rowKey="id" />
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
          requiredMark={false}
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
          <Form.Item label="链接类型" name="link_type">
            <Select
              options={[
                { label: "外部链接", value: "external" },
                { label: "站内链接", value: "internal" }
              ]}
            />
          </Form.Item>
          <Form.Item label="跳转地址" name="external_url">
            <Input placeholder="https://..." />
          </Form.Item>
          <Form.Item label="发布时间" name="publish_at" rules={[{ required: true, message: "请输入发布时间" }]}>
            <Input placeholder="格式：2026-04-03T10:00:00" />
          </Form.Item>
          <Form.Item label="来源" name="source_name">
            <Input placeholder="例如：微信公众号" />
          </Form.Item>
          <Form.Item label="排序" name="sort_order">
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item label="是否置顶" name="is_top">
            <Select
              options={[
                { label: "普通", value: 0 },
                { label: "置顶", value: 1 }
              ]}
            />
          </Form.Item>
          <Form.Item label="发布状态" name="is_published">
            <Select
              options={[
                { label: "已发布", value: 1 },
                { label: "草稿", value: 0 }
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
