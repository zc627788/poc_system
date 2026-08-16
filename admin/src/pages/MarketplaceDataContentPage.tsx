import { Button, Card, Form, Input, InputNumber, Modal, Space, Switch, Table, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useMemo, useState } from "react";
import { adminApi } from "../api";
import { renderLinkIcon } from "./MarketplaceAdminHelpers";
import type { ApiResponse, ResourceCategory } from "../types";

type DataCategoryFormValues = {
  name: string;
  description: string;
  button_text?: string;
  action_value: string;
  sort_order: number;
  is_published: boolean;
};

const RESOURCE_TYPE = "marketplace";
const GROUP_KEY = "data";

export function MarketplaceDataContentPage() {
  const [form] = Form.useForm<DataCategoryFormValues>();
  const [items, setItems] = useState<ResourceCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ResourceCategory | null>(null);

  const visibleItems = useMemo(() => [...items].sort((a, b) => a.sort_order - b.sort_order), [items]);

  const loadItems = async () => {
    setLoading(true);
    try {
      const response = await adminApi.get<ApiResponse<ResourceCategory[]>>("/admin/resource-categories", {
        params: { resource_type: RESOURCE_TYPE, group_key: GROUP_KEY },
      });
      setItems(response.data.data);
    } catch (error) {
      console.error("Failed to load marketplace data categories", error);
      message.error("数据资源内容加载失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadItems();
  }, []);

  const openCreateModal = () => {
    setEditingItem(null);
    form.setFieldsValue({
      name: "",
      description: "",
      button_text: "查看详情",
      action_value: "",
      sort_order: visibleItems.length > 0 ? visibleItems[visibleItems.length - 1].sort_order + 1 : 1,
      is_published: true,
    });
    setOpen(true);
  };

  const openEditModal = (item: ResourceCategory) => {
    setEditingItem(item);
    form.setFieldsValue({
      name: item.name,
      description: item.description,
      button_text: item.button_text || "查看详情",
      action_value: item.action_value || "",
      sort_order: item.sort_order,
      is_published: item.is_published === 1,
    });
    setOpen(true);
  };

  const handleDelete = async (item: ResourceCategory) => {
    try {
      await adminApi.delete(`/admin/resource-categories/${item.id}`);
      message.success("数据资源已删除");
      await loadItems();
    } catch (error) {
      console.error("Failed to delete marketplace data category", error);
      message.error("数据资源删除失败");
    }
  };

  const handleSave = async () => {
    const values = form.getFieldsValue();
    setSaving(true);
    try {
      const payload = {
        code: editingItem?.code || `marketplace_data_${Date.now()}`,
        name: values.name.trim(),
        resource_type: RESOURCE_TYPE,
        group_key: GROUP_KEY,
        description: values.description.trim(),
        icon: editingItem?.icon || null,
        image_url: null,
        display_template: editingItem?.display_template || "default",
        action_type: /^https?:\/\//i.test(values.action_value.trim()) ? "external" : "internal",
        action_value: values.action_value.trim() || null,
        button_text: values.button_text?.trim() || "查看详情",
        show_on_home: 1,
        sort_order: values.sort_order,
        is_published: values.is_published ? 1 : 0,
      };

      if (editingItem) {
        await adminApi.put(`/admin/resource-categories/${editingItem.id}`, payload);
      } else {
        await adminApi.post("/admin/resource-categories", payload);
      }
      message.success(editingItem ? "数据资源已更新" : "数据资源已新增");
      setOpen(false);
      await loadItems();
    } catch (error) {
      console.error("Failed to save marketplace data category", error);
      message.error("数据资源保存失败");
    } finally {
      setSaving(false);
    }
  };

  const columns: ColumnsType<ResourceCategory> = [
    { title: "标题", dataIndex: "name", key: "name", width: 180 },
    { title: "说明", dataIndex: "description", key: "description", ellipsis: true },
    { title: "按钮文案", dataIndex: "button_text", key: "button_text", width: 120, render: (value?: string | null) => value || "查看详情" },
    {
      title: "跳转链接",
      key: "action_value",
      width: 110,
      align: "center",
      render: (_, record) => renderLinkIcon(record.action_value || ""),
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
          <Button onClick={() => openEditModal(record)} type="link">
            编辑
          </Button>
          <Button danger onClick={() => void handleDelete(record)} type="link">
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="admin-page">
      <Card className="admin-page-card" loading={loading}>
        <div className="admin-toolbar">
          <div>
            <h2 style={{ margin: 0 }}>数据资源</h2>
            <p className="admin-muted" style={{ marginBottom: 0, marginTop: 8 }}>
              维护前台数据资源卡片列表。图片背景使用系统默认样式，这里不单独维护图片。
            </p>
          </div>
          <Button onClick={openCreateModal} type="primary">
            新增数据资源
          </Button>
        </div>
      </Card>

      <Card className="admin-page-card" title="数据资源列表">
        <Table columns={columns} dataSource={visibleItems} pagination={false} rowKey="id" scroll={{ x: 1180 }} />
      </Card>

      <Modal confirmLoading={saving} destroyOnHidden onCancel={() => setOpen(false)} onOk={() => void handleSave()} open={open} title={editingItem ? "编辑数据资源" : "新增数据资源"} width={760}>
        <Form form={form} layout="vertical" requiredMark={false}>
          <Form.Item label="标题" name="name" rules={[{ required: true, message: "请输入标题" }]}>
            <Input placeholder="请输入标题" />
          </Form.Item>
          <Form.Item label="说明" name="description" rules={[{ required: true, message: "请输入说明" }]}>
            <Input.TextArea placeholder="请输入说明" rows={4} />
          </Form.Item>
          <div className="admin-grid-2">
            <Form.Item label="按钮文案" name="button_text">
              <Input placeholder="例如：查看详情" />
            </Form.Item>
            <Form.Item label="跳转链接" name="action_value" rules={[{ required: true, message: "请输入跳转链接" }]}>
              <Input placeholder="请输入跳转链接" />
            </Form.Item>
          </div>
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
