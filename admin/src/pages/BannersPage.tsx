import { DeleteOutlined, EditOutlined, EyeOutlined, PlusOutlined } from "@ant-design/icons";
import {
  Button,
  Card,
  Form,
  Image,
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
import { adminApi, getSiteAssetUrl } from "../api";
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
  image_url: "/home-banner-ai-hackathon.webp",
  action_type: "internal",
  action_value: "",
  sort_order: 0,
  is_published: 1
};

type BannerImageOption = {
  label: string;
  value: string;
};

const bannerImageOptions: BannerImageOption[] = [
  { label: "首页轮播图-黑客松主视觉", value: "/home-banner-ai-hackathon.webp" },
  { label: "首页轮播图-火炬活动主视觉", value: "/home-banner-ai-torch-series.webp" },
  { label: "首页轮播图-社区空间主视觉", value: "/home-banner-opc-community-space.webp" },
];

function normalizeActionType(actionValue?: string) {
  if (!actionValue) {
    return "none";
  }

  if (/^https?:\/\//i.test(actionValue)) {
    return "external";
  }

  return "internal";
}

export function BannersPage() {
  const [form] = Form.useForm<BannerFormValues>();
  const [items, setItems] = useState<BannerItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<BannerItem | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState("");
  const [previewTitle, setPreviewTitle] = useState("");

  const loadItems = async () => {
    setLoading(true);
    try {
      const response = await adminApi.get<ApiResponse<BannerItem[]>>("/admin/banners");
      setItems(response.data.data);
    } catch (error) {
      console.error("Failed to load banners", error);
      message.error("轮播图列表加载失败");
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
      action_type: normalizeActionType(item.action_value || undefined),
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

  const openImagePreview = (value: string, label?: string) => {
    setPreviewImage(getSiteAssetUrl(value));
    setPreviewTitle(label || "图片预览");
    setPreviewOpen(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await adminApi.delete(`/admin/banners/${id}`);
      message.success("轮播图已删除");
      await loadItems();
    } catch (error) {
      console.error("Failed to delete banner", error);
      message.error("轮播图删除失败");
    }
  };

  const handleSubmit = async (values: BannerFormValues) => {
    setSaving(true);
    try {
      const payload = {
        ...values,
        action_type: normalizeActionType(values.action_value),
      };
      if (editingItem) {
        await adminApi.put(`/admin/banners/${editingItem.id}`, payload);
        message.success("轮播图已更新");
      } else {
        await adminApi.post("/admin/banners", payload);
        message.success("轮播图已新增");
      }
      closeModal();
      await loadItems();
    } catch (error) {
      console.error("Failed to save banner", error);
      message.error("轮播图保存失败");
    } finally {
      setSaving(false);
    }
  };

  const columns: ColumnsType<BannerItem> = [
    { title: "主标题", dataIndex: "title", key: "title", width: 180, fixed: "left" },
    { title: "焦点标题", dataIndex: "highlight_title", key: "highlight_title", width: 220 },
    { title: "副标题", dataIndex: "subtitle", key: "subtitle", width: 200, ellipsis: true },
    {
      title: "状态",
      dataIndex: "is_published",
      key: "is_published",
      width: 60,
      render: (value: number) => (value === 1 ? <Tag color="blue">显示中</Tag> : <Tag>已隐藏</Tag>)
    },
    { title: "排序", dataIndex: "sort_order", key: "sort_order", width: 60 },
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
        <div className="admin-toolbar" style={{ maxWidth: 1200 }}>
          <div>
            <h2 style={{ marginTop: 0, marginBottom: 8 }}>首页轮播图</h2>
            <p className="admin-muted" style={{ marginBottom: 0 }}>
              这里维护首页首屏轮播图，包括标题、说明文字、配图和点击跳转内容。
            </p>
          </div>
          <Button icon={<PlusOutlined />} onClick={openCreateModal} type="primary">
            新增轮播图
          </Button>
        </div>
      </Card>
      <Card className="admin-page-card">
        <Table columns={columns} dataSource={items} loading={loading} rowKey="id" scroll={{ x: 980 }} />
      </Card>

      <Modal
        destroyOnHidden
        onCancel={closeModal}
        onOk={() => form.submit()}
        open={open}
        okButtonProps={{ loading: saving }}
        title={editingItem ? "编辑轮播图" : "新增轮播图"}
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
          <Form.Item
            extra="建议使用清晰的横版图片，并保持首页整体风格统一。"
            label="选择图片"
            name="image_url"
            rules={[{ required: true, message: "请输入图片地址" }]}
          >
            <Select
              options={bannerImageOptions}
              placeholder="请选择轮播图图片"
              showSearch
              optionFilterProp="label"
              optionRender={(option) => {
                const data = option.data as BannerImageOption;
                return (
                  <div
                    style={{
                      alignItems: "center",
                      display: "flex",
                      gap: 12,
                      justifyContent: "space-between",
                      width: "100%",
                    }}
                  >
                    <div style={{ alignItems: "center", display: "flex", gap: 12, minWidth: 0 }}>
                      <img
                        alt={data.label}
                        src={getSiteAssetUrl(data.value)}
                        style={{
                          border: "1px solid #e5e7eb",
                          borderRadius: 8,
                          height: 44,
                          objectFit: "cover",
                          width: 88,
                        }}
                      />
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{data.label}</span>
                    </div>
                    <Button
                      icon={<EyeOutlined />}
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        openImagePreview(data.value, data.label);
                      }}
                      size="small"
                      type="text"
                    />
                  </div>
                );
              }}
            />
          </Form.Item>
          <Form.Item extra="可留空；站内地址填写 /community，外部链接填写 https://..." label="跳转地址" name="action_value">
            <Input placeholder="例如：/community 或 https://..." />
          </Form.Item>
          <Form.Item extra="数字越小，排序越靠前。" label="排序" name="sort_order">
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item label="发布状态" name="is_published">
            <Select
              options={[
                { label: "显示", value: 1 },
                { label: "隐藏", value: 0 }
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>

      <Image
        preview={{
          onVisibleChange: (visible) => setPreviewOpen(visible),
          visible: previewOpen,
        }}
        src={previewImage}
        style={{ display: "none" }}
        alt={previewTitle}
      />
    </div>
  );
}
