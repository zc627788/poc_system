import { AppstoreOutlined, EyeOutlined } from "@ant-design/icons";
import { Button, Card, Form, Input, InputNumber, Modal, Select, Space, Switch, Table, Tag, Tooltip, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useMemo, useState } from "react";
import { adminApi, getCmsImageUrl } from "../api";
import { CmsIconBadge, CmsIconPreview } from "../components/CmsIconPreview";
import { commonTagOptions, normalizeTags, renderLinkIcon, resolveActionType, stringifyJson, toolFixedEntries } from "./MarketplaceAdminHelpers";
import type { ApiResponse, ResourceCategory, ResourceItem } from "../types";

type ToolItemFormValues = {
  icon: string;
  title: string;
  summary: string;
  tags: string[];
  link_value: string;
  sort_order: number;
  is_published: boolean;
};

type ToolGroupRow = {
  key: string;
  title: string;
  description: string;
  defaultLink: string;
  category: ResourceCategory | null;
  items: ResourceItem[];
};

type ToolIconOption = {
  label: string;
  value: string;
};

const toolIconOptions: ToolIconOption[] = [
  { label: "工具箱", value: "Briefcase" },
  { label: "数据库", value: "Database" },
  { label: "流程协同", value: "Workflow" },
  { label: "机器人", value: "Bot" },
  { label: "模型服务", value: "Sparkles" },
];

function renderToolThumb(record: ResourceItem) {
  const imageUrl = getCmsImageUrl(record.image_url);

  if (imageUrl) {
    return (
      <img
        alt={record.title}
        src={imageUrl}
        style={{ width: 44, height: 44, borderRadius: 12, objectFit: "contain", background: "#fff", border: "1px solid #e2e8f0", padding: 4 }}
      />
    );
  }

  return (
    <span
      style={{
        alignItems: "center",
        background: "#f8fafc",
        border: "1px solid #e2e8f0",
        borderRadius: 12,
        color: "#64748b",
        display: "inline-flex",
        height: 44,
        justifyContent: "center",
        width: 44,
      }}
    >
      {record.icon ? <CmsIconPreview color="#475569" name={record.icon} size={18} strokeWidth={2} /> : <AppstoreOutlined style={{ fontSize: 18 }} />}
    </span>
  );
}

export function MarketplaceToolsContentPage() {
  const [form] = Form.useForm<ToolItemFormValues>();
  const [categories, setCategories] = useState<ResourceCategory[]>([]);
  const [items, setItems] = useState<ResourceItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ResourceItem | null>(null);
  const [activeCategoryCode, setActiveCategoryCode] = useState<string>("");
  const [previewIcon, setPreviewIcon] = useState<ToolIconOption | null>(null);

  const groupedRows = useMemo<ToolGroupRow[]>(
    () =>
      toolFixedEntries.map((entry) => {
        const category = categories.find((item) => item.code === entry.code) || null;
        return {
          key: entry.code,
          title: category?.name || entry.label,
          description: category?.description || "",
          defaultLink: category?.action_value || entry.defaultLink,
          category,
          items: items.filter((item) => item.category.code === entry.code).sort((a, b) => a.sort_order - b.sort_order),
        };
      }),
    [categories, items]
  );

  const loadData = async () => {
    setLoading(true);
    try {
      const [categoryResponse, itemResponse] = await Promise.all([
        adminApi.get<ApiResponse<ResourceCategory[]>>("/admin/resource-categories", { params: { resource_type: "marketplace", group_key: "tools" } }),
        adminApi.get<ApiResponse<ResourceItem[]>>("/admin/resource-items", { params: { resource_type: "marketplace" } }),
      ]);
      setCategories(categoryResponse.data.data);
      setItems(itemResponse.data.data.filter((item) => toolFixedEntries.some((entry) => entry.code === item.category.code)));
    } catch (error) {
      console.error("Failed to load product tools content", error);
      message.error("产品工具内容加载失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const openCreateModal = (categoryCode: string) => {
    setEditingItem(null);
    setActiveCategoryCode(categoryCode);
    const row = groupedRows.find((item) => item.key === categoryCode);
    form.setFieldsValue({
      icon: "Briefcase",
      title: "",
      summary: "",
      tags: [],
      link_value: row?.defaultLink || "",
      sort_order: row && row.items.length > 0 ? row.items[row.items.length - 1].sort_order + 1 : 1,
      is_published: true,
    });
    setOpen(true);
  };

  const openEditModal = (item: ResourceItem) => {
    setEditingItem(item);
    setActiveCategoryCode(item.category.code);
    form.setFieldsValue({
      icon: item.icon || "Briefcase",
      title: item.title,
      summary: item.summary,
      tags: normalizeTags(item.tags_json),
      link_value: item.link_value || "",
      sort_order: item.sort_order,
      is_published: item.is_published === 1,
    });
    setOpen(true);
  };

  const handleDelete = async (item: ResourceItem) => {
    try {
      await adminApi.delete(`/admin/resource-items/${item.id}`);
      message.success("工具条目已删除");
      await loadData();
    } catch (error) {
      console.error("Failed to delete product tool item", error);
      message.error("工具条目删除失败");
    }
  };

  const handleSave = async () => {
    const values = form.getFieldsValue();
    setSaving(true);
    try {
      const payload = {
        resource_type: "marketplace",
        category_code: activeCategoryCode,
        title: values.title.trim(),
        summary: values.summary.trim(),
        icon: values.icon || null,
        image_url: editingItem?.image_url || null,
        badge_text: editingItem?.badge_text || null,
        price: editingItem?.price || null,
        unit_label: editingItem?.unit_label || null,
        status_text: editingItem?.status_text || null,
        link_type: resolveActionType(values.link_value.trim()),
        link_value: values.link_value.trim(),
        primary_button_text: editingItem?.primary_button_text || null,
        secondary_link_type: editingItem?.secondary_link_type || "none",
        secondary_link_value: editingItem?.secondary_link_value || null,
        secondary_button_text: editingItem?.secondary_button_text || null,
        tags_json: stringifyJson(values.tags),
        meta_json: editingItem?.meta_json || null,
        show_on_home: editingItem?.show_on_home ?? 1,
        sort_order: values.sort_order,
        is_published: values.is_published ? 1 : 0,
      };
      if (editingItem) {
        await adminApi.put(`/admin/resource-items/${editingItem.id}`, payload);
      } else {
        await adminApi.post("/admin/resource-items", payload);
      }
      message.success(editingItem ? "工具条目已更新" : "工具条目已新增");
      setOpen(false);
      await loadData();
    } catch (error) {
      console.error("Failed to save product tool item", error);
      message.error("工具条目保存失败");
    } finally {
      setSaving(false);
    }
  };

  const childColumns: ColumnsType<ResourceItem> = [
    {
      title: "图标",
      key: "thumb",
      width: 88,
      render: (_, record) => renderToolThumb(record),
    },
    { title: "名称", dataIndex: "title", key: "title", width: 180 },
    { title: "说明", dataIndex: "summary", key: "summary", ellipsis: true },
    {
      title: "标签",
      key: "tags",
      width: 220,
      render: (_, record) => (
        <Space wrap>
          {normalizeTags(record.tags_json).map((tag) => (
            <Tag color="blue" key={tag}>
              {tag}
            </Tag>
          ))}
        </Space>
      ),
    },
    {
      title: "跳转地址",
      key: "link_value",
      width: 120,
      render: (_, record) => (
        <Tooltip title={record.link_value || "-"}>
          <span style={{ color: "#475569", display: "inline-block", maxWidth: 100, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {record.link_value || "-"}
          </span>
        </Tooltip>
      ),
    },
    {
      title: "链接",
      key: "link_icon",
      width: 80,
      align: "center",
      render: (_, record) => renderLinkIcon(record.link_value || ""),
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

  const parentColumns: ColumnsType<ToolGroupRow> = [
    { title: "分组名称", dataIndex: "title", key: "title", width: 200 },
    { title: "说明", dataIndex: "description", key: "description" },
    { title: "条目数量", key: "count", width: 100, render: (_, record) => record.items.length },
    { title: "排序", key: "sort_order", width: 80, render: (_, record) => record.category?.sort_order || "-" },
    { title: "状态", key: "status", width: 90, render: (_, record) => (record.category?.is_published === 0 ? "草稿" : "已发布") },
    {
      title: "操作",
      key: "actions",
      width: 140,
      fixed: "right",
      render: (_, record) => (
        <Button onClick={() => openCreateModal(record.key)} type="link">
          新增条目
        </Button>
      ),
    },
  ];

  return (
    <div className="admin-page">
      <Card className="admin-page-card" loading={loading}>
        <div className="admin-toolbar">
          <div>
            <h2 style={{ margin: 0 }}>产品工具</h2>
            <p className="admin-muted" style={{ marginBottom: 0, marginTop: 8 }}>
              点击分组行可展开查看和维护前台展示的具体工具条目，结构与前台保持一致。
            </p>
          </div>
        </div>
      </Card>

      <Card className="admin-page-card" title="产品工具分组">
        <Table
          columns={parentColumns}
          dataSource={groupedRows}
          expandable={{
            expandedRowRender: (record) => (
            <div style={{ padding: "8px 6px 4px" }}>
                <div style={{ overflowX: "auto" }}>
                  <Table
                    columns={childColumns}
                    dataSource={record.items}
                    pagination={false}
                    rowKey="id"
                    size="small"
                    scroll={{ x: 1120 }}
                  />
                </div>
              </div>
            ),
            rowExpandable: () => true,
          }}
          pagination={false}
          rowKey="key"
          scroll={{ x: 860 }}
        />
      </Card>

      <Modal confirmLoading={saving} destroyOnHidden onCancel={() => setOpen(false)} onOk={() => void handleSave()} open={open} title={editingItem ? "编辑工具条目" : "新增工具条目"} width={760}>
        <Form form={form} layout="vertical" requiredMark={false}>
          <Form.Item label="图标" name="icon">
            <Select
              options={toolIconOptions}
              optionFilterProp="label"
              optionRender={(option) => {
                const data = option.data as ToolIconOption;
                return (
                  <div style={{ alignItems: "center", display: "flex", gap: 12, justifyContent: "space-between", width: "100%" }}>
                    <div style={{ alignItems: "center", display: "flex", gap: 12, minWidth: 0 }}>
                      <CmsIconBadge background="#f8fafc" color="#475569" name={data.value} size={18} strokeWidth={2} wrapperSize={40} />
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{data.label}</span>
                    </div>
                    <Button
                      icon={<EyeOutlined />}
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        setPreviewIcon(data);
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
          <Form.Item label="名称" name="title" rules={[{ required: true, message: "请输入名称" }]}>
            <Input placeholder="请输入名称" />
          </Form.Item>
          <Form.Item label="说明" name="summary" rules={[{ required: true, message: "请输入说明" }]}>
            <Input.TextArea placeholder="请输入说明" rows={4} />
          </Form.Item>
          <Form.Item label="标签" name="tags">
            <Select mode="tags" options={commonTagOptions.map((tag) => ({ label: tag, value: tag }))} placeholder="请输入标签" />
          </Form.Item>
          <Form.Item label="跳转地址" name="link_value" rules={[{ required: true, message: "请输入跳转地址" }]}>
            <Input placeholder="请输入跳转地址" />
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

      <Modal destroyOnHidden footer={null} onCancel={() => setPreviewIcon(null)} open={Boolean(previewIcon)} title={previewIcon?.label || "图标预览"} width={320}>
        <div style={{ alignItems: "center", display: "grid", gap: 16, justifyItems: "center", padding: "12px 0 6px" }}>
          <CmsIconBadge background="linear-gradient(180deg,#2b95ff 0%,#0f67e7 100%)" color="#fff" name={previewIcon?.value} size={34} strokeWidth={2.1} wrapperSize={96} />
          <div style={{ color: "#0f172a", fontSize: 16, fontWeight: 600 }}>{previewIcon?.label}</div>
        </div>
      </Modal>
    </div>
  );
}
