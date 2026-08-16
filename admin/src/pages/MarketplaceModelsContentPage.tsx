import { Button, Card, Form, Input, InputNumber, Modal, Select, Space, Switch, Table, Tag, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useMemo, useState } from "react";
import { adminApi, getAssetUrl } from "../api";
import {
  modelItemFromResource,
  normalizeCategory,
  normalizeMeta,
  normalizeTags,
  PageInfoCard,
  type MarketplaceModelFormValues,
  type PageInfoFormValues,
} from "./MarketplaceAdminHelpers";
import type { ApiResponse, ResourceCategory, ResourceItem } from "../types";

const CATEGORY_CODE = "marketplace_model_plaza";

export function MarketplaceModelsContentPage() {
  const [pageForm] = Form.useForm<PageInfoFormValues>();
  const [itemForm] = Form.useForm<MarketplaceModelFormValues>();

  const [categories, setCategories] = useState<ResourceCategory[]>([]);
  const [items, setItems] = useState<ResourceItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingPage, setEditingPage] = useState(false);
  const [open, setOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ResourceItem | null>(null);

  const category = useMemo(() => normalizeCategory(categories, CATEGORY_CODE), [categories]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [categoryResponse, itemResponse] = await Promise.all([
        adminApi.get<ApiResponse<ResourceCategory[]>>("/admin/resource-categories", { params: { resource_type: "marketplace" } }),
        adminApi.get<ApiResponse<ResourceItem[]>>("/admin/resource-items", { params: { resource_type: "marketplace", category_code: CATEGORY_CODE } }),
      ]);
      setCategories(categoryResponse.data.data);
      setItems(itemResponse.data.data.sort((a, b) => a.sort_order - b.sort_order));
      const current = categoryResponse.data.data.find((item) => item.code === CATEGORY_CODE);
      pageForm.setFieldsValue({
        title: current?.name || "模型广场",
        subtitle: current?.description || "",
      });
    } catch (error) {
      console.error("Failed to load model plaza content", error);
      message.error("模型广场内容加载失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const handleSavePage = async () => {
    if (!category) return;
    setSaving(true);
    try {
      const values = pageForm.getFieldsValue();
      await adminApi.put(`/admin/resource-categories/${category.id}`, {
        ...category,
        name: values.title.trim(),
        description: values.subtitle.trim(),
      });
      message.success("页面信息已保存");
      setEditingPage(false);
      await loadData();
    } catch (error) {
      console.error("Failed to save model plaza page", error);
      message.error("页面信息保存失败");
    } finally {
      setSaving(false);
    }
  };

  const openCreate = () => {
    setEditingItem(null);
    itemForm.setFieldsValue({
      title: "",
      summary: "",
      image_url: "",
      icon: "Sparkles",
      tags: [],
      highlight: "",
      link_value: "",
      sort_order: items.length > 0 ? items[items.length - 1].sort_order + 1 : 1,
      is_published: true,
    });
    setOpen(true);
  };

  const openEdit = (item: ResourceItem) => {
    const meta = normalizeMeta(item.meta_json);
    setEditingItem(item);
    itemForm.setFieldsValue({
      title: item.title,
      summary: item.summary,
      image_url: item.image_url || "",
      icon: item.icon || "Sparkles",
      tags: normalizeTags(item.tags_json),
      highlight: String(meta.highlight || ""),
      link_value: item.link_value || "",
      sort_order: item.sort_order,
      is_published: item.is_published === 1,
    });
    setOpen(true);
  };

  const handleSaveItem = async () => {
    const values = itemForm.getFieldsValue();
    setSaving(true);
    try {
      const payload = modelItemFromResource(values, editingItem);
      if (editingItem) {
        await adminApi.put(`/admin/resource-items/${editingItem.id}`, payload);
      } else {
        await adminApi.post("/admin/resource-items", payload);
      }
      message.success(editingItem ? "模型已更新" : "模型已新增");
      setOpen(false);
      await loadData();
    } catch (error) {
      console.error("Failed to save model item", error);
      message.error("模型保存失败");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item: ResourceItem) => {
    try {
      await adminApi.delete(`/admin/resource-items/${item.id}`);
      message.success("模型已删除");
      await loadData();
    } catch (error) {
      console.error("Failed to delete model item", error);
      message.error("模型删除失败");
    }
  };

  const columns: ColumnsType<ResourceItem> = [
    {
      title: "模型头像",
      key: "image_url",
      width: 100,
      render: (_, record) =>
        record.image_url ? <img alt={record.title} src={getAssetUrl(record.image_url)} style={{ width: 52, height: 52, borderRadius: 12, objectFit: "cover" }} /> : "-",
    },
    { title: "模型名称", dataIndex: "title", key: "title", width: 180 },
    { title: "简介", dataIndex: "summary", key: "summary", ellipsis: true },
    {
      title: "标签",
      key: "tags",
      width: 200,
      render: (_, record) => (
        <Space wrap>
          {normalizeTags(record.tags_json).map((tag) => (
            <Tag key={tag}>{tag}</Tag>
          ))}
        </Space>
      ),
    },
    { title: "排序", dataIndex: "sort_order", key: "sort_order", width: 80 },
    { title: "状态", dataIndex: "is_published", key: "is_published", width: 90, render: (value: number) => (value === 1 ? "已发布" : "草稿") },
    {
      title: "操作",
      key: "actions",
      width: 160,
      fixed: "right",
      render: (_, record) => (
        <Space>
          <Button onClick={() => openEdit(record)} type="link">编辑</Button>
          <Button danger onClick={() => void handleDelete(record)} type="link">删除</Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="admin-page">
      <PageInfoCard
        editing={editingPage}
        form={pageForm}
        onCancel={() => {
          setEditingPage(false);
          pageForm.setFieldsValue({ title: category?.name || "模型广场", subtitle: category?.description || "" });
        }}
        onEdit={() => setEditingPage(true)}
        onSave={() => void handleSavePage()}
        saving={saving || loading}
        title="页面信息"
        fields={
          <>
            <Form.Item label="页面标题" name="title" rules={[{ required: true, message: "请输入页面标题" }]}>
              <Input placeholder="请输入页面标题" />
            </Form.Item>
            <Form.Item label="页面说明" name="subtitle">
              <Input.TextArea placeholder="请输入页面说明" rows={4} />
            </Form.Item>
          </>
        }
      >
        <div style={{ display: "grid", gap: 12 }}>
          <div style={{ fontSize: 22, fontWeight: 700 }}>{category?.name || "模型广场"}</div>
          <div style={{ color: "#475569" }}>{category?.description || "-"}</div>
        </div>
      </PageInfoCard>

      <Card className="admin-page-card" extra={<Button onClick={openCreate} type="primary">新增模型</Button>} title="模型列表">
        <Table columns={columns} dataSource={items} pagination={false} rowKey="id" scroll={{ x: 1200 }} />
      </Card>

      <Modal confirmLoading={saving} destroyOnHidden onCancel={() => setOpen(false)} onOk={() => void handleSaveItem()} open={open} title={editingItem ? "编辑模型" : "新增模型"} width={760}>
        <Form form={itemForm} layout="vertical" requiredMark={false}>
          <Form.Item label="模型名称" name="title" rules={[{ required: true, message: "请输入模型名称" }]}>
            <Input placeholder="请输入模型名称" />
          </Form.Item>
          <Form.Item label="简介" name="summary" rules={[{ required: true, message: "请输入简介" }]}>
            <Input.TextArea placeholder="请输入简介" rows={4} />
          </Form.Item>
          <div className="admin-grid-2">
            <Form.Item label="模型头像" name="image_url">
              <Input placeholder="请输入模型头像地址" />
            </Form.Item>
            <Form.Item label="备用图标" name="icon">
              <Select options={[{ label: "模型服务", value: "Sparkles" }, { label: "数据库", value: "Database" }, { label: "机器人", value: "Bot" }]} />
            </Form.Item>
          </div>
          <Form.Item label="标签" name="tags">
            <Select mode="tags" placeholder="请输入标签" />
          </Form.Item>
          <Form.Item label="高亮说明" name="highlight">
            <Input.TextArea placeholder="请输入高亮说明" rows={3} />
          </Form.Item>
          <Form.Item label="跳转链接" name="link_value" rules={[{ required: true, message: "请输入跳转链接" }]}>
            <Input placeholder="请输入跳转链接" />
          </Form.Item>
          <div className="admin-grid-2">
            <Form.Item label="排序" name="sort_order" rules={[{ required: true, message: "请输入排序" }]}>
              <InputNumber min={0} style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item label="发布状态" name="is_published" valuePropName="checked">
              <Switch checkedChildren="已发布" unCheckedChildren="草稿" />
            </Form.Item>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
