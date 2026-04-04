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
import type { ApiResponse, BannerItem } from "../types";

type BannerFormValues = {
  title: string;
  subtitle: string;
  highlight_title: string;
  description: string;
  image_url: string;
  action_type: string;
  action_value?: string;
  sort_order: number;
  is_published: number;
};

const defaultValues: BannerFormValues = {
  title: "",
  subtitle: "",
  highlight_title: "",
  description: "",
  image_url: "",
  action_type: "none",
  action_value: "",
  sort_order: 0,
  is_published: 1
};

export function BannersPage() {
  const [form] = Form.useForm<BannerFormValues>();
  const [items, setItems] = useState<BannerItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<BannerItem | null>(null);

  const loadItems = async () => {
    setLoading(true);
    try {
      const response = await adminApi.get<ApiResponse<BannerItem[]>>("/admin/banners");
      setItems(response.data.data);
    } catch (error) {
      console.error("Failed to load banners", error);
      message.error("Banner 列表加载失败");
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

  const openEditModal = (item: BannerItem) => {
    setEditingItem(item);
    form.setFieldsValue({
      title: item.title,
      subtitle: item.subtitle,
      highlight_title: item.highlight_title,
      description: item.description,
      image_url: item.image_url,
      action_type: item.action_type,
      action_value: item.action_value || "",
      sort_order: item.sort_order,
      is_published: item.is_published
    });
    setOpen(true);
  };

  const closeModal = () => {
    setOpen(false);
    setEditingItem(null);
  };

  const handleDelete = async (id: number) => {
    try {
      await adminApi.delete(`/admin/banners/${id}`);
      message.success("Banner 已删除");
      await loadItems();
    } catch (error) {
      console.error("Failed to delete banner", error);
      message.error("Banner 删除失败");
    }
  };

  const handleSubmit = async (values: BannerFormValues) => {
    setSaving(true);
    try {
      if (editingItem) {
        await adminApi.put(`/admin/banners/${editingItem.id}`, values);
        message.success("Banner 已更新");
      } else {
        await adminApi.post("/admin/banners", values);
        message.success("Banner 已新增");
      }
      closeModal();
      await loadItems();
    } catch (error) {
      console.error("Failed to save banner", error);
      message.error("Banner 保存失败");
    } finally {
      setSaving(false);
    }
  };

  const columns: ColumnsType<BannerItem> = [
    { title: "主标题", dataIndex: "title", key: "title", width: 180 },
    { title: "焦点标题", dataIndex: "highlight_title", key: "highlight_title", width: 220 },
    { title: "副标题", dataIndex: "subtitle", key: "subtitle", ellipsis: true },
    {
      title: "状态",
      dataIndex: "is_published",
      key: "is_published",
      width: 110,
      render: (value: number) => (value === 1 ? <Tag color="blue">已发布</Tag> : <Tag>草稿</Tag>)
    },
    { title: "排序", dataIndex: "sort_order", key: "sort_order", width: 80 },
    {
      title: "操作",
      key: "actions",
      width: 140,
      render: (_, record) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => openEditModal(record)} type="link">
            编辑
          </Button>
          <Popconfirm onConfirm={() => void handleDelete(record.id)} title="确认删除这个 Banner 吗？">
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
          description="这里控制首页首屏轮播图、主标题、副标题、焦点标题、描述文案和整张 Banner 的跳转。"
          message="前台映射"
          showIcon
          style={{ marginBottom: 16 }}
          type="info"
        />
        <Button icon={<PlusOutlined />} onClick={openCreateModal} type="primary">
          新增 Banner
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
        title={editingItem ? "编辑 Banner" : "新增 Banner"}
        width={760}
      >
        <Form
          form={form}
          initialValues={defaultValues}
          layout="vertical"
          onFinish={handleSubmit}
          requiredMark={false}
        >
          <Form.Item label="主标题" name="title" rules={[{ required: true, message: "请输入主标题" }]}>
            <Input placeholder="例如：数智立信 创见不凡" />
          </Form.Item>
          <Form.Item label="副标题" name="subtitle" rules={[{ required: true, message: "请输入副标题" }]}>
            <Input placeholder="例如：成为一流的数智产业生态构建者" />
          </Form.Item>
          <Form.Item
            label="焦点标题"
            name="highlight_title"
            rules={[{ required: true, message: "请输入焦点标题" }]}
          >
            <Input placeholder="例如：AI 黑客松大赛" />
          </Form.Item>
          <Form.Item label="描述文案" name="description" rules={[{ required: true, message: "请输入描述文案" }]}>
            <Input.TextArea placeholder="请输入 Banner 描述文案" rows={4} />
          </Form.Item>
          <Form.Item label="图片地址" name="image_url" rules={[{ required: true, message: "请输入图片地址" }]}>
            <Input placeholder="/prototype-assets/7.png" />
          </Form.Item>
          <Form.Item label="跳转类型" name="action_type">
            <Select
              options={[
                { label: "不跳转", value: "none" },
                { label: "站内页面", value: "internal" },
                { label: "外部链接", value: "external" }
              ]}
            />
          </Form.Item>
          <Form.Item label="跳转值" name="action_value">
            <Input placeholder="内部填写 /community，外链填写 https://..." />
          </Form.Item>
          <Form.Item label="排序" name="sort_order">
            <InputNumber min={0} style={{ width: "100%" }} />
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
