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
import type { ApiResponse, ServiceItem } from "../types";

type ServiceFormValues = {
  module_key: string;
  title: string;
  summary: string;
  icon?: string;
  sort_order: number;
  is_published: number;
};

const defaultValues: ServiceFormValues = {
  module_key: "home_service_entries",
  title: "",
  summary: "",
  icon: "/home-service-business-registration.png",
  sort_order: 0,
  is_published: 1,
};

type ServiceIconOption = {
  label: string;
  value: string;
  imageUrl: string;
};

const serviceIconOptions: ServiceIconOption[] = [
  {
    label: "创业服务图标-工商注册",
    value: "/home-service-business-registration.png",
    imageUrl: "/home-service-business-registration.png",
  },
  {
    label: "创业服务图标-政策匹配",
    value: "/home-service-policy-matching.png",
    imageUrl: "/home-service-policy-matching.png",
  },
  {
    label: "创业服务图标-安居落户",
    value: "/home-service-settlement-support.png",
    imageUrl: "/home-service-settlement-support.png",
  },
  {
    label: "创业服务图标-融资对接",
    value: "/home-service-financing-connection.png",
    imageUrl: "/home-service-financing-connection.png",
  },
];

const serviceTargetMap: Array<{ keyword: string; value: string }> = [
  { keyword: "工商", value: "/setup" },
  { keyword: "注册", value: "/setup" },
  { keyword: "opc", value: "/setup" },
  { keyword: "融资", value: "/financing" },
  { keyword: "安居", value: "/settlement" },
  { keyword: "落户", value: "/settlement" },
];

function resolveServiceTarget(title: string, fallback?: string | null) {
  const normalizedTitle = title.trim().toLowerCase();
  const matched = serviceTargetMap.find((item) => normalizedTitle.includes(item.keyword));
  if (matched) {
    return matched.value;
  }

  return fallback || "/services";
}

function resolveServiceIconPreview(icon?: string | null) {
  const matched = serviceIconOptions.find((item) => item.value === icon);
  return getSiteAssetUrl(matched?.imageUrl || serviceIconOptions[0].imageUrl);
}

export function HomeServicesPage() {
  const [form] = Form.useForm<ServiceFormValues>();
  const [items, setItems] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ServiceItem | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState("");
  const [previewTitle, setPreviewTitle] = useState("");

  const loadItems = async () => {
    setLoading(true);
    try {
      const response = await adminApi.get<ApiResponse<ServiceItem[]>>("/admin/service-items", {
        params: { module_key: "home_service_entries" },
      });
      setItems(response.data.data);
    } catch (error) {
      console.error("Failed to load service items", error);
      message.error("创业服务入口列表加载失败");
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
      sort_order: item.sort_order,
      is_published: item.is_published,
    });
    setOpen(true);
  };

  const closeModal = () => {
    setOpen(false);
    setEditingItem(null);
  };

  const openIconPreview = (imageUrl: string, label: string) => {
    setPreviewImage(imageUrl);
    setPreviewTitle(label);
    setPreviewOpen(true);
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
      const payload = {
        ...values,
        module_key: "home_service_entries",
        target_type: "internal",
        target_value: resolveServiceTarget(values.title, editingItem?.target_value),
      };
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
    { title: "简介", dataIndex: "summary", key: "summary", width: 300 },
    {
      title: "图标",
      dataIndex: "icon",
      key: "icon",
      width: 110,
      render: (value?: string) => (
        <img
          alt={value || "服务图标"}
          src={resolveServiceIconPreview(value)}
          style={{ border: "1px solid #e5e7eb", borderRadius: 10, height: 44, objectFit: "cover", width: 44 }}
        />
      ),
    },
    { title: "排序", dataIndex: "sort_order", key: "sort_order", width: 60 },
    {
      title: "状态",
      dataIndex: "is_published",
      key: "is_published",
      width: 60,
      render: (value: number) => (value === 1 ? <Tag color="success">显示中</Tag> : <Tag>已隐藏</Tag>),
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
            <h2 style={{ marginTop: 0, marginBottom: 8 }}>创业服务入口</h2>
            <p className="admin-muted" style={{ marginBottom: 0 }}>
              这里维护首页创业服务快捷入口卡片，包括标题、简介、图标和排序。
            </p>
          </div>
          <Button icon={<PlusOutlined />} onClick={openCreateModal} type="primary">
            新增服务入口
          </Button>
        </div>
      </Card>

      <Card className="admin-page-card">
        <Table
          columns={columns}
          dataSource={items}
          loading={loading}
          pagination={false}
          rowKey="id"
          scroll={{ x: 1000 }}
        />
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
          <Form.Item hidden label="模块标识" name="module_key">
            <Input disabled />
          </Form.Item>
          <Form.Item label="卡片标题" name="title" rules={[{ required: true, message: "请输入卡片标题" }]}>
            <Input placeholder="例如：OPC工商注册" />
          </Form.Item>
          <Form.Item label="卡片简介" name="summary" rules={[{ required: true, message: "请输入卡片简介" }]}>
            <Input.TextArea placeholder="请输入卡片简介" rows={4} />
          </Form.Item>
          <Form.Item extra="请选择卡片要使用的图标样式。" label="选择图标" name="icon">
            <Select
              options={serviceIconOptions}
              optionFilterProp="label"
              optionRender={(option) => {
                const data = option.data as ServiceIconOption;
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
                        src={getSiteAssetUrl(data.imageUrl)}
                        style={{
                          border: "1px solid #e5e7eb",
                          borderRadius: 10,
                          height: 44,
                          objectFit: "cover",
                          width: 44,
                        }}
                      />
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{data.label}</span>
                    </div>
                    <Button
                      icon={<EyeOutlined />}
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        openIconPreview(data.imageUrl, data.label);
                      }}
                      size="small"
                      type="text"
                    />
                  </div>
                );
              }}
              placeholder="请选择图标"
              showSearch
            />
          </Form.Item>
          <Form.Item extra="数字越小，排序越靠前。" label="排序" name="sort_order">
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item label="显示状态" name="is_published">
            <Select
              options={[
                { label: "显示", value: 1 },
                { label: "隐藏", value: 0 },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>

      <Image
        alt={previewTitle}
        preview={{
          onVisibleChange: (visible) => setPreviewOpen(visible),
          visible: previewOpen,
        }}
        src={getSiteAssetUrl(previewImage)}
        style={{ display: "none" }}
      />
    </div>
  );
}
