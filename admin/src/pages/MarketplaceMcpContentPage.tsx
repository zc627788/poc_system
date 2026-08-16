import { Button, Card, Form, Input, InputNumber, Modal, Select, Space, Switch, Table, Tag, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useMemo, useState } from "react";
import { adminApi } from "../api";
import { normalizeMeta, normalizeSection, PageInfoCard, renderIconBadge, renderLinkIcon, resolveActionType, stringifyJson, type PageInfoFormValues } from "./MarketplaceAdminHelpers";
import type { ApiResponse, PageSection, ResourceItem } from "../types";

type McpItemFormValues = {
  icon: string;
  title: string;
  summary: string;
  status_text: string;
  capabilities: string[];
  button_text: string;
  link_value: string;
  sort_order: number;
  is_published: boolean;
};

export function MarketplaceMcpContentPage() {
  const [pageForm] = Form.useForm<PageInfoFormValues>();
  const [itemForm] = Form.useForm<McpItemFormValues>();
  const [sections, setSections] = useState<PageSection[]>([]);
  const [items, setItems] = useState<ResourceItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingPage, setEditingPage] = useState(false);
  const [open, setOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ResourceItem | null>(null);

  const hero = useMemo(() => normalizeSection(sections, "hero"), [sections]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [sectionResponse, itemResponse] = await Promise.all([
        adminApi.get<ApiResponse<PageSection[]>>("/admin/page-sections", { params: { page_key: "mcp_market" } }),
        adminApi.get<ApiResponse<ResourceItem[]>>("/admin/resource-items", { params: { resource_type: "mcp_market" } }),
      ]);
      setSections(sectionResponse.data.data);
      setItems(itemResponse.data.data.sort((a, b) => a.sort_order - b.sort_order));
      const currentHero = sectionResponse.data.data.find((item) => item.section_key === "hero");
      pageForm.setFieldsValue({ title: currentHero?.title || "MCP 服务", subtitle: currentHero?.subtitle || "" });
    } catch (error) {
      console.error("Failed to load MCP content", error);
      message.error("MCP 服务内容加载失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const columns: ColumnsType<ResourceItem> = [
    { title: "图标", dataIndex: "icon", key: "icon", width: 90, render: (value?: string) => renderIconBadge(value) },
    { title: "服务名称", dataIndex: "title", key: "title", width: 180 },
    { title: "简介", dataIndex: "summary", key: "summary", ellipsis: true },
    { title: "状态文案", dataIndex: "status_text", key: "status_text", width: 120 },
    {
      title: "能力标签",
      key: "caps",
      width: 240,
      render: (_, record) => {
        const meta = normalizeMeta(record.meta_json);
        const list = [...(Array.isArray(meta.items) ? meta.items : []), ...(Array.isArray(meta.tools) ? meta.tools : [])] as string[];
        return <Space wrap>{list.map((item) => <Tag key={item}>{item}</Tag>)}</Space>;
      },
    },
    { title: "跳转链接", key: "link", width: 110, align: "center", render: (_, record) => renderLinkIcon(record.link_value || "") },
    { title: "排序", dataIndex: "sort_order", key: "sort_order", width: 80 },
    { title: "状态", dataIndex: "is_published", key: "is_published", width: 90, render: (value: number) => (value === 1 ? "已发布" : "草稿") },
    {
      title: "操作",
      key: "actions",
      width: 160,
      fixed: "right",
      render: (_, record) => (
        <Space>
          <Button onClick={() => {
            const meta = normalizeMeta(record.meta_json);
            setEditingItem(record);
            itemForm.setFieldsValue({
              icon: record.icon || "Cable",
              title: record.title,
              summary: record.summary,
              status_text: record.status_text || String(meta.status || ""),
              capabilities: [...(Array.isArray(meta.items) ? meta.items : []), ...(Array.isArray(meta.tools) ? meta.tools : [])] as string[],
              button_text: record.primary_button_text || String(meta.button_text || ""),
              link_value: record.link_value || "",
              sort_order: record.sort_order,
              is_published: record.is_published === 1,
            });
            setOpen(true);
          }} type="link">编辑</Button>
          <Button danger onClick={() => void adminApi.delete(`/admin/resource-items/${record.id}`).then(() => { message.success("MCP 服务已删除"); return loadData(); }).catch((error) => { console.error(error); message.error("MCP 服务删除失败"); })} type="link">删除</Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="admin-page">
      <PageInfoCard
        editing={editingPage}
        form={pageForm}
        onCancel={() => { setEditingPage(false); pageForm.setFieldsValue({ title: hero?.title || "MCP 服务", subtitle: hero?.subtitle || "" }); }}
        onEdit={() => setEditingPage(true)}
        onSave={() => {
          const values = pageForm.getFieldsValue();
          setSaving(true);
          const payload = { page_key: "mcp_market", section_key: "hero", title: values.title || "MCP 服务", subtitle: values.subtitle || "", content: hero?.content || "", extra_json: hero?.extra_json || null, sort_order: hero?.sort_order ?? 1, is_published: hero?.is_published ?? 1 };
          const req = hero ? adminApi.put(`/admin/page-sections/${hero.id}`, payload) : adminApi.post("/admin/page-sections", payload);
          req.then(async () => { message.success("页面信息已保存"); setEditingPage(false); await loadData(); }).catch((error) => { console.error(error); message.error("页面信息保存失败"); }).finally(() => setSaving(false));
        }}
        saving={saving || loading}
        title="页面信息"
        fields={<><Form.Item label="页面标题" name="title" rules={[{ required: true, message: "请输入页面标题" }]}><Input /></Form.Item><Form.Item label="页面说明" name="subtitle"><Input.TextArea rows={4} /></Form.Item></>}
      >
        <div style={{ display: "grid", gap: 12 }}><div style={{ fontSize: 22, fontWeight: 700 }}>{hero?.title || "MCP 服务"}</div><div style={{ color: "#475569" }}>{hero?.subtitle || "-"}</div></div>
      </PageInfoCard>

      <Card className="admin-page-card" extra={<Button onClick={() => { setEditingItem(null); itemForm.setFieldsValue({ icon: "Cable", title: "", summary: "", status_text: "未开通", capabilities: [], button_text: "请先创建MCP服务", link_value: "", sort_order: items.length > 0 ? items[items.length - 1].sort_order + 1 : 1, is_published: true }); setOpen(true); }} type="primary">新增服务</Button>} title="服务列表">
        <Table columns={columns} dataSource={items} pagination={false} rowKey="id" scroll={{ x: 1420 }} />
      </Card>

      <Modal confirmLoading={saving} destroyOnHidden onCancel={() => setOpen(false)} onOk={() => {
        const values = itemForm.getFieldsValue();
        const payload = {
          resource_type: "mcp_market",
          category_code: "mcp_default",
          title: values.title.trim(),
          summary: values.summary.trim(),
          icon: values.icon || null,
          image_url: editingItem?.image_url || null,
          badge_text: editingItem?.badge_text || null,
          price: editingItem?.price || null,
          unit_label: editingItem?.unit_label || null,
          status_text: values.status_text.trim(),
          link_type: resolveActionType(values.link_value.trim()),
          link_value: values.link_value.trim(),
          primary_button_text: values.button_text.trim(),
          secondary_link_type: editingItem?.secondary_link_type || "none",
          secondary_link_value: editingItem?.secondary_link_value || null,
          secondary_button_text: editingItem?.secondary_button_text || null,
          tags_json: stringifyJson([]),
          meta_json: stringifyJson({ items: values.capabilities.filter(Boolean), status: values.status_text.trim(), button_text: values.button_text.trim() }),
          show_on_home: editingItem?.show_on_home ?? 1,
          sort_order: values.sort_order,
          is_published: values.is_published ? 1 : 0,
        };
        setSaving(true);
        const req = editingItem ? adminApi.put(`/admin/resource-items/${editingItem.id}`, payload) : adminApi.post("/admin/resource-items", payload);
        req.then(async () => { message.success(editingItem ? "服务已更新" : "服务已新增"); setOpen(false); await loadData(); }).catch((error) => { console.error(error); message.error("服务保存失败"); }).finally(() => setSaving(false));
      }} open={open} title={editingItem ? "编辑服务" : "新增服务"} width={760}>
        <Form form={itemForm} layout="vertical" requiredMark={false}>
          <Form.Item label="图标" name="icon"><Select options={[{ label: "接口服务", value: "Cable" }, { label: "流程协同", value: "Workflow" }, { label: "机器人", value: "Bot" }]} /></Form.Item>
          <Form.Item label="服务名称" name="title" rules={[{ required: true, message: "请输入服务名称" }]}><Input /></Form.Item>
          <Form.Item label="简介" name="summary" rules={[{ required: true, message: "请输入简介" }]}><Input.TextArea rows={4} /></Form.Item>
          <Form.Item label="状态文案" name="status_text"><Input placeholder="例如：未开通" /></Form.Item>
          <Form.Item label="能力标签" name="capabilities"><Select mode="tags" placeholder="请输入能力标签" /></Form.Item>
          <Form.Item label="按钮文案" name="button_text"><Input placeholder="例如：请先创建MCP服务" /></Form.Item>
          <Form.Item label="跳转链接" name="link_value" rules={[{ required: true, message: "请输入跳转链接" }]}><Input /></Form.Item>
          <div className="admin-grid-2">
            <Form.Item label="排序" name="sort_order" rules={[{ required: true, message: "请输入排序" }]}><InputNumber min={0} style={{ width: "100%" }} /></Form.Item>
            <Form.Item label="发布状态" name="is_published" valuePropName="checked"><Switch checkedChildren="已发布" unCheckedChildren="草稿" /></Form.Item>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
