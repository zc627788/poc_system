import { Form, Input, message } from "antd";
import { useEffect, useMemo, useState } from "react";
import { adminApi } from "../api";
import { PageInfoCard, parseJson, sectionBody, stringifyJson, type PageInfoFormValues } from "./MarketplaceAdminHelpers";
import type { ApiResponse, PageSection } from "../types";

type LinkExtra = {
  button_text?: string;
  action_value?: string;
};

const PAGE_KEY = "marketplace";

export function MarketplaceOverviewPage() {
  const [heroForm] = Form.useForm<PageInfoFormValues>();
  const [dataForm] = Form.useForm<PageInfoFormValues>();
  const [toolsForm] = Form.useForm<PageInfoFormValues>();
  const [computeForm] = Form.useForm<PageInfoFormValues>();

  const [sections, setSections] = useState<PageSection[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);

  const sectionMap = useMemo(
    () => Object.fromEntries(sections.map((item) => [item.section_key, item])) as Record<string, PageSection | undefined>,
    [sections]
  );

  const loadSections = async () => {
    setLoading(true);
    try {
      const response = await adminApi.get<ApiResponse<PageSection[]>>("/admin/page-sections", { params: { page_key: PAGE_KEY } });
      const nextSections = response.data.data;
      setSections(nextSections);

      const hero = nextSections.find((item) => item.section_key === "hero");
      heroForm.setFieldsValue({
        title: hero?.title || "资源集市",
        subtitle: hero?.subtitle || "",
        content: hero?.content || "",
      });

      ["marketplace_group_data", "marketplace_group_tools", "marketplace_group_compute"].forEach((key) => {
        const current = nextSections.find((item) => item.section_key === key);
        const extra = parseJson<LinkExtra>(current?.extra_json, {});
        const form = key === "marketplace_group_data" ? dataForm : key === "marketplace_group_tools" ? toolsForm : computeForm;
        form.setFieldsValue({
          title: current?.title || "",
          subtitle: current?.subtitle || "",
          button_text: extra.button_text || "查看更多",
          action_value: extra.action_value || "",
        });
      });
    } catch (error) {
      console.error("Failed to load marketplace sections", error);
      message.error("资源市集页面内容加载失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadSections();
  }, []);

  const saveSection = async (sectionKey: string, payload: Pick<PageSection, "title" | "subtitle" | "content" | "extra_json" | "sort_order" | "is_published">) => {
    const existing = sectionMap[sectionKey];
    const body = { page_key: PAGE_KEY, section_key: sectionKey, ...payload };
    if (existing) {
      await adminApi.put(`/admin/page-sections/${existing.id}`, body);
    } else {
      await adminApi.post("/admin/page-sections", body);
    }
  };

  const handleSaveHero = async () => {
    setSaving(true);
    try {
      const values = heroForm.getFieldsValue();
      await saveSection("hero", {
        title: values.title || "资源集市",
        subtitle: values.subtitle || "",
        content: values.content || "",
        extra_json: sectionMap.hero?.extra_json || null,
        sort_order: sectionMap.hero?.sort_order ?? 1,
        is_published: sectionMap.hero?.is_published ?? 1,
      });
      message.success("页面信息已保存");
      setEditingKey(null);
      await loadSections();
    } catch (error) {
      console.error("Failed to save marketplace hero", error);
      message.error("页面信息保存失败");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveGroup = async (sectionKey: string) => {
    const form = sectionKey === "marketplace_group_data" ? dataForm : sectionKey === "marketplace_group_tools" ? toolsForm : computeForm;
    setSaving(true);
    try {
      const values = form.getFieldsValue();
      await saveSection(sectionKey, {
        title: values.title || "",
        subtitle: values.subtitle || "",
        content: sectionMap[sectionKey]?.content || "",
        extra_json: stringifyJson({
          button_text: values.button_text || "查看更多",
          action_value: values.action_value || "",
        }),
        sort_order: sectionMap[sectionKey]?.sort_order ?? 2,
        is_published: sectionMap[sectionKey]?.is_published ?? 1,
      });
      message.success("分区信息已保存");
      setEditingKey(null);
      await loadSections();
    } catch (error) {
      console.error("Failed to save marketplace group", error);
      message.error("分区信息保存失败");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-page">
      <PageInfoCard
        editing={editingKey === "hero"}
        form={heroForm}
        onCancel={() => {
          setEditingKey(null);
          heroForm.setFieldsValue({
            title: sectionMap.hero?.title || "资源集市",
            subtitle: sectionMap.hero?.subtitle || "",
            content: sectionMap.hero?.content || "",
          });
        }}
        onEdit={() => setEditingKey("hero")}
        onSave={() => void handleSaveHero()}
        saving={saving || loading}
        title="页面信息"
        fields={
          <>
            <Form.Item label="页面标题" name="title" rules={[{ required: true, message: "请输入页面标题" }]}>
              <Input placeholder="例如：资源集市" />
            </Form.Item>
            <Form.Item label="页面副标题" name="subtitle">
              <Input placeholder="请输入页面副标题" />
            </Form.Item>
            <Form.Item label="页面说明" name="content">
              <Input.TextArea placeholder="请输入页面说明" rows={4} />
            </Form.Item>
          </>
        }
      >
        {sectionBody(sectionMap.hero?.title || "资源集市", sectionMap.hero?.subtitle, sectionMap.hero?.content ? <div style={{ color: "#475569", lineHeight: 1.8 }}>{sectionMap.hero?.content}</div> : null)}
      </PageInfoCard>

      {[
        { key: "marketplace_group_data", title: "数据资源区" },
        { key: "marketplace_group_tools", title: "产品工具区" },
        { key: "marketplace_group_compute", title: "普惠算力区" },
      ].map((item) => {
        const current = sectionMap[item.key];
        const extra = parseJson<LinkExtra>(current?.extra_json, {});
        const form = item.key === "marketplace_group_data" ? dataForm : item.key === "marketplace_group_tools" ? toolsForm : computeForm;
        return (
          <PageInfoCard
            editing={editingKey === item.key}
            form={form}
            key={item.key}
            onCancel={() => {
              setEditingKey(null);
              form.setFieldsValue({
                title: current?.title || "",
                subtitle: current?.subtitle || "",
                button_text: extra.button_text || "查看更多",
                action_value: extra.action_value || "",
              });
            }}
            onEdit={() => setEditingKey(item.key)}
            onSave={() => void handleSaveGroup(item.key)}
            saving={saving}
            title={item.title}
            fields={
              <>
                <Form.Item label="分区标题" name="title" rules={[{ required: true, message: "请输入分区标题" }]}>
                  <Input placeholder="请输入分区标题" />
                </Form.Item>
                <Form.Item label="分区副标题" name="subtitle">
                  <Input placeholder="请输入分区副标题" />
                </Form.Item>
                <Form.Item label="查看更多按钮文案" name="button_text">
                  <Input placeholder="例如：查看更多" />
                </Form.Item>
                <Form.Item label="查看更多跳转链接" name="action_value">
                  <Input placeholder="请输入跳转链接" />
                </Form.Item>
              </>
            }
          >
            {sectionBody(current?.title || "-", current?.subtitle, <div style={{ color: "#475569" }}>按钮文案：{extra.button_text || "查看更多"}<br />跳转链接：{extra.action_value || "-"}</div>)}
          </PageInfoCard>
        );
      })}
    </div>
  );
}
