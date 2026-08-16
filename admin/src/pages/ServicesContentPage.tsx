import { DeleteOutlined, EditOutlined, PlusOutlined, SaveOutlined } from "@ant-design/icons";
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
  FrontendContentIconPreview,
  resolveSupportCardIconName,
  serviceSupportIconOptions,
} from "../components/FrontendIconPreview";
import type { ApiResponse, PageSection } from "../types";

type PolicyItem = {
  title: string;
  desc: string;
  tags: string[];
  button_text?: string;
  action_value?: string;
  sort_order?: number;
  is_published?: number;
};

type SupportItem = {
  icon?: string;
  title: string;
  desc: string;
  button_text?: string;
  action_value?: string;
  sort_order?: number;
  is_published?: number;
};

type PolicyFormValues = {
  title: string;
  desc: string;
  tags: string[];
  button_text: string;
  action_value?: string;
  sort_order: number;
  is_published: number;
};

type SupportFormValues = {
  icon: string;
  title: string;
  desc: string;
};

type HeroFormValues = {
  title: string;
  subtitle: string;
};

type TagGroup = "type" | "stage";

type TagRecord = {
  group: TagGroup;
  name: string;
  index: number;
};

type SupportCardRecord = SupportItem & {
  key: string;
  locked_action_value: string;
};

const iconOptions = serviceSupportIconOptions;

const defaultPolicyValues: PolicyFormValues = {
  title: "",
  desc: "",
  tags: [],
  button_text: "查看详情",
  action_value: "",
  sort_order: 0,
  is_published: 1,
};

function parseExtra<T>(value?: string | null, fallback?: T): T {
  if (!value) {
    return fallback as T;
  }
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback as T;
  }
}

function normalizeItemOrder<T extends { sort_order?: number }>(items: T[]) {
  return [...items].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
}

function normalizePolicyItem(item: PolicyItem, index: number): PolicyItem {
  return {
    title: item.title || "",
    desc: item.desc || "",
    tags: Array.isArray(item.tags) ? item.tags : [],
    button_text: item.button_text || "查看详情",
    action_value: item.action_value || "",
    sort_order: item.sort_order ?? index + 1,
    is_published: item.is_published ?? 1,
  };
}

function normalizeSupportItem(item: SupportItem, index: number): SupportCardRecord {
  const normalizedAction = item.action_value || "";
  return {
    icon: item.icon || "",
    title: item.title || "",
    desc: item.desc || "",
    button_text: item.button_text || "查看详情",
    action_value: normalizedAction,
    locked_action_value: normalizedAction,
    sort_order: item.sort_order ?? index + 1,
    is_published: item.is_published ?? 1,
    key: `${normalizedAction || item.title || "support"}-${index}`,
  };
}

function renderServiceIconPreview(icon?: string, compact = false) {
  const normalized = icon || "Briefcase";
  const isSquare = normalized === "FileCheck";
  const wrapperSize = compact ? 34 : 42;
  const iconSize = compact ? 17 : 21;

  return (
    <span
      style={{
        alignItems: "center",
        background: "#eef4ff",
        borderRadius: isSquare ? 12 : 999,
        color: "#0052d9",
        display: "inline-flex",
        height: wrapperSize,
        justifyContent: "center",
        width: wrapperSize,
      }}
    >
      <FrontendContentIconPreview
        background="transparent"
        borderRadius={isSquare ? 12 : 999}
        color="#0052d9"
        name={normalized}
        shadow="none"
        size={iconSize}
        strokeWidth={1.9}
        wrapperSize={iconSize}
      />
    </span>
  );
}

function renderIconPreview(icon?: string) {
  return renderServiceIconPreview(icon);
}

function renderUrlText(url?: string) {
  if (!url) {
    return "-";
  }
  if (url === "/setup") {
    return "OPC工商注册";
  }
  if (url === "/settlement") {
    return "安居落户";
  }
  if (url === "/financing") {
    return "融资对接";
  }
  return url;
}

export function ServicesContentPage() {
  const [heroForm] = Form.useForm<HeroFormValues>();
  const [policyForm] = Form.useForm<PolicyFormValues>();
  const [supportForm] = Form.useForm<SupportFormValues>();

  const [sections, setSections] = useState<PageSection[]>([]);
  const [typeOptions, setTypeOptions] = useState<string[]>([]);
  const [stageOptions, setStageOptions] = useState<string[]>([]);
  const [policyItems, setPolicyItems] = useState<PolicyItem[]>([]);
  const [supportItems, setSupportItems] = useState<SupportCardRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [heroEditing, setHeroEditing] = useState(false);
  const [tagModalOpen, setTagModalOpen] = useState(false);
  const [tagGroup, setTagGroup] = useState<TagGroup>("type");
  const [tagValue, setTagValue] = useState("");
  const [editingTag, setEditingTag] = useState<TagRecord | null>(null);
  const [policyModalOpen, setPolicyModalOpen] = useState(false);
  const [editingPolicyIndex, setEditingPolicyIndex] = useState<number | null>(null);
  const [supportModalOpen, setSupportModalOpen] = useState(false);
  const [editingSupportIndex, setEditingSupportIndex] = useState<number | null>(null);

  const tagOptions = useMemo(
    () => [...typeOptions, ...stageOptions].map((value) => ({ label: value, value })),
    [stageOptions, typeOptions]
  );

  const tagRecords = useMemo<TagRecord[]>(
    () => [
      ...typeOptions.map((name, index) => ({ group: "type" as const, name, index })),
      ...stageOptions.map((name, index) => ({ group: "stage" as const, name, index })),
    ],
    [stageOptions, typeOptions]
  );

  const sectionByKey = useMemo(() => {
    return Object.fromEntries(sections.map((item) => [item.section_key, item])) as Record<string, PageSection | undefined>;
  }, [sections]);

  const loadSections = async () => {
    setLoading(true);
    try {
      const response = await adminApi.get<ApiResponse<PageSection[]>>("/admin/page-sections", {
        params: { page_key: "services" },
      });
      const nextSections = response.data.data;
      setSections(nextSections);

      const hero = nextSections.find((item) => item.section_key === "hero");
      heroForm.setFieldsValue({
        title: hero?.title || "厦门OPC专属创业政策服务",
        subtitle: hero?.subtitle || "个性化、精准化匹配",
      });

      const filters = parseExtra<{ type_options?: string[]; stage_options?: string[] }>(
        nextSections.find((item) => item.section_key === "policy_filters")?.extra_json,
        {}
      );
      setTypeOptions(filters.type_options || []);
      setStageOptions(filters.stage_options || []);

      const policies = parseExtra<{ items?: PolicyItem[] }>(
        nextSections.find((item) => item.section_key === "policy_cards")?.extra_json,
        {}
      );
      setPolicyItems(normalizeItemOrder((policies.items || []).map(normalizePolicyItem)));

      const supports = parseExtra<{ items?: SupportItem[] }>(
        nextSections.find((item) => item.section_key === "support_cards")?.extra_json,
        {}
      );
      setSupportItems(normalizeItemOrder((supports.items || []).map(normalizeSupportItem)));
    } catch (error) {
      console.error("Failed to load services content", error);
      message.error("创业服务内容加载失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadSections();
  }, []);

  const saveSection = async (
    sectionKey: string,
    payload: Pick<PageSection, "title" | "subtitle" | "content" | "extra_json" | "sort_order" | "is_published">
  ) => {
    const existing = sectionByKey[sectionKey];
    const body = {
      page_key: "services",
      section_key: sectionKey,
      ...payload,
    };
    if (existing) {
      await adminApi.put(`/admin/page-sections/${existing.id}`, body);
      return;
    }
    await adminApi.post("/admin/page-sections", body);
  };

  const persistServicesContent = async ({
    nextTypeOptions = typeOptions,
    nextStageOptions = stageOptions,
    nextPolicyItems = policyItems,
    nextSupportItems = supportItems,
    successText = "保存成功",
    includeHero = false,
  }: {
    nextTypeOptions?: string[];
    nextStageOptions?: string[];
    nextPolicyItems?: PolicyItem[];
    nextSupportItems?: SupportCardRecord[];
    successText?: string;
    includeHero?: boolean;
  } = {}) => {
    setSaving(true);
    try {
      if (includeHero) {
        const hero = heroForm.getFieldsValue();
        await saveSection("hero", {
          title: hero.title || "厦门OPC专属创业政策服务",
          subtitle: hero.subtitle || "",
          content: sectionByKey.hero?.content || "",
          extra_json: sectionByKey.hero?.extra_json || null,
          sort_order: sectionByKey.hero?.sort_order ?? 1,
          is_published: sectionByKey.hero?.is_published ?? 1,
        });
      }

      await saveSection("policy_filters", {
        title: sectionByKey.policy_filters?.title || "政策匹配",
        subtitle: sectionByKey.policy_filters?.subtitle || "",
        content: "",
        extra_json: JSON.stringify({
          type_options: nextTypeOptions,
          stage_options: nextStageOptions,
          default_types: [],
          default_stages: [],
        }),
        sort_order: sectionByKey.policy_filters?.sort_order ?? 2,
        is_published: sectionByKey.policy_filters?.is_published ?? 1,
      });
      await saveSection("policy_cards", {
        title: sectionByKey.policy_cards?.title || "政策列表",
        subtitle: sectionByKey.policy_cards?.subtitle || "",
        content: "",
        extra_json: JSON.stringify({ items: normalizeItemOrder(nextPolicyItems) }),
        sort_order: sectionByKey.policy_cards?.sort_order ?? 100,
        is_published: sectionByKey.policy_cards?.is_published ?? 1,
      });
      await saveSection("support_cards", {
        title: sectionByKey.support_cards?.title || "创业配套服务",
        subtitle: sectionByKey.support_cards?.subtitle || "",
        content: "",
        extra_json: JSON.stringify({
          items: normalizeItemOrder(
            nextSupportItems.map((item) => ({
              icon: item.icon,
              title: item.title,
              desc: item.desc,
              button_text: item.button_text || "查看详情",
              action_type: "internal",
              action_value: item.locked_action_value,
              sort_order: item.sort_order,
              is_published: item.is_published,
            }))
          ),
        }),
        sort_order: sectionByKey.support_cards?.sort_order ?? 4,
        is_published: sectionByKey.support_cards?.is_published ?? 1,
      });
      message.success(successText);
      await loadSections();
    } catch (error) {
      console.error("Failed to save services content", error);
      message.error("保存失败");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveHero = async () => {
    await persistServicesContent({ includeHero: true, successText: "页面标题已保存" });
    setHeroEditing(false);
  };

  const openCreateTag = (group: TagGroup) => {
    setEditingTag(null);
    setTagGroup(group);
    setTagValue("");
    setTagModalOpen(true);
  };

  const openEditTag = (record: TagRecord) => {
    setEditingTag(record);
    setTagGroup(record.group);
    setTagValue(record.name);
    setTagModalOpen(true);
  };

  const applyTagChange = async () => {
    const nextValue = tagValue.trim();
    if (!nextValue) {
      message.warning("请输入标签名称");
      return;
    }
    const allTags = [...typeOptions, ...stageOptions];
    if (allTags.includes(nextValue) && nextValue !== editingTag?.name) {
      message.warning("标签名称不能重复");
      return;
    }

    const updateGroup = (items: string[]) => {
      if (!editingTag) {
        return [...items, nextValue];
      }
      return items.map((item, index) => (index === editingTag.index ? nextValue : item));
    };

    const nextTypeOptions = tagGroup === "type" ? updateGroup(typeOptions) : typeOptions;
    const nextStageOptions = tagGroup === "stage" ? updateGroup(stageOptions) : stageOptions;
    let nextPolicyItems = policyItems;

    if (editingTag && editingTag.name !== nextValue) {
      nextPolicyItems = policyItems.map((item) => ({
        ...item,
        tags: item.tags.map((tag) => (tag === editingTag.name ? nextValue : tag)),
      }));
    }

    setTypeOptions(nextTypeOptions);
    setStageOptions(nextStageOptions);
    setPolicyItems(nextPolicyItems);
    setTagModalOpen(false);
    await persistServicesContent({ nextTypeOptions, nextStageOptions, nextPolicyItems, successText: "标签已保存" });
  };

  const deleteTag = async (record: TagRecord) => {
    const nextTypeOptions = record.group === "type" ? typeOptions.filter((_, index) => index !== record.index) : typeOptions;
    const nextStageOptions = record.group === "stage" ? stageOptions.filter((_, index) => index !== record.index) : stageOptions;
    const nextPolicyItems = policyItems.map((item) => ({ ...item, tags: item.tags.filter((tag) => tag !== record.name) }));
    setTypeOptions(nextTypeOptions);
    setStageOptions(nextStageOptions);
    setPolicyItems(nextPolicyItems);
    await persistServicesContent({ nextTypeOptions, nextStageOptions, nextPolicyItems, successText: "标签已删除" });
  };

  const openCreatePolicy = () => {
    setEditingPolicyIndex(null);
    policyForm.setFieldsValue(defaultPolicyValues);
    setPolicyModalOpen(true);
  };

  const openEditPolicy = (item: PolicyItem, index: number) => {
    setEditingPolicyIndex(index);
    policyForm.setFieldsValue({ ...defaultPolicyValues, ...item });
    setPolicyModalOpen(true);
  };

  const submitPolicy = async (values: PolicyFormValues) => {
    const nextItem = normalizePolicyItem(values, policyItems.length);
    const nextPolicyItems =
      editingPolicyIndex === null
        ? normalizeItemOrder([...policyItems, nextItem])
        : normalizeItemOrder(policyItems.map((item, index) => (index === editingPolicyIndex ? nextItem : item)));
    setPolicyItems(nextPolicyItems);
    setPolicyModalOpen(false);
    await persistServicesContent({ nextPolicyItems, successText: editingPolicyIndex === null ? "政策已新增" : "政策已更新" });
  };

  const deletePolicy = async (index: number) => {
    const nextPolicyItems = policyItems.filter((_, itemIndex) => itemIndex !== index);
    setPolicyItems(nextPolicyItems);
    await persistServicesContent({ nextPolicyItems, successText: "政策已删除" });
  };

  const openEditSupport = (item: SupportCardRecord, index: number) => {
    setEditingSupportIndex(index);
    supportForm.setFieldsValue({
      icon: resolveSupportCardIconName(item),
      title: item.title,
      desc: item.desc,
    });
    setSupportModalOpen(true);
  };

  const submitSupport = async (values: SupportFormValues) => {
    if (editingSupportIndex === null) {
      return;
    }
    const nextSupportItems = normalizeItemOrder(
      supportItems.map((item, index) =>
        index === editingSupportIndex
          ? {
              ...item,
              icon: values.icon,
              title: values.title,
              desc: values.desc,
            }
          : item
      )
    );
    setSupportItems(nextSupportItems);
    setSupportModalOpen(false);
    await persistServicesContent({ nextSupportItems, successText: "配套服务已更新" });
  };

  const tagColumns: ColumnsType<TagRecord> = [
    {
      title: "类型",
      dataIndex: "group",
      key: "group",
      width: 160,
      render: (value: TagGroup) => (value === "type" ? "创业者类型" : "创业方向/阶段"),
    },
    { title: "标签名称", dataIndex: "name", key: "name" },
    {
      title: "操作",
      key: "actions",
      width: 180,
      fixed: "right",
      render: (_, record) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => openEditTag(record)} type="link">
            编辑
          </Button>
          <Popconfirm onConfirm={() => void deleteTag(record)} title="确认删除这个标签吗？">
            <Button danger icon={<DeleteOutlined />} type="link">
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const policyColumns: ColumnsType<PolicyItem> = [
    { title: "标题", dataIndex: "title", key: "title", width: 180 },
    { title: "描述", dataIndex: "desc", key: "desc", width: 280, ellipsis: true },
    {
      title: "标签",
      dataIndex: "tags",
      key: "tags",
      width: 260,
      render: (tags: string[]) => (
        <Space wrap>
          {(tags || []).map((tag) => (
            <Tag key={tag}>{tag}</Tag>
          ))}
        </Space>
      ),
    },
    { title: "查看详情链接", dataIndex: "action_value", key: "action_value", width: 140, ellipsis: true },
    { title: "排序", dataIndex: "sort_order", key: "sort_order", width: 80 },
    {
      title: "状态",
      dataIndex: "is_published",
      key: "is_published",
      width: 90,
      render: (value?: number) => (value === 0 ? <Tag>草稿</Tag> : <Tag color="success">已发布</Tag>),
    },
    {
      title: "操作",
      key: "actions",
      width: 96,
      fixed: "right",
      render: (_, record, index) => (
        <Space size={4}>
          <Tooltip title="编辑">
            <Button icon={<EditOutlined />} onClick={() => openEditPolicy(record, index)} type="link" />
          </Tooltip>
          <Popconfirm onConfirm={() => void deletePolicy(index)} title="确认删除这条政策吗？">
            <Tooltip title="删除">
              <Button danger icon={<DeleteOutlined />} type="link" />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const supportColumns: ColumnsType<SupportCardRecord> = [
    {
      title: "图标",
      dataIndex: "icon",
      key: "icon",
      width: 76,
      render: (_, record) => renderIconPreview(resolveSupportCardIconName(record)),
    },
    { title: "标题", dataIndex: "title", key: "title", width: 160, ellipsis: true },
    { title: "描述", dataIndex: "desc", key: "desc", width: 320, ellipsis: true },
    {
      title: "对应页面",
      key: "locked_action_value",
      width: 110,
      ellipsis: true,
      render: (_, record) => renderUrlText(record.locked_action_value),
    },
    {
      title: "操作",
      key: "actions",
      width: 72,
      fixed: "right",
      render: (_, record, index) => (
        <Tooltip title="编辑">
          <Button icon={<EditOutlined />} onClick={() => openEditSupport(record, index)} type="link" />
        </Tooltip>
      ),
    },
  ];

  return (
    <div className="admin-page">
      <Card className="admin-page-card">
        <div className="admin-toolbar">
          <div>
            <h2 style={{ marginTop: 0, marginBottom: 8 }}>创业服务页</h2>
            <p className="admin-muted" style={{ marginBottom: 0 }}>
              维护创业服务页的标题、政策匹配标签、政策列表和创业配套服务。
            </p>
          </div>
        </div>
      </Card>

      <Card
        className="admin-page-card"
        extra={
          heroEditing ? (
            <Space>
              <Button
                onClick={() => {
                  heroForm.setFieldsValue({
                    title: sectionByKey.hero?.title || "厦门OPC专属创业政策服务",
                    subtitle: sectionByKey.hero?.subtitle || "个性化、精准化匹配",
                  });
                  setHeroEditing(false);
                }}
              >
                取消
              </Button>
              <Button icon={<SaveOutlined />} loading={saving} onClick={() => void handleSaveHero()} type="primary">
                保存
              </Button>
            </Space>
          ) : (
            <Button icon={<EditOutlined />} onClick={() => setHeroEditing(true)} type="primary">
              编辑
            </Button>
          )
        }
        loading={loading}
        title="页面标题"
      >
        {heroEditing ? (
          <Form form={heroForm} layout="vertical" requiredMark={false}>
            <Form.Item label="页面标题" name="title" rules={[{ required: true, message: "请输入页面标题" }]}>
              <Input placeholder="例如：厦门OPC专属创业政策服务" />
            </Form.Item>
            <Form.Item label="页面副标题" name="subtitle">
              <Input placeholder="例如：个性化、精准化匹配" />
            </Form.Item>
          </Form>
        ) : (
          <div style={{ display: "grid", gap: 20 }}>
            <div>
              <div className="admin-muted" style={{ marginBottom: 8 }}>页面标题</div>
              <div style={{ fontSize: 24, fontWeight: 700 }}>{sectionByKey.hero?.title || "厦门OPC专属创业政策服务"}</div>
            </div>
            <div>
              <div className="admin-muted" style={{ marginBottom: 8 }}>页面副标题</div>
              <div style={{ color: "#475569", fontSize: 16 }}>{sectionByKey.hero?.subtitle || "个性化、精准化匹配"}</div>
            </div>
          </div>
        )}
      </Card>

      <Card className="admin-page-card" title="政策匹配标签">
        <Space style={{ marginBottom: 16 }}>
          <Button icon={<PlusOutlined />} onClick={() => openCreateTag("type")} type="primary">
            新增创业者类型
          </Button>
          <Button icon={<PlusOutlined />} onClick={() => openCreateTag("stage")}>
            新增方向/阶段
          </Button>
        </Space>
        <Table columns={tagColumns} dataSource={tagRecords} pagination={false} rowKey={(record) => `${record.group}-${record.name}-${record.index}`} scroll={{ x: 760 }} />
      </Card>

      <Card
        className="admin-page-card"
        extra={
          <Button icon={<PlusOutlined />} onClick={openCreatePolicy} type="primary">
            新增政策
          </Button>
        }
        title="政策列表"
      >
        <Table columns={policyColumns} dataSource={policyItems} pagination={false} rowKey={(record, index) => `${record.title}-${index}`} scroll={{ x: 1040 }} />
      </Card>

      <Card className="admin-page-card" title="创业配套服务">
        <Table columns={supportColumns} dataSource={supportItems} pagination={false} rowKey="key" scroll={{ x: 900 }} />
      </Card>

      <Modal
        destroyOnHidden
        onCancel={() => setTagModalOpen(false)}
        onOk={() => void applyTagChange()}
        open={tagModalOpen}
        title={editingTag ? "编辑政策标签" : "新增政策标签"}
      >
        <Form layout="vertical" requiredMark={false}>
          <Form.Item label="标签分组">
            <Select
              disabled={Boolean(editingTag)}
              onChange={setTagGroup}
              options={[
                { label: "创业者类型", value: "type" },
                { label: "创业方向/阶段", value: "stage" },
              ]}
              value={tagGroup}
            />
          </Form.Item>
          <Form.Item label="标签名称" required>
            <Input onChange={(event) => setTagValue(event.target.value)} placeholder="例如：应届毕业生" value={tagValue} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        destroyOnHidden
        onCancel={() => setPolicyModalOpen(false)}
        confirmLoading={saving}
        onOk={() => policyForm.submit()}
        open={policyModalOpen}
        title={editingPolicyIndex === null ? "新增政策" : "编辑政策"}
        width={760}
      >
        <Form form={policyForm} layout="vertical" onFinish={submitPolicy} requiredMark={false}>
          <Form.Item label="标题" name="title" rules={[{ required: true, message: "请输入标题" }]}>
            <Input placeholder="例如：高校毕业生见习补贴" />
          </Form.Item>
          <Form.Item label="描述" name="desc" rules={[{ required: true, message: "请输入描述" }]}>
            <Input.TextArea placeholder="请输入政策描述" rows={3} />
          </Form.Item>
          <Form.Item label="匹配标签" name="tags">
            <Select mode="multiple" options={tagOptions} placeholder="请选择创业者类型、创业方向或阶段标签" />
          </Form.Item>
          <Form.Item label="按钮文案" name="button_text">
            <Input placeholder="查看详情" />
          </Form.Item>
          <Form.Item label="查看详情链接" name="action_value">
            <Input placeholder="请输入查看详情链接" />
          </Form.Item>
          <Form.Item label="排序" name="sort_order">
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item label="发布状态" name="is_published">
            <Select
              options={[
                { label: "已发布", value: 1 },
                { label: "草稿", value: 0 },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        destroyOnHidden
        onCancel={() => setSupportModalOpen(false)}
        confirmLoading={saving}
        onOk={() => supportForm.submit()}
        open={supportModalOpen}
        title="编辑创业配套服务"
        width={700}
      >
        <Form form={supportForm} layout="vertical" onFinish={submitSupport} requiredMark={false}>
          <Form.Item label="图标" name="icon">
            <Select
              options={iconOptions}
              optionRender={(option) => {
                const data = option.data as { label: string; value: string };
                return (
                  <div style={{ alignItems: "center", display: "flex", gap: 10 }}>
                    {renderServiceIconPreview(data.value, true)}
                    <span>{data.label}</span>
                  </div>
                );
              }}
              placeholder="请选择图标"
            />
          </Form.Item>
          <Form.Item label="标题" name="title" rules={[{ required: true, message: "请输入标题" }]}>
            <Input placeholder="请输入标题" />
          </Form.Item>
          <Form.Item label="描述" name="desc" rules={[{ required: true, message: "请输入描述" }]}>
            <Input.TextArea placeholder="请输入描述" rows={4} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
