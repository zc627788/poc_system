import { DeleteOutlined, EditOutlined, LinkOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, Card, Form, Input, InputNumber, Modal, Popconfirm, Select, Space, Switch, Table, Tag, Tooltip, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useState } from "react";
import { adminApi } from "../api";
import { financingCardIconOptions, FrontendContentIconPreview } from "../components/FrontendIconPreview";
import type { ApiResponse, PageSection } from "../types";

type FinancingCardItem = {
  icon?: string;
  title: string;
  desc: string;
  action_type?: string;
  action_value?: string;
  button_text?: string;
  sort_order?: number;
  is_published?: number;
};

type FinancingCardFormValues = {
  icon: string;
  title: string;
  desc: string;
  action_value: string;
  button_text: string;
  sort_order: number;
  is_published: boolean;
};

const FINANCING_PAGE_KEY = "financing";
const CARDS_SECTION_KEY = "fund_cards";

const defaultCardValues: FinancingCardFormValues = {
  icon: "Coins",
  title: "",
  desc: "",
  action_value: "",
  button_text: "立即申请",
  sort_order: 0,
  is_published: true,
};

function parseExtra<T>(extraJson?: string | null, fallback?: T): T {
  if (!extraJson) {
    return fallback as T;
  }

  try {
    return JSON.parse(extraJson) as T;
  } catch {
    return fallback as T;
  }
}

function normalizeCards(items?: FinancingCardItem[]) {
  return [...(items || [])]
    .map((item, index) => ({
      icon: item.icon || "Coins",
      title: item.title || "",
      desc: item.desc || "",
      action_type: item.action_type || "internal",
      action_value: item.action_value || "",
      button_text: item.button_text || "立即申请",
      sort_order: item.sort_order ?? index + 1,
      is_published: item.is_published ?? 1,
    }))
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
}

function resolveActionType(url?: string) {
  if (!url) {
    return "internal";
  }
  return /^https?:\/\//i.test(url) ? "external" : "internal";
}

function renderIconPreview(icon?: string) {
  return <FrontendContentIconPreview color="#ffffff" name={icon || "Coins"} shadow="0 8px 18px rgba(15,103,231,0.18)" strokeWidth={2.1} wrapperSize={32} />;
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
        <LinkOutlined />
      </a>
    </Tooltip>
  );
}

export function FinancingContentPage() {
  const [cardForm] = Form.useForm<FinancingCardFormValues>();

  const [cardsSection, setCardsSection] = useState<PageSection | null>(null);
  const [cards, setCards] = useState<FinancingCardItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [cardModalOpen, setCardModalOpen] = useState(false);
  const [editingCardIndex, setEditingCardIndex] = useState<number | null>(null);

  const loadSections = async () => {
    setLoading(true);
    try {
      const response = await adminApi.get<ApiResponse<PageSection[]>>("/admin/page-sections", {
        params: { page_key: FINANCING_PAGE_KEY },
      });
      const nextSections = response.data.data;
      const nextCardsSection = nextSections.find((item) => item.section_key === CARDS_SECTION_KEY) || null;
      setCardsSection(nextCardsSection);
      const fundCards = parseExtra<{ items?: FinancingCardItem[] }>(nextCardsSection?.extra_json, {});
      setCards(normalizeCards(fundCards.items));
    } catch (error) {
      console.error("Failed to load financing content", error);
      message.error("融资对接内容加载失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadSections();
  }, []);

  const persistCards = async (nextCards: FinancingCardItem[], successText: string) => {
    setSaving(true);
    try {
      const payload = {
        page_key: FINANCING_PAGE_KEY,
        section_key: CARDS_SECTION_KEY,
        title: cardsSection?.title || "融资卡片",
        subtitle: cardsSection?.subtitle || "",
        content: "",
        extra_json: JSON.stringify({
          items: normalizeCards(nextCards).map((item) => ({
            icon: item.icon,
            title: item.title,
            desc: item.desc,
            action_type: resolveActionType(item.action_value),
            action_value: item.action_value,
            button_text: item.button_text || "立即申请",
            sort_order: item.sort_order,
            is_published: item.is_published ?? 1,
          })),
        }),
        sort_order: cardsSection?.sort_order ?? 3,
        is_published: cardsSection?.is_published ?? 1,
      };

      if (cardsSection) {
        await adminApi.put(`/admin/page-sections/${cardsSection.id}`, payload);
      } else {
        await adminApi.post("/admin/page-sections", payload);
      }

      message.success(successText);
      await loadSections();
    } catch (error) {
      console.error("Failed to save financing cards", error);
      message.error("融资卡片保存失败");
    } finally {
      setSaving(false);
    }
  };

  const openCreateCard = () => {
    setEditingCardIndex(null);
    cardForm.setFieldsValue({
      ...defaultCardValues,
      sort_order: cards.length > 0 ? (cards[cards.length - 1].sort_order ?? cards.length) + 1 : 1,
    });
    setCardModalOpen(true);
  };

  const openEditCard = (item: FinancingCardItem, index: number) => {
    setEditingCardIndex(index);
    cardForm.setFieldsValue({
      icon: item.icon || "Coins",
      title: item.title,
      desc: item.desc,
      action_value: item.action_value || "",
      button_text: item.button_text || "立即申请",
      sort_order: item.sort_order ?? index + 1,
      is_published: item.is_published !== 0,
    });
    setCardModalOpen(true);
  };

  const handleSubmitCard = async (values: FinancingCardFormValues) => {
    const nextItem: FinancingCardItem = {
      icon: values.icon,
      title: values.title.trim(),
      desc: values.desc.trim(),
      action_type: resolveActionType(values.action_value.trim()),
      action_value: values.action_value.trim(),
      button_text: values.button_text.trim() || "立即申请",
      sort_order: values.sort_order,
      is_published: values.is_published ? 1 : 0,
    };

    const nextCards =
      editingCardIndex === null
        ? normalizeCards([...cards, nextItem])
        : normalizeCards(cards.map((item, index) => (index === editingCardIndex ? nextItem : item)));

    setCards(nextCards);
    setCardModalOpen(false);
    await persistCards(nextCards, editingCardIndex === null ? "融资服务已新增" : "融资服务已更新");
  };

  const handleDeleteCard = async (index: number) => {
    const nextCards = cards.filter((_, cardIndex) => cardIndex !== index);
    setCards(nextCards);
    await persistCards(nextCards, "融资服务已删除");
  };

  const cardColumns: ColumnsType<FinancingCardItem> = [
    {
      title: "图标",
      dataIndex: "icon",
      key: "icon",
      width: 76,
      render: (value?: string) => renderIconPreview(value),
    },
    {
      title: "标题",
      dataIndex: "title",
      key: "title",
      width: 180,
      ellipsis: true,
    },
    {
      title: "描述",
      dataIndex: "desc",
      key: "desc",
      width: 300,
      ellipsis: true,
    },
    {
      title: "按钮文案",
      dataIndex: "button_text",
      key: "button_text",
      width: 96,
      ellipsis: true,
    },
    {
      title: "跳转链接",
      key: "action_value",
      width: 90,
      align: "center",
      render: (_, record) => renderLinkCell(record.action_value),
    },
    {
      title: "排序",
      dataIndex: "sort_order",
      key: "sort_order",
      width: 70,
    },
    {
      title: "状态",
      dataIndex: "is_published",
      key: "is_published",
      width: 84,
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
            <Button icon={<EditOutlined />} onClick={() => openEditCard(record, index)} type="link" />
          </Tooltip>
          <Popconfirm onConfirm={() => void handleDeleteCard(index)} title="确认删除这条融资服务吗？">
            <Tooltip title="删除">
              <Button danger icon={<DeleteOutlined />} type="link" />
            </Tooltip>
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
            <h2 style={{ marginBottom: 8, marginTop: 0 }}>融资对接页面内容</h2>
            <p className="admin-muted" style={{ marginBottom: 0 }}>
              维护融资服务卡片，卡片内容会直接对应前台页面展示。
            </p>
          </div>
          <Button icon={<PlusOutlined />} onClick={openCreateCard} type="primary">
            新增融资服务
          </Button>
        </div>
      </Card>

      <Card className="admin-page-card" title="融资服务卡片">
        <Table columns={cardColumns} dataSource={cards} pagination={false} rowKey={(record, index) => `${record.title}-${index}`} scroll={{ x: 1080 }} />
      </Card>

      <Modal
        destroyOnHidden
        onCancel={() => setCardModalOpen(false)}
        confirmLoading={saving}
        onOk={() => cardForm.submit()}
        open={cardModalOpen}
        title={editingCardIndex === null ? "新增融资服务" : "编辑融资服务"}
        width={760}
      >
        <Form form={cardForm} layout="vertical" onFinish={handleSubmitCard} requiredMark={false}>
          <Form.Item label="图标" name="icon" rules={[{ required: true, message: "请选择图标" }]}>
            <Select
              optionFilterProp="label"
              options={financingCardIconOptions}
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
          <Form.Item label="标题" name="title" rules={[{ required: true, message: "请输入标题" }]}>
            <Input placeholder="请输入标题" />
          </Form.Item>
          <Form.Item label="描述" name="desc" rules={[{ required: true, message: "请输入描述" }]}>
            <Input.TextArea placeholder="请输入描述" rows={4} />
          </Form.Item>
          <Form.Item label="按钮文案" name="button_text">
            <Input placeholder="例如：立即申请" />
          </Form.Item>
          <Form.Item label="跳转链接" name="action_value" rules={[{ required: true, message: "请输入跳转链接" }]}>
            <Input placeholder="请输入跳转链接" />
          </Form.Item>
          <Form.Item label="排序" name="sort_order" rules={[{ required: true, message: "请输入排序" }]}>
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item label="发布状态" name="is_published" valuePropName="checked">
            <Switch checkedChildren="已发布" unCheckedChildren="草稿" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
