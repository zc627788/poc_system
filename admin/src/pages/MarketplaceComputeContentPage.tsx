import { Button, Card, Form, Input, InputNumber, Modal, Space, Switch, Table, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useMemo, useState } from "react";
import { adminApi } from "../api";
import { renderLinkIcon, resolveActionType } from "./MarketplaceAdminHelpers";
import type { ApiResponse, ResourceCategory, ResourceItem } from "../types";

type SummaryFormValues = {
  name: string;
  description: string;
  button_text?: string;
  action_value: string;
};

type ComputeItemFormValues = {
  title: string;
  price: string;
  unit_label: string;
  badge_text?: string;
  primary_button_text?: string;
  secondary_button_text?: string;
  link_value: string;
  secondary_link_value: string;
  region?: string;
  server?: string;
  gpu_cards?: string;
  vcpu_cores?: string;
  memory?: string;
  gpu_memory?: string;
  storage?: string;
  sort_order: number;
  is_published: boolean;
};

function parseMeta(value?: string | null) {
  try {
    return value ? JSON.parse(value) as Record<string, unknown> : {};
  } catch {
    return {};
  }
}

const computeSummaryTitleFallback = "厦门市公共算力服务平台";

function normalizeComputePlatformName(name?: string | null) {
  const trimmed = name?.trim() || "";
  if (!trimmed || trimmed === "普惠算力") {
    return computeSummaryTitleFallback;
  }
  return trimmed;
}

export function MarketplaceComputeContentPage() {
  const [summaryForm] = Form.useForm<SummaryFormValues>();
  const [itemForm] = Form.useForm<ComputeItemFormValues>();
  const [categories, setCategories] = useState<ResourceCategory[]>([]);
  const [items, setItems] = useState<ResourceItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingSummary, setEditingSummary] = useState(false);
  const [open, setOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ResourceItem | null>(null);

  const summary = useMemo(() => categories.sort((a, b) => a.sort_order - b.sort_order)[0] || null, [categories]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [categoryResponse, itemResponse] = await Promise.all([
        adminApi.get<ApiResponse<ResourceCategory[]>>("/admin/resource-categories", { params: { resource_type: "marketplace", group_key: "compute" } }),
        adminApi.get<ApiResponse<ResourceItem[]>>("/admin/resource-items", { params: { resource_type: "marketplace", group_key: "compute" } }),
      ]);
      setCategories(categoryResponse.data.data);
      setItems(itemResponse.data.data.sort((a, b) => a.sort_order - b.sort_order));
      summaryForm.setFieldsValue({
        name: normalizeComputePlatformName(categoryResponse.data.data[0]?.name),
        description: categoryResponse.data.data[0]?.description || "",
        button_text: categoryResponse.data.data[0]?.button_text || "查看更多",
        action_value: categoryResponse.data.data[0]?.action_value || "",
      });
    } catch (error) {
      console.error("Failed to load compute content", error);
      message.error("普惠算力内容加载失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadData(); }, []);

  const columns: ColumnsType<ResourceItem> = [
    { title: "产品名称", dataIndex: "title", key: "title", width: 180 },
    { title: "价格", key: "price", width: 120, render: (_, record) => `${record.price || "-"}${record.unit_label || ""}` },
    { title: "状态角标", dataIndex: "badge_text", key: "badge_text", width: 100 },
    { title: "地区", key: "region", width: 90, render: (_, record) => String(parseMeta(record.meta_json).region || "-") },
    { title: "服务器", key: "server", width: 90, render: (_, record) => String(parseMeta(record.meta_json).server || "-") },
    { title: "GPU", key: "gpu", width: 70, render: (_, record) => String(parseMeta(record.meta_json).gpu_cards || "-") },
    { title: "vCPU", key: "vcpu", width: 70, render: (_, record) => String(parseMeta(record.meta_json).vcpu_cores || "-") },
    { title: "内存", key: "memory", width: 90, render: (_, record) => String(parseMeta(record.meta_json).memory || "-") },
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
            const meta = parseMeta(record.meta_json);
            setEditingItem(record);
            itemForm.setFieldsValue({
              title: record.title,
              price: record.price || "",
              unit_label: record.unit_label || "",
              badge_text: record.badge_text || "",
              primary_button_text: record.primary_button_text || "",
              secondary_button_text: record.secondary_button_text || "",
              link_value: record.link_value || "",
              secondary_link_value: record.secondary_link_value || "",
              region: String(meta.region || ""),
              server: String(meta.server || ""),
              gpu_cards: String(meta.gpu_cards || ""),
              vcpu_cores: String(meta.vcpu_cores || ""),
              memory: String(meta.memory || ""),
              gpu_memory: String(meta.gpu_memory || ""),
              storage: String(meta.storage || ""),
              sort_order: record.sort_order,
              is_published: record.is_published === 1,
            });
            setOpen(true);
          }} type="link">编辑</Button>
          <Button danger onClick={() => void adminApi.delete(`/admin/resource-items/${record.id}`).then(() => { message.success("算力产品已删除"); return loadData(); }).catch((error) => { console.error(error); message.error("算力产品删除失败"); })} type="link">删除</Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="admin-page">
      <Card className="admin-page-card" loading={loading}>
        <div className="admin-toolbar">
          <div>
            <h2 style={{ margin: 0 }}>普惠算力</h2>
            <p className="admin-muted" style={{ marginBottom: 0, marginTop: 8 }}>
              维护算力主介绍和算力产品列表。
            </p>
          </div>
          {editingSummary ? (
            <Space>
              <Button onClick={() => { setEditingSummary(false); summaryForm.setFieldsValue({ name: normalizeComputePlatformName(summary?.name), description: summary?.description || "", button_text: summary?.button_text || "查看更多", action_value: summary?.action_value || "" }); }}>取消</Button>
              <Button loading={saving} onClick={() => {
                if (!summary) return;
                const values = summaryForm.getFieldsValue();
                setSaving(true);
                adminApi.put(`/admin/resource-categories/${summary.id}`, {
                  ...summary,
                  name: normalizeComputePlatformName(values.name),
                  description: values.description.trim(),
                  button_text: values.button_text?.trim() || "查看更多",
                  action_type: /^https?:\/\//i.test(values.action_value.trim()) ? "external" : "internal",
                  action_value: values.action_value.trim(),
                })
                  .then(async () => { message.success("算力主介绍已保存"); setEditingSummary(false); await loadData(); })
                  .catch((error) => { console.error(error); message.error("算力主介绍保存失败"); })
                  .finally(() => setSaving(false));
              }} type="primary">保存</Button>
            </Space>
          ) : (
            <Button onClick={() => setEditingSummary(true)} type="primary">编辑主介绍</Button>
          )}
        </div>
        {editingSummary ? (
          <Form form={summaryForm} layout="vertical" requiredMark={false} style={{ marginTop: 16 }}>
            <Form.Item label="平台名称" name="name" rules={[{ required: true, message: "请输入平台名称" }]}><Input /></Form.Item>
            <Form.Item label="说明" name="description" rules={[{ required: true, message: "请输入说明" }]}><Input.TextArea rows={4} /></Form.Item>
            <Form.Item label="按钮文案" name="button_text"><Input /></Form.Item>
            <Form.Item label="跳转链接" name="action_value"><Input /></Form.Item>
          </Form>
        ) : (
          <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
            <div style={{ fontSize: 22, fontWeight: 700 }}>{normalizeComputePlatformName(summary?.name)}</div>
            <div style={{ color: "#475569" }}>{summary?.description || "-"}</div>
          </div>
        )}
      </Card>

      <Card className="admin-page-card" extra={<Button onClick={() => { setEditingItem(null); itemForm.setFieldsValue({ title: "", price: "", unit_label: "/月", badge_text: "", primary_button_text: "购买", secondary_button_text: "详情", link_value: "", secondary_link_value: "", region: "", server: "", gpu_cards: "", vcpu_cores: "", memory: "", gpu_memory: "", storage: "", sort_order: items.length > 0 ? items[items.length - 1].sort_order + 1 : 1, is_published: true }); setOpen(true); }} type="primary">新增算力产品</Button>} title="算力产品列表">
        <Table columns={columns} dataSource={items} pagination={false} rowKey="id" scroll={{ x: 1560 }} />
      </Card>

      <Modal confirmLoading={saving} destroyOnHidden onCancel={() => setOpen(false)} onOk={() => {
        const values = itemForm.getFieldsValue();
        const payload = {
          resource_type: "marketplace",
          category_code: summary?.code,
          title: values.title.trim(),
          summary: editingItem?.summary || "",
          icon: editingItem?.icon || null,
          image_url: editingItem?.image_url || null,
          badge_text: values.badge_text || null,
          price: values.price || null,
          unit_label: values.unit_label || null,
          status_text: editingItem?.status_text || null,
          link_type: resolveActionType(values.link_value.trim()),
          link_value: values.link_value.trim(),
          primary_button_text: values.primary_button_text || null,
          secondary_link_type: resolveActionType(values.secondary_link_value.trim()),
          secondary_link_value: values.secondary_link_value.trim() || null,
          secondary_button_text: values.secondary_button_text || null,
          tags_json: editingItem?.tags_json || null,
          meta_json: JSON.stringify({ region: values.region, server: values.server, gpu_cards: values.gpu_cards, vcpu_cores: values.vcpu_cores, memory: values.memory, gpu_memory: values.gpu_memory, storage: values.storage }),
          show_on_home: editingItem?.show_on_home ?? 1,
          sort_order: values.sort_order,
          is_published: values.is_published ? 1 : 0,
        };
        setSaving(true);
        const req = editingItem ? adminApi.put(`/admin/resource-items/${editingItem.id}`, payload) : adminApi.post("/admin/resource-items", payload);
        req.then(async () => { message.success(editingItem ? "算力产品已更新" : "算力产品已新增"); setOpen(false); await loadData(); }).catch((error) => { console.error(error); message.error("算力产品保存失败"); }).finally(() => setSaving(false));
      }} open={open} title={editingItem ? "编辑算力产品" : "新增算力产品"} width={860}>
        <Form form={itemForm} layout="vertical" requiredMark={false}>
          <div className="admin-grid-2">
            <Form.Item label="产品名称" name="title" rules={[{ required: true, message: "请输入产品名称" }]}><Input /></Form.Item>
            <Form.Item label="状态角标" name="badge_text"><Input placeholder="例如：限免" /></Form.Item>
          </div>
          <div className="admin-grid-3">
            <Form.Item label="价格" name="price"><Input /></Form.Item>
            <Form.Item label="单位" name="unit_label"><Input /></Form.Item>
            <Form.Item label="排序" name="sort_order" rules={[{ required: true, message: "请输入排序" }]}><InputNumber min={0} style={{ width: "100%" }} /></Form.Item>
          </div>
          <div className="admin-grid-3">
            <Form.Item label="地区" name="region"><Input /></Form.Item>
            <Form.Item label="服务器" name="server"><Input /></Form.Item>
            <Form.Item label="GPU 数" name="gpu_cards"><Input /></Form.Item>
          </div>
          <div className="admin-grid-3">
            <Form.Item label="vCPU" name="vcpu_cores"><Input /></Form.Item>
            <Form.Item label="内存" name="memory"><Input /></Form.Item>
            <Form.Item label="显存" name="gpu_memory"><Input /></Form.Item>
          </div>
          <Form.Item label="存储" name="storage"><Input /></Form.Item>
          <div className="admin-grid-2">
            <Form.Item label="详情按钮文案" name="secondary_button_text"><Input /></Form.Item>
            <Form.Item label="购买按钮文案" name="primary_button_text"><Input /></Form.Item>
          </div>
          <div className="admin-grid-2">
            <Form.Item label="详情跳转链接" name="secondary_link_value"><Input /></Form.Item>
            <Form.Item label="购买跳转链接" name="link_value" rules={[{ required: true, message: "请输入跳转链接" }]}><Input /></Form.Item>
          </div>
          <Form.Item label="发布状态" name="is_published" valuePropName="checked"><Switch checkedChildren="已发布" unCheckedChildren="草稿" /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
