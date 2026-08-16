import {
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  LinkOutlined,
  PlusOutlined,
  SaveOutlined,
} from "@ant-design/icons";
import {
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
  Tooltip,
  message,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useMemo, useState } from "react";
import { adminApi } from "../api";
import {
  communityRequirementIconOptions,
  FrontendCommunityRequirementIconPreview,
  normalizeCommunityRequirementIcon,
} from "../components/FrontendIconPreview";
import type { ApiResponse, PageSection } from "../types";

type CommunityStatsItem = {
  value: string;
  label: string;
};

type CommunityStatsExtra = {
  items?: CommunityStatsItem[];
  background_image_url?: string;
};

type CommunityBaseExtra = {
  address?: string;
  phone?: string;
  email?: string;
  detail_url?: string;
  action_type?: string;
  action_value?: string;
  button_text?: string;
  image_url?: string;
  alt?: string;
  reverse?: boolean;
};

type CommunityRequirementItem = {
  text: string;
  icon?: string;
};

type CommunityRequirementsExtra = {
  items?: CommunityRequirementItem[];
  image_url?: string;
  image_alt?: string;
  ribbon_image_url?: string;
};

type IntroFormValues = {
  title: string;
  content: string;
};

type StatsFormValues = {
  items: CommunityStatsItem[];
};

type BaseFormValues = {
  title: string;
  address: string;
  phone: string;
  email: string;
  detail_url?: string;
  sort_order: number;
};

type RequirementFormValues = {
  text: string;
  icon: string;
};

const COMMUNITY_PAGE_KEY = "community";
const INTRO_SECTION_KEY = "intro";
const STATS_SECTION_KEY = "stats";
const REQUIREMENTS_SECTION_KEY = "requirements";

const defaultStatsItems: CommunityStatsItem[] = [
  { value: "300+", label: "入驻团队" },
  { value: "5000+", label: "服务人次" },
  { value: "2万m²", label: "社区面积" },
  { value: "50+", label: "合作机构" },
];

const defaultRequirementItems: CommunityRequirementItem[] = [
  { text: "个人创业者或者不超过 3 人微型团队", icon: "Users" },
  { text: "从事 AI 相关领域产品 / 服务开发", icon: "Sparkles" },
  { text: "持有有效证件完成实名认证", icon: "FileBadge2" },
  { text: "通过社区资质审核", icon: "ShieldCheck" },
];

function parseExtra<T>(extraJson?: string | null): T {
  if (!extraJson) {
    return {} as T;
  }

  try {
    return JSON.parse(extraJson) as T;
  } catch (error) {
    console.error("Failed to parse community section extra_json", error);
    return {} as T;
  }
}

function htmlToPlainText(value?: string | null) {
  if (!value) {
    return "";
  }

  if (typeof window === "undefined") {
    return value.replace(/<[^>]+>/g, "").trim();
  }

  const normalized = value.replace(/<br\s*\/?>/gi, "\n").replace(/<\/p>/gi, "\n\n");
  const container = window.document.createElement("div");
  container.innerHTML = normalized;
  return (container.textContent || container.innerText || "").replace(/\n{3,}/g, "\n\n").trim();
}

function plainTextToHtml(value: string) {
  const paragraphs = value
    .split(/\n{2,}/)
    .map((item) => item.trim())
    .filter(Boolean);

  if (paragraphs.length === 0) {
    return "";
  }

  return paragraphs.map((item) => `<p>${item.replace(/\n/g, "<br />")}</p>`).join("");
}

function normalizeStatsItems(items?: CommunityStatsItem[]) {
  const values = [...(items || [])];
  while (values.length < 4) {
    values.push(defaultStatsItems[values.length]);
  }
  return values.slice(0, 4);
}

function normalizeRequirementItems(items?: CommunityRequirementItem[]) {
  if (!items || items.length === 0) {
    return defaultRequirementItems.map((item) => ({ ...item }));
  }

  return items.map((item) => ({
    text: item.text || "",
    icon: normalizeCommunityRequirementIcon(item),
  }));
}

function resolveActionType(url?: string) {
  if (!url) {
    return "none";
  }
  return /^https?:\/\//i.test(url) ? "external" : "internal";
}

function buildBaseSectionKey(existingKeys: string[]) {
  let index = 1;
  while (existingKeys.includes(`base_custom_${index}`)) {
    index += 1;
  }
  return `base_custom_${index}`;
}

function renderIconPreview(icon?: string) {
  return <FrontendCommunityRequirementIconPreview name={icon} />;
}

function renderLinkCell(url?: string) {
  if (!url) {
    return <span style={{ color: "#94a3b8" }}>-</span>;
  }

  return (
    <Tooltip title={url}>
      <a
        href={url}
        onClick={(event) => event.stopPropagation()}
        rel="noopener noreferrer"
        style={{ color: "#1677ff" }}
        target="_blank"
      >
        <Space size={6}>
          <span>...</span>
          <LinkOutlined />
        </Space>
      </a>
    </Tooltip>
  );
}

export function CommunityContentPage() {
  const [introForm] = Form.useForm<IntroFormValues>();
  const [statsForm] = Form.useForm<StatsFormValues>();
  const [baseForm] = Form.useForm<BaseFormValues>();
  const [requirementForm] = Form.useForm<RequirementFormValues>();

  const [sections, setSections] = useState<PageSection[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingIntro, setSavingIntro] = useState(false);
  const [savingStats, setSavingStats] = useState(false);
  const [savingBase, setSavingBase] = useState(false);
  const [savingRequirement, setSavingRequirement] = useState(false);

  const [introEditing, setIntroEditing] = useState(false);
  const [statsEditing, setStatsEditing] = useState(false);
  const [baseModalOpen, setBaseModalOpen] = useState(false);
  const [editingBase, setEditingBase] = useState<PageSection | null>(null);
  const [requirementModalOpen, setRequirementModalOpen] = useState(false);
  const [editingRequirementIndex, setEditingRequirementIndex] = useState<number | null>(null);

  const introSection = useMemo(
    () => sections.find((item) => item.section_key === INTRO_SECTION_KEY) || null,
    [sections]
  );
  const statsSection = useMemo(
    () => sections.find((item) => item.section_key === STATS_SECTION_KEY) || null,
    [sections]
  );
  const requirementSection = useMemo(
    () => sections.find((item) => item.section_key === REQUIREMENTS_SECTION_KEY) || null,
    [sections]
  );
  const baseSections = useMemo(
    () =>
      sections
        .filter((item) => item.section_key.startsWith("base_"))
        .sort((a, b) => a.sort_order - b.sort_order || a.id - b.id),
    [sections]
  );

  const statsItems = useMemo(() => {
    const statsExtra = parseExtra<CommunityStatsExtra>(statsSection?.extra_json);
    return normalizeStatsItems(statsExtra.items);
  }, [statsSection]);

  const requirementItems = useMemo(() => {
    const requirementExtra = parseExtra<CommunityRequirementsExtra>(requirementSection?.extra_json);
    return normalizeRequirementItems(requirementExtra.items);
  }, [requirementSection]);

  const loadSections = async () => {
    setLoading(true);
    try {
      const response = await adminApi.get<ApiResponse<PageSection[]>>("/admin/page-sections", {
        params: { page_key: COMMUNITY_PAGE_KEY },
      });
      const data = response.data.data;
      setSections(data);

      const intro = data.find((item) => item.section_key === INTRO_SECTION_KEY);
      introForm.setFieldsValue({
        title: intro?.title || "厦门OPC社区",
        content: htmlToPlainText(intro?.content),
      });

      const stats = data.find((item) => item.section_key === STATS_SECTION_KEY);
      const statsExtra = parseExtra<CommunityStatsExtra>(stats?.extra_json);
      statsForm.setFieldsValue({
        items: normalizeStatsItems(statsExtra.items),
      });
    } catch (error) {
      console.error("Failed to load community sections", error);
      message.error("社区简介内容加载失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadSections();
  }, []);

  const saveSection = async (section: PageSection | null, payload: Omit<PageSection, "id">) => {
    if (section) {
      await adminApi.put(`/admin/page-sections/${section.id}`, payload);
      return;
    }
    await adminApi.post("/admin/page-sections", payload);
  };

  const handleSaveIntro = async (values: IntroFormValues) => {
    setSavingIntro(true);
    try {
      await saveSection(introSection, {
        page_key: COMMUNITY_PAGE_KEY,
        section_key: INTRO_SECTION_KEY,
        title: values.title.trim(),
        subtitle: introSection?.subtitle || "",
        content: plainTextToHtml(values.content.trim()),
        extra_json: introSection?.extra_json || "",
        sort_order: introSection?.sort_order || 2,
        is_published: 1,
      });
      message.success("社区简介说明已保存");
      setIntroEditing(false);
      await loadSections();
    } catch (error) {
      console.error("Failed to save community intro", error);
      message.error("社区简介说明保存失败");
    } finally {
      setSavingIntro(false);
    }
  };

  const handleSaveStats = async (values: StatsFormValues) => {
    setSavingStats(true);
    try {
      const currentExtra = parseExtra<CommunityStatsExtra>(statsSection?.extra_json);
      await saveSection(statsSection, {
        page_key: COMMUNITY_PAGE_KEY,
        section_key: STATS_SECTION_KEY,
        title: statsSection?.title || "社区数据",
        subtitle: statsSection?.subtitle || "",
        content: statsSection?.content || "",
        extra_json: JSON.stringify({
          ...currentExtra,
          items: values.items.map((item) => ({
            value: item.value.trim(),
            label: item.label.trim(),
          })),
        }),
        sort_order: statsSection?.sort_order || 3,
        is_published: 1,
      });
      message.success("社区数据已保存");
      setStatsEditing(false);
      await loadSections();
    } catch (error) {
      console.error("Failed to save community stats", error);
      message.error("社区数据保存失败");
    } finally {
      setSavingStats(false);
    }
  };

  const openCreateBaseModal = () => {
    setEditingBase(null);
    baseForm.setFieldsValue({
      title: "",
      address: "",
      phone: "",
      email: "",
      detail_url: "",
      sort_order: (baseSections.length > 0 ? baseSections[baseSections.length - 1].sort_order : 0) + 10,
    });
    setBaseModalOpen(true);
  };

  const openEditBaseModal = (section: PageSection) => {
    const extra = parseExtra<CommunityBaseExtra>(section.extra_json);
    setEditingBase(section);
    baseForm.setFieldsValue({
      title: section.title,
      address: extra.address || "",
      phone: extra.phone || "",
      email: extra.email || "",
      detail_url: extra.detail_url || extra.action_value || "",
      sort_order: section.sort_order,
    });
    setBaseModalOpen(true);
  };

  const closeBaseModal = () => {
    setBaseModalOpen(false);
    setEditingBase(null);
  };

  const handleSaveBase = async (values: BaseFormValues) => {
    setSavingBase(true);
    try {
      const currentExtra = parseExtra<CommunityBaseExtra>(editingBase?.extra_json);
      const detailUrl = values.detail_url?.trim() || "";
      const payload = {
        page_key: COMMUNITY_PAGE_KEY,
        section_key:
          editingBase?.section_key || buildBaseSectionKey(sections.map((item) => item.section_key)),
        title: values.title.trim(),
        subtitle: editingBase?.subtitle || "",
        content: editingBase?.content || "",
        extra_json: JSON.stringify({
          ...currentExtra,
          address: values.address.trim(),
          phone: values.phone.trim(),
          email: values.email.trim(),
          detail_url: detailUrl,
          action_type: resolveActionType(detailUrl),
          action_value: detailUrl,
          button_text: "查看详情",
        }),
        sort_order: values.sort_order,
        is_published: 1,
      };

      if (editingBase) {
        await adminApi.put(`/admin/page-sections/${editingBase.id}`, payload);
        message.success("基地信息已更新");
      } else {
        await adminApi.post("/admin/page-sections", payload);
        message.success("基地信息已新增");
      }

      closeBaseModal();
      await loadSections();
    } catch (error) {
      console.error("Failed to save community base", error);
      message.error("基地信息保存失败");
    } finally {
      setSavingBase(false);
    }
  };

  const handleDeleteBase = async (section: PageSection) => {
    try {
      await adminApi.delete(`/admin/page-sections/${section.id}`);
      message.success("基地信息已删除");
      await loadSections();
    } catch (error) {
      console.error("Failed to delete community base", error);
      message.error("基地信息删除失败");
    }
  };

  const openCreateRequirementModal = () => {
    setEditingRequirementIndex(null);
    requirementForm.setFieldsValue({
      text: "",
      icon: "Sparkles",
    });
    setRequirementModalOpen(true);
  };

  const openEditRequirementModal = (index: number) => {
    const item = requirementItems[index];
    setEditingRequirementIndex(index);
    requirementForm.setFieldsValue({
      text: item?.text || "",
      icon: normalizeCommunityRequirementIcon(item || {}),
    });
    setRequirementModalOpen(true);
  };

  const closeRequirementModal = () => {
    setRequirementModalOpen(false);
    setEditingRequirementIndex(null);
  };

  const persistRequirementItems = async (items: CommunityRequirementItem[], successText: string) => {
    setSavingRequirement(true);
    try {
      const currentExtra = parseExtra<CommunityRequirementsExtra>(requirementSection?.extra_json);
      await saveSection(requirementSection, {
        page_key: COMMUNITY_PAGE_KEY,
        section_key: REQUIREMENTS_SECTION_KEY,
        title: requirementSection?.title || "入驻条件",
        subtitle: requirementSection?.subtitle || "",
        content: requirementSection?.content || "",
        extra_json: JSON.stringify({
          ...currentExtra,
          items,
        }),
        sort_order: requirementSection?.sort_order || 60,
        is_published: 1,
      });
      message.success(successText);
      closeRequirementModal();
      await loadSections();
    } catch (error) {
      console.error("Failed to save requirement items", error);
      message.error("入驻条件保存失败");
    } finally {
      setSavingRequirement(false);
    }
  };

  const handleSaveRequirement = async (values: RequirementFormValues) => {
    const nextItems = [...requirementItems];
    const nextItem = {
      text: values.text.trim(),
      icon: normalizeCommunityRequirementIcon({ text: values.text, icon: values.icon }),
    };

    if (editingRequirementIndex === null) {
      nextItems.push(nextItem);
      await persistRequirementItems(nextItems, "入驻条件已新增");
      return;
    }

    nextItems[editingRequirementIndex] = nextItem;
    await persistRequirementItems(nextItems, "入驻条件已更新");
  };

  const handleDeleteRequirement = async (index: number) => {
    const nextItems = requirementItems.filter((_, itemIndex) => itemIndex !== index);
    await persistRequirementItems(nextItems, "入驻条件已删除");
  };

  const baseColumns: ColumnsType<PageSection> = [
    {
      title: "基地名称",
      dataIndex: "title",
      key: "title",
      width: 220,
    },
    {
      title: "地址",
      key: "address",
      width: 240,
      render: (_, record) => parseExtra<CommunityBaseExtra>(record.extra_json).address || "-",
    },
    {
      title: "电话",
      key: "phone",
      width: 130,
      render: (_, record) => parseExtra<CommunityBaseExtra>(record.extra_json).phone || "-",
    },
    {
      title: "邮箱",
      key: "email",
      width: 220,
      render: (_, record) => parseExtra<CommunityBaseExtra>(record.extra_json).email || "-",
    },
    {
      title: "查看详情",
      key: "detail_url",
      width: 110,
      align: "center",
      render: (_, record) => renderLinkCell(parseExtra<CommunityBaseExtra>(record.extra_json).detail_url || parseExtra<CommunityBaseExtra>(record.extra_json).action_value),
    },
    {
      title: "排序",
      dataIndex: "sort_order",
      key: "sort_order",
      width: 80,
    },
    {
      title: "操作",
      key: "actions",
      width: 140,
      fixed: "right",
      render: (_, record) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => openEditBaseModal(record)} type="link">
            编辑
          </Button>
          <Popconfirm onConfirm={() => void handleDeleteBase(record)} title="确认删除这个基地信息吗？">
            <Button danger icon={<DeleteOutlined />} type="link">
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const requirementColumns: ColumnsType<CommunityRequirementItem> = [
    {
      title: "图标",
      dataIndex: "icon",
      key: "icon",
      width: 90,
      render: (value?: string) => renderIconPreview(value),
    },
    {
      title: "图标名称",
      dataIndex: "icon",
      key: "icon_label",
      width: 220,
      render: (value?: string) =>
        communityRequirementIconOptions.find((item) => item.value === value)?.label || "AI 相关领域开发",
    },
    {
      title: "条件文案",
      dataIndex: "text",
      key: "text",
    },
    {
      title: "操作",
      key: "actions",
      width: 140,
      fixed: "right",
      render: (_, __, index) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => openEditRequirementModal(index)} type="link">
            编辑
          </Button>
          <Popconfirm onConfirm={() => void handleDeleteRequirement(index)} title="确认删除这个入驻条件吗？">
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
      <Card className="admin-page-card" loading={loading}>
        <div className="admin-toolbar" style={{ alignItems: "flex-start", maxWidth: 1200 }}>
          <div>
            <h2 style={{ marginBottom: 8, marginTop: 0 }}>社区简介</h2>
            <p className="admin-muted" style={{ marginBottom: 0 }}>
              按前台页面内容分别维护，默认以展示为主，需要调整时再点击编辑。
            </p>
          </div>
        </div>
      </Card>

      <Card
        className="admin-page-card"
        extra={
          introEditing ? (
            <Space>
              <Button onClick={() => setIntroEditing(false)}>取消</Button>
              <Button icon={<SaveOutlined />} loading={savingIntro} onClick={() => introForm.submit()} type="primary">
                保存社区说明
              </Button>
            </Space>
          ) : (
            <Button icon={<EditOutlined />} onClick={() => setIntroEditing(true)} type="primary">
              编辑
            </Button>
          )
        }
        title="社区说明"
      >
        {introEditing ? (
          <Form form={introForm} layout="vertical" onFinish={handleSaveIntro} requiredMark={false}>
            <Form.Item label="社区名称" name="title" rules={[{ required: true, message: "请输入社区名称" }]}>
              <Input placeholder="例如：厦门OPC社区" />
            </Form.Item>
            <Form.Item
              label="社区说明"
              name="content"
              rules={[{ required: true, message: "请输入社区说明" }]}
            >
              <Input.TextArea placeholder="请输入社区简介说明，换行会自动按段落展示。" rows={8} />
            </Form.Item>
          </Form>
        ) : (
          <div style={{ display: "grid", gap: 20 }}>
            <div>
              <div className="admin-muted" style={{ marginBottom: 8 }}>社区名称</div>
              <div style={{ fontSize: 18, fontWeight: 600 }}>{introSection?.title || "厦门OPC社区"}</div>
            </div>
            <div>
              <div className="admin-muted" style={{ marginBottom: 8 }}>社区说明</div>
              <div
                style={{
                  background: "#fafcff",
                  border: "1px solid #e5edf8",
                  borderRadius: 12,
                  lineHeight: 1.9,
                  padding: 16,
                  whiteSpace: "pre-wrap",
                }}
              >
                {htmlToPlainText(introSection?.content) || "-"}
              </div>
            </div>
          </div>
        )}
      </Card>

      <Card
        className="admin-page-card"
        extra={
          statsEditing ? (
            <Space>
              <Button
                onClick={() => {
                  statsForm.setFieldsValue({ items: statsItems });
                  setStatsEditing(false);
                }}
              >
                取消
              </Button>
              <Button icon={<SaveOutlined />} loading={savingStats} onClick={() => statsForm.submit()} type="primary">
                保存社区数据
              </Button>
            </Space>
          ) : (
            <Button icon={<EditOutlined />} onClick={() => setStatsEditing(true)} type="primary">
              编辑
            </Button>
          )
        }
        title="展示数据"
      >
        {statsEditing ? (
          <Form form={statsForm} layout="vertical" onFinish={handleSaveStats} requiredMark={false}>
            <Form.List name="items">
              {(fields) => (
                <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
                  {fields.map((field, index) => (
                    <Card key={field.key} size="small" title="数据内容">
                      <Form.Item
                        label="数字"
                        name={[field.name, "value"]}
                        rules={[{ required: true, message: "请输入数字" }]}
                      >
                        <Input placeholder="例如：300+" />
                      </Form.Item>
                      <Form.Item
                        label="标题"
                        name={[field.name, "label"]}
                        rules={[{ required: true, message: "请输入标题" }]}
                      >
                        <Input placeholder="例如：入驻团队" />
                      </Form.Item>
                    </Card>
                  ))}
                </div>
              )}
            </Form.List>
          </Form>
        ) : (
          <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(4, minmax(0, 1fr))" }}>
            {statsItems.map((item, index) => (
              <div
                key={`${item.label}-${index}`}
                style={{
                  background: "linear-gradient(180deg,#f8fbff 0%,#eef5ff 100%)",
                  border: "1px solid #dbe7fb",
                  borderRadius: 16,
                  padding: "20px 18px",
                }}
              >
                <div style={{ color: "#1d4ed8", fontSize: 28, fontWeight: 700, marginBottom: 8 }}>{item.value}</div>
                <div style={{ color: "#475569" }}>{item.label}</div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card
        className="admin-page-card"
        extra={
          <Button icon={<PlusOutlined />} onClick={openCreateBaseModal} type="primary">
            新增基地信息
          </Button>
        }
        title="基地信息"
      >
        <Table
          columns={baseColumns}
          dataSource={baseSections}
          pagination={false}
          rowKey="id"
          scroll={{ x: 1280 }}
        />
      </Card>

      <Card
        className="admin-page-card"
        extra={
          <Button icon={<PlusOutlined />} onClick={openCreateRequirementModal} type="primary">
            新增入驻条件
          </Button>
        }
        title="入驻条件"
      >
        <Table
          columns={requirementColumns}
          dataSource={requirementItems.map((item, index) => ({ ...item, key: `${item.text}-${index}` }))}
          pagination={false}
          rowKey="key"
          scroll={{ x: 980 }}
        />
      </Card>

      <Modal
        destroyOnHidden
        onCancel={closeBaseModal}
        onOk={() => baseForm.submit()}
        open={baseModalOpen}
        okButtonProps={{ loading: savingBase }}
        title={editingBase ? "编辑基地信息" : "新增基地信息"}
        width={760}
      >
        <Form form={baseForm} layout="vertical" onFinish={handleSaveBase} requiredMark={false}>
          <Form.Item label="基地名称" name="title" rules={[{ required: true, message: "请输入基地名称" }]}>
            <Input placeholder="例如：厦门OPC社区（软二基地）" />
          </Form.Item>
          <Form.Item label="地址" name="address" rules={[{ required: true, message: "请输入地址" }]}>
            <Input placeholder="请输入地址" />
          </Form.Item>
          <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
            <Form.Item label="电话" name="phone" rules={[{ required: true, message: "请输入电话" }]}>
              <Input placeholder="请输入联系电话" />
            </Form.Item>
            <Form.Item label="邮箱" name="email" rules={[{ required: true, message: "请输入邮箱" }]}>
              <Input placeholder="请输入联系邮箱" />
            </Form.Item>
          </div>
          <Form.Item label="详情链接" name="detail_url">
            <Input placeholder="请输入详情链接" />
          </Form.Item>
          <Form.Item label="排序" name="sort_order" rules={[{ required: true, message: "请输入排序" }]}>
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        destroyOnHidden
        onCancel={closeRequirementModal}
        onOk={() => requirementForm.submit()}
        open={requirementModalOpen}
        okButtonProps={{ loading: savingRequirement }}
        title={editingRequirementIndex === null ? "新增入驻条件" : "编辑入驻条件"}
        width={640}
      >
        <Form form={requirementForm} layout="vertical" onFinish={handleSaveRequirement} requiredMark={false}>
          <Form.Item label="图标" name="icon" rules={[{ required: true, message: "请选择图标" }]}>
            <Select
              optionFilterProp="label"
              options={communityRequirementIconOptions}
              optionRender={(option) => {
                const data = option.data as { label: string; value: string };
                return (
                  <div style={{ alignItems: "center", display: "flex", gap: 10 }}>
                    {renderIconPreview(data.value)}
                    <span>{data.label}</span>
                  </div>
                );
              }}
              placeholder="请选择图标"
              showSearch
            />
          </Form.Item>
          <Form.Item label="条件文案" name="text" rules={[{ required: true, message: "请输入条件文案" }]}>
            <Input placeholder="请输入条件文案" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
