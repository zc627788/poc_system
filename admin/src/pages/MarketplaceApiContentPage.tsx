import { Button, Card, Form, Input, InputNumber, Modal, Select, Space, Switch, Table, Tag, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useMemo, useState } from "react";
import { adminApi } from "../api";
import { commonTagOptions, normalizeSection, normalizeTags, PageInfoCard, renderIconBadge, renderLinkIcon, resolveActionType, stringifyJson, type PageInfoFormValues } from "./MarketplaceAdminHelpers";
import type { ApiResponse, PageSection, ResourceCategory, ResourceItem } from "../types";

type CategoryFormValues = { name: string; sort_order: number; is_published: boolean };
type ApiItemFormValues = { icon: string; title: string; summary: string; tags: string[]; link_value: string; sort_order: number; is_published: boolean };

export function MarketplaceApiContentPage() {
  const [pageForm] = Form.useForm<PageInfoFormValues>();
  const [categoryForm] = Form.useForm<CategoryFormValues>();
  const [itemForm] = Form.useForm<ApiItemFormValues>();
  const [sections, setSections] = useState<PageSection[]>([]);
  const [categories, setCategories] = useState<ResourceCategory[]>([]);
  const [items, setItems] = useState<ResourceItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingPage, setEditingPage] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [itemOpen, setItemOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ResourceCategory | null>(null);
  const [editingItem, setEditingItem] = useState<ResourceItem | null>(null);

  const hero = useMemo(() => normalizeSection(sections, "hero"), [sections]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [sectionResponse, categoryResponse, itemResponse] = await Promise.all([
        adminApi.get<ApiResponse<PageSection[]>>("/admin/page-sections", { params: { page_key: "api_market" } }),
        adminApi.get<ApiResponse<ResourceCategory[]>>("/admin/resource-categories", { params: { resource_type: "api_market" } }),
        adminApi.get<ApiResponse<ResourceItem[]>>("/admin/resource-items", { params: { resource_type: "api_market" } }),
      ]);
      setSections(sectionResponse.data.data);
      setCategories(categoryResponse.data.data.sort((a, b) => a.sort_order - b.sort_order));
      setItems(itemResponse.data.data.sort((a, b) => a.sort_order - b.sort_order));
      const currentHero = sectionResponse.data.data.find((item) => item.section_key === "hero");
      pageForm.setFieldsValue({
        title: currentHero?.title || "API 服务",
        subtitle: currentHero?.subtitle || "",
      });
    } catch (error) {
      console.error("Failed to load API content", error);
      message.error("API 服务内容加载失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const saveHero = async () => {
    setSaving(true);
    try {
      const values = pageForm.getFieldsValue();
      const payload = {
        page_key: "api_market",
        section_key: "hero",
        title: values.title || "API 服务",
        subtitle: values.subtitle || "",
        content: hero?.content || "",
        extra_json: hero?.extra_json || null,
        sort_order: hero?.sort_order ?? 1,
        is_published: hero?.is_published ?? 1,
      };
      if (hero) await adminApi.put(`/admin/page-sections/${hero.id}`, payload);
      else await adminApi.post("/admin/page-sections", payload);
      message.success("页面信息已保存");
      setEditingPage(false);
      await loadData();
    } catch (error) {
      console.error("Failed to save API hero", error);
      message.error("页面信息保存失败");
    } finally {
      setSaving(false);
    }
  };

  const categoryColumns: ColumnsType<ResourceCategory> = [
    { title: "分类名称", dataIndex: "name", key: "name" },
    { title: "排序", dataIndex: "sort_order", key: "sort_order", width: 80 },
    { title: "状态", dataIndex: "is_published", key: "is_published", width: 90, render: (value: number) => (value === 1 ? "已发布" : "草稿") },
    { title: "操作", key: "actions", width: 120, fixed: "right", render: (_, record) => <Button onClick={() => {
      setEditingCategory(record);
      categoryForm.setFieldsValue({ name: record.name, sort_order: record.sort_order, is_published: record.is_published === 1 });
      setCategoryOpen(true);
    }} type="link">编辑</Button> },
  ];

  const itemColumns: ColumnsType<ResourceItem> = [
    { title: "图标", dataIndex: "icon", key: "icon", width: 90, render: (value?: string) => renderIconBadge(value) },
    { title: "服务名称", dataIndex: "title", key: "title", width: 180 },
    { title: "所属分类", key: "category", width: 130, render: (_, record) => record.category.name },
    { title: "简介", dataIndex: "summary", key: "summary", ellipsis: true },
    { title: "标签", key: "tags", width: 220, render: (_, record) => <Space wrap>{normalizeTags(record.tags_json).map((tag) => <Tag key={tag}>{tag}</Tag>)}</Space> },
    { title: "跳转链接", key: "link", width: 110, align: "center", render: (_, record) => renderLinkIcon(record.link_value || "") },
    { title: "排序", dataIndex: "sort_order", key: "sort_order", width: 80 },
    { title: "状态", dataIndex: "is_published", key: "is_published", width: 90, render: (value: number) => (value === 1 ? "已发布" : "草稿") },
    { title: "操作", key: "actions", width: 160, fixed: "right", render: (_, record) => <Space><Button onClick={() => {
      setEditingItem(record);
      itemForm.setFieldsValue({ icon: record.icon || "Cable", title: record.title, summary: record.summary, tags: normalizeTags(record.tags_json), link_value: record.link_value || "", sort_order: record.sort_order, is_published: record.is_published === 1 });
      setItemOpen(true);
    }} type="link">编辑</Button><Button danger onClick={() => void adminApi.delete(`/admin/resource-items/${record.id}`).then(() => { message.success("API 服务已删除"); return loadData(); }).catch((error) => { console.error(error); message.error("API 服务删除失败"); })} type="link">删除</Button></Space> },
  ];

  return (
    <div className="admin-page">
      <PageInfoCard
        editing={editingPage}
        form={pageForm}
        onCancel={() => {
          setEditingPage(false);
          pageForm.setFieldsValue({ title: hero?.title || "API 服务", subtitle: hero?.subtitle || "" });
        }}
        onEdit={() => setEditingPage(true)}
        onSave={() => void saveHero()}
        saving={saving || loading}
        title="页面信息"
        fields={<><Form.Item label="页面标题" name="title" rules={[{ required: true, message: "请输入页面标题" }]}><Input /></Form.Item><Form.Item label="页面说明" name="subtitle"><Input.TextArea rows={4} /></Form.Item></>}
      >
        <div style={{ display: "grid", gap: 12 }}><div style={{ fontSize: 22, fontWeight: 700 }}>{hero?.title || "API 服务"}</div><div style={{ color: "#475569" }}>{hero?.subtitle || "-"}</div></div>
      </PageInfoCard>

      <Card className="admin-page-card" title="服务分类">
        <Table columns={categoryColumns} dataSource={categories} pagination={false} rowKey="id" scroll={{ x: 520 }} />
      </Card>

      <Card className="admin-page-card" extra={<Button onClick={() => {
        setEditingItem(null);
        itemForm.setFieldsValue({ icon: "Cable", title: "", summary: "", tags: [], link_value: "", sort_order: items.length > 0 ? items[items.length - 1].sort_order + 1 : 1, is_published: true });
        setItemOpen(true);
      }} type="primary">新增服务</Button>} title="服务列表">
        <Table columns={itemColumns} dataSource={items} pagination={false} rowKey="id" scroll={{ x: 1380 }} />
      </Card>

      <Modal confirmLoading={saving} destroyOnHidden onCancel={() => setCategoryOpen(false)} onOk={() => {
        if (!editingCategory) return;
        const values = categoryForm.getFieldsValue();
        setSaving(true);
        adminApi.put(`/admin/resource-categories/${editingCategory.id}`, { ...editingCategory, name: values.name.trim(), sort_order: values.sort_order, is_published: values.is_published ? 1 : 0 })
          .then(async () => { message.success("分类已保存"); setCategoryOpen(false); await loadData(); })
          .catch((error) => { console.error(error); message.error("分类保存失败"); })
          .finally(() => setSaving(false));
      }} open={categoryOpen} title="编辑服务分类" width={640}>
        <Form form={categoryForm} layout="vertical" requiredMark={false}>
          <Form.Item label="分类名称" name="name" rules={[{ required: true, message: "请输入分类名称" }]}><Input /></Form.Item>
          <Form.Item label="排序" name="sort_order" rules={[{ required: true, message: "请输入排序" }]}><InputNumber min={0} style={{ width: "100%" }} /></Form.Item>
          <Form.Item label="发布状态" name="is_published" valuePropName="checked"><Switch checkedChildren="已发布" unCheckedChildren="草稿" /></Form.Item>
        </Form>
      </Modal>

      <Modal confirmLoading={saving} destroyOnHidden onCancel={() => setItemOpen(false)} onOk={() => {
        const values = itemForm.getFieldsValue();
        const payload = {
          resource_type: "api_market",
          category_code: editingItem?.category.code || categories[0]?.code,
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
        setSaving(true);
        const req = editingItem ? adminApi.put(`/admin/resource-items/${editingItem.id}`, payload) : adminApi.post("/admin/resource-items", payload);
        req.then(async () => { message.success(editingItem ? "服务已更新" : "服务已新增"); setItemOpen(false); await loadData(); })
          .catch((error) => { console.error(error); message.error("服务保存失败"); })
          .finally(() => setSaving(false));
      }} open={itemOpen} title={editingItem ? "编辑服务" : "新增服务"} width={760}>
        <Form form={itemForm} layout="vertical" requiredMark={false}>
          <Form.Item label="图标" name="icon"><Select options={[{ label: "接口服务", value: "Cable" }, { label: "数据库", value: "Database" }, { label: "流程协同", value: "Workflow" }]} /></Form.Item>
          <Form.Item label="服务名称" name="title" rules={[{ required: true, message: "请输入服务名称" }]}><Input /></Form.Item>
          <Form.Item label="简介" name="summary" rules={[{ required: true, message: "请输入简介" }]}><Input.TextArea rows={4} /></Form.Item>
          <Form.Item label="标签" name="tags"><Select mode="multiple" options={commonTagOptions.map((tag) => ({ label: tag, value: tag }))} /></Form.Item>
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
