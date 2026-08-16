import { DeleteOutlined, EditOutlined, LinkOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, Card, Form, Input, InputNumber, Modal, Popconfirm, Select, Space, Switch, Table, Tag, Tooltip, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useState } from "react";
import { adminApi } from "../api";
import { FrontendContentIconPreview, settlementCardIconOptions } from "../components/FrontendIconPreview";
import type { ApiResponse, PageSection } from "../types";

type SettlementCardItem = {
  icon?: string;
  title: string;
  desc: string;
  action_type?: string;
  action_value?: string;
  sort_order?: number;
  is_published?: number;
};

type SettlementCardFormValues = {
  icon: string;
  title: string;
  desc: string;
  action_value: string;
  sort_order: number;
  is_published: boolean;
};

const SETTLEMENT_PAGE_KEY = "settlement";
const CARDS_SECTION_KEY = "housing_cards";

const defaultCardValues: SettlementCardFormValues = {
  icon: "Home",
  title: "",
  desc: "",
  action_value: "",
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

function normalizeCards(items?: SettlementCardItem[]) {
  return [...(items || [])]
    .map((item, index) => ({
      icon: item.icon || "Home",
      title: item.title || "",
      desc: item.desc || "",
      action_type: item.action_type || "internal",
      action_value: item.action_value || "",
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
  return <FrontendContentIconPreview color="#ffffff" name={icon || "Home"} shadow="0 8px 18px rgba(15,103,231,0.18)" strokeWidth={2.1} wrapperSize={32} />;
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

export function SettlementContentPage() {
  const [cardForm] = Form.useForm<SettlementCardFormValues>();

  const [cardsSection, setCardsSection] = useState<PageSection | null>(null);
  const [cards, setCards] = useState<SettlementCardItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [cardModalOpen, setCardModalOpen] = useState(false);
  const [editingCardIndex, setEditingCardIndex] = useState<number | null>(null);

  const loadSections = async () => {
    setLoading(true);
    try {
      const response = await adminApi.get<ApiResponse<PageSection[]>>("/admin/page-sections", {
        params: { page_key: SETTLEMENT_PAGE_KEY },
      });
      const nextSections = response.data.data;
      const nextCardsSection = nextSections.find((item) => item.section_key === CARDS_SECTION_KEY) || null;
      setCardsSection(nextCardsSection);
      const housingCards = parseExtra<{ items?: SettlementCardItem[] }>(nextCardsSection?.extra_json, {});
      setCards(normalizeCards(housingCards.items));
    } catch (error) {
      console.error("Failed to load settlement content", error);
      message.error("安居落户内容加载失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadSections();
  }, []);

  const persistCards = async (nextCards: SettlementCardItem[], successText: string) => {
    setSaving(true);
    try {
      const payload = {
        page_key: SETTLEMENT_PAGE_KEY,
        section_key: CARDS_SECTION_KEY,
        title: cardsSection?.title || "安居服务卡片",
        subtitle: cardsSection?.subtitle || "",
        content: "",
        extra_json: JSON.stringify({
          items: normalizeCards(nextCards).map((item) => ({
            icon: item.icon,
            title: item.title,
            desc: item.desc,
            action_type: resolveActionType(item.action_value),
            action_value: item.action_value,
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
      console.error("Failed to save settlement cards", error);
      message.error("安居服务卡片保存失败");
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

  const openEditCard = (item: SettlementCardItem, index: number) => {
    setEditingCardIndex(index);
    cardForm.setFieldsValue({
      icon: item.icon || "Home",
      title: item.title,
      desc: item.desc,
      action_value: item.action_value || "",
      sort_order: item.sort_order ?? index + 1,
      is_published: item.is_published !== 0,
    });
    setCardModalOpen(true);
  };

  const handleSubmitCard = async (values: SettlementCardFormValues) => {
    const nextItem: SettlementCardItem = {
      icon: values.icon,
      title: values.title.trim(),
      desc: values.desc.trim(),
      action_type: resolveActionType(values.action_value.trim()),
      action_value: values.action_value.trim(),
      sort_order: values.sort_order,
      is_published: values.is_published ? 1 : 0,
    };

    const nextCards =
      editingCardIndex === null
        ? normalizeCards([...cards, nextItem])
        : normalizeCards(cards.map((item, index) => (index === editingCardIndex ? nextItem : item)));

    setCards(nextCards);
    setCardModalOpen(false);
    await persistCards(nextCards, editingCardIndex === null ? "安居服务已新增" : "安居服务已更新");
  };

  const handleDeleteCard = async (index: number) => {
    const nextCards = cards.filter((_, cardIndex) => cardIndex !== index);
    setCards(nextCards);
    await persistCards(nextCards, "安居服务已删除");
  };

  const cardColumns: ColumnsType<SettlementCardItem> = [
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
      width: 320,
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
          <Popconfirm onConfirm={() => void handleDeleteCard(index)} title="确认删除这条安居服务吗？">
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
            <h2 style={{ marginBottom: 8, marginTop: 0 }}>安居落户页面内容</h2>
            <p className="admin-muted" style={{ marginBottom: 0 }}>
              维护安居服务卡片，卡片内容会直接对应前台页面展示。
            </p>
          </div>
          <Button icon={<PlusOutlined />} onClick={openCreateCard} type="primary">
            新增安居服务
          </Button>
        </div>
      </Card>

      <Card className="admin-page-card" title="安居服务卡片">
        <Table columns={cardColumns} dataSource={cards} pagination={false} rowKey={(record, index) => `${record.title}-${index}`} scroll={{ x: 1060 }} />
      </Card>

      <Modal
        destroyOnHidden
        onCancel={() => setCardModalOpen(false)}
        confirmLoading={saving}
        onOk={() => cardForm.submit()}
        open={cardModalOpen}
        title={editingCardIndex === null ? "新增安居服务" : "编辑安居服务"}
        width={760}
      >
        <Form form={cardForm} layout="vertical" onFinish={handleSubmitCard} requiredMark={false}>
          <Form.Item label="图标" name="icon" rules={[{ required: true, message: "请选择图标" }]}>
            <Select
              optionFilterProp="label"
              options={settlementCardIconOptions}
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
