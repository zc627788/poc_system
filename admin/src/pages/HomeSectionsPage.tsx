import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
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
  message,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useMemo, useState } from "react";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import { useParams } from "react-router-dom";
import { adminApi } from "../api";
import type { ApiResponse, PageSection } from "../types";

type SectionFormValues = {
  page_key: string;
  section_key: string;
  title: string;
  subtitle?: string;
  content: string;
  extra_json?: string;
  sort_order: number;
  is_published: number;
};

type PageConfig = {
  title: string;
  description: string;
  sectionKeys: string[];
  extraFieldsHint?: string;
  extraFieldsTitle?: string;
};

type PageSectionsPageProps = {
  pageKeyOverride?: string;
  titleOverride?: string;
  descriptionOverride?: string;
  allowedSectionKeys?: string[];
  sectionUsageMap?: Record<string, string>;
};

const pageConfigMap: Record<string, PageConfig> = {
  home: {
    title: "首页区块",
    description: "这里维护首页社区简介、资源市集、场景供需等展示区块。",
    sectionKeys: [
      "community_intro",
      "marketplace_summary",
      "marketplace_group_data",
      "marketplace_group_tools",
      "marketplace_group_compute",
      "scenario_1",
      "scenario_2",
      "scenario_3",
    ],
    extraFieldsTitle: "补充展示设置",
    extraFieldsHint: "如需补充按钮文字、跳转地址、图片地址等信息，可在这里填写。",
  },
  news: {
    title: "最新动态页头",
    description: "对应最新动态页头部标题和副标题，资讯列表内容请在“最新动态列表”中维护。",
    sectionKeys: ["hero"],
    extraFieldsTitle: "补充展示设置",
    extraFieldsHint: "如需补充背景图、按钮或其他展示信息，可在这里填写。",
  },
  community: {
    title: "社区简介页",
    description: "对应社区简介页头部、介绍、统计数据、基地信息和入驻条件。",
    sectionKeys: ["hero", "intro", "stats", "base_soft2", "base_soft3", "requirements"],
    extraFieldsTitle: "补充展示设置",
    extraFieldsHint: "如需补充统计数字、图片地址、地址说明等信息，可在这里填写。",
  },
  services: {
    title: "创业服务页",
    description: "对应政策筛选、政策卡片和创业配套服务卡片。",
    sectionKeys: ["hero", "policy_filters", "policy_cards", "support_cards"],
    extraFieldsTitle: "补充展示设置",
    extraFieldsHint: "如需补充筛选项、卡片列表或按钮信息，可在这里填写。",
  },
  setup: {
    title: "OPC工商注册页",
    description: "对应 OPC 开办页头部和流程图所需的全部配置数据。",
    sectionKeys: ["hero", "journey"],
    extraFieldsTitle: "补充展示设置",
    extraFieldsHint: "如需补充流程步骤、办理方式或按钮信息，可在这里填写。",
  },
  financing: {
    title: "融资对接页",
    description: "对应页头、引导文案和基金卡片。",
    sectionKeys: ["hero", "intro", "fund_cards"],
    extraFieldsTitle: "补充展示设置",
    extraFieldsHint: "如需补充基金卡片、按钮或图标信息，可在这里填写。",
  },
  settlement: {
    title: "安居落户页",
    description: "对应页头、说明区块和安居服务卡片。",
    sectionKeys: ["hero", "intro", "housing_cards"],
    extraFieldsTitle: "补充展示设置",
    extraFieldsHint: "如需补充图片、服务卡片或跳转信息，可在这里填写。",
  },
  marketplace: {
    title: "资源集市页",
    description: "对应资源集市页头部标题和副标题，资源卡片请在资源分类和资源条目中维护。",
    sectionKeys: ["hero", "marketplace_group_data", "marketplace_group_tools", "marketplace_group_compute"],
    extraFieldsTitle: "补充展示设置",
    extraFieldsHint: "如需补充查看更多按钮、图片地址或说明信息，可在这里填写。",
  },
  api_market: {
    title: "API市场页",
    description: "对应 API 市场页辅助标题说明，分类和卡片内容在资源模块中维护。",
    sectionKeys: ["hero"],
    extraFieldsTitle: "补充展示设置",
    extraFieldsHint: "如需补充背景图、按钮或其他展示信息，可在这里填写。",
  },
  mcp_market: {
    title: "MCP市场页",
    description: "对应 MCP 市场页标题和说明文案，卡片内容在资源模块中维护。",
    sectionKeys: ["hero"],
    extraFieldsTitle: "补充展示设置",
    extraFieldsHint: "如需补充背景图、按钮或其他展示信息，可在这里填写。",
  },
};

const defaultValues: SectionFormValues = {
  page_key: "home",
  section_key: "",
  title: "",
  subtitle: "",
  content: "",
  extra_json: "",
  sort_order: 0,
  is_published: 1,
};

export function PageSectionsPage({
  pageKeyOverride,
  titleOverride,
  descriptionOverride,
  allowedSectionKeys,
  sectionUsageMap = {},
}: PageSectionsPageProps = {}) {
  const { pageKey = "home" } = useParams();
  const rawPageKey = pageKeyOverride || pageKey;
  const resolvedPageKey = pageConfigMap[rawPageKey] ? rawPageKey : "home";
  const baseConfig = pageConfigMap[resolvedPageKey];
  const config = {
    ...baseConfig,
    title: titleOverride || baseConfig.title,
    description: descriptionOverride || baseConfig.description,
    sectionKeys: allowedSectionKeys || baseConfig.sectionKeys,
  };
  const [form] = Form.useForm<SectionFormValues>();
  const [items, setItems] = useState<PageSection[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PageSection | null>(null);

  const sectionLabelMap = useMemo(
    () => Object.fromEntries(config.sectionKeys.map((key) => [key, sectionUsageMap[key] || key])),
    [config.sectionKeys, sectionUsageMap]
  );

  const visibleItems = useMemo(() => {
    if (!allowedSectionKeys || allowedSectionKeys.length === 0) {
      return items;
    }

    return items.filter((item) => allowedSectionKeys.includes(item.section_key));
  }, [allowedSectionKeys, items]);

  const loadItems = async () => {
    setLoading(true);
    try {
      const response = await adminApi.get<ApiResponse<PageSection[]>>("/admin/page-sections", {
        params: { page_key: resolvedPageKey },
      });
      setItems(response.data.data);
    } catch (error) {
      console.error("Failed to load page sections", error);
      message.error("栏目内容加载失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    form.setFieldsValue({ ...defaultValues, page_key: resolvedPageKey });
    void loadItems();
  }, [form, resolvedPageKey]);

  const openCreateModal = () => {
    setEditingItem(null);
    form.setFieldsValue({ ...defaultValues, page_key: resolvedPageKey });
    setOpen(true);
  };

  const openEditModal = (item: PageSection) => {
    setEditingItem(item);
    form.setFieldsValue({
      page_key: item.page_key,
      section_key: item.section_key,
      title: item.title,
      subtitle: item.subtitle || "",
      content: item.content,
      extra_json: item.extra_json || "",
      sort_order: item.sort_order,
      is_published: item.is_published,
    });
    setOpen(true);
  };

  const closeModal = () => {
    setOpen(false);
    setEditingItem(null);
  };

  const handleDelete = async (id: number) => {
    try {
      await adminApi.delete(`/admin/page-sections/${id}`);
      message.success("栏目内容已删除");
      await loadItems();
    } catch (error) {
      console.error("Failed to delete page section", error);
      message.error("栏目内容删除失败");
    }
  };

  const handleSubmit = async (values: SectionFormValues) => {
    setSaving(true);
    try {
      const payload = { ...values, page_key: resolvedPageKey };
      if (editingItem) {
        await adminApi.put(`/admin/page-sections/${editingItem.id}`, payload);
        message.success("栏目内容已更新");
      } else {
        await adminApi.post("/admin/page-sections", payload);
        message.success("栏目内容已新增");
      }
      closeModal();
      await loadItems();
    } catch (error) {
      console.error("Failed to save page section", error);
      message.error("栏目内容保存失败");
    } finally {
      setSaving(false);
    }
  };

  const isMarketplace = resolvedPageKey === "marketplace" || resolvedPageKey === "api_market" || resolvedPageKey === "mcp_market";

  const columns: ColumnsType<PageSection> = [
    {
      title: "区块标识",
      dataIndex: "section_key",
      key: "section_key",
      width: 220,
      fixed: "left",
      render: (value: string) => (
        <Tag color="blue" style={{ whiteSpace: "normal", wordWrap: "break-word" }}>
          {sectionLabelMap[value] || value}
        </Tag>
      ),
    },
    { title: "标题", dataIndex: "title", key: "title", width: 140 },
    { title: "副标题", dataIndex: "subtitle", key: "subtitle", width: 100, ellipsis: true },
    { title: "排序", dataIndex: "sort_order", key: "sort_order", width: 80 },
    {
      title: "状态",
      dataIndex: "is_published",
      key: "is_published",
      width: 90,
      render: (value: number) => (value === 1 ? <Tag color="success">已发布</Tag> : <Tag>草稿</Tag>),
    },
    {
      title: "操作",
      key: "actions",
      width: 140,
      fixed: "right",
      render: (_, record) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => openEditModal(record)} type="link">
            编辑
          </Button>
          <Popconfirm onConfirm={() => void handleDelete(record.id)} title="确认删除这个页面区块吗？">
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
      <Card className="admin-page-card">
        <div className="admin-toolbar" style={{ maxWidth: 1200 }}>
          <div>
            <h2 style={{ marginTop: 0, marginBottom: 8 }}>{config.title}</h2>
            <p className="admin-muted" style={{ marginBottom: 0 }}>
              {config.description}
            </p>
          </div>
          <Button icon={<PlusOutlined />} onClick={openCreateModal} type="primary">
            新增栏目内容
          </Button>
        </div>

        <div className="admin-tags" style={{ marginTop: 16 }}>
          {config.sectionKeys.map((key) => (
            <Tag color="blue" key={key}>
              {sectionUsageMap[key] || key}
            </Tag>
          ))}
        </div>

      </Card>

      <Card className="admin-page-card">
        <Table
          columns={columns}
          dataSource={visibleItems}
          loading={loading}
          pagination={false}
          rowKey="id"
          scroll={{ x: 1000 }}
        />
      </Card>

      <Modal
        destroyOnHidden
        onCancel={closeModal}
        onOk={() => form.submit()}
        open={open}
        okButtonProps={{ loading: saving }}
        title={editingItem ? `编辑${config.title}` : `新增${config.title}`}
        width={860}
      >
        <Form form={form} initialValues={defaultValues} layout="vertical" onFinish={handleSubmit} requiredMark={false}>
          <Form.Item hidden label="页面标识" name="page_key">
            <Input disabled />
          </Form.Item>
          <Form.Item label="所属栏目" name="section_key" rules={[{ required: true, message: "请选择所属栏目" }]}>
            <Select
              options={config.sectionKeys.map((key) => ({
                label: sectionUsageMap[key] || key,
                value: key,
              }))}
              placeholder="请选择所属栏目"
            />
          </Form.Item>
          <Form.Item label="栏目标题" name="title" rules={[{ required: true, message: "请输入栏目标题" }]}>
            <Input placeholder="请输入栏目标题" />
          </Form.Item>
          <Form.Item label="栏目副标题" name="subtitle">
            <Input placeholder="请输入栏目副标题" />
          </Form.Item>
          {!isMarketplace && (
            <>
              <Form.Item label="正文内容" name="content" style={{ height: 280, marginBottom: 60 }}>
                <ReactQuill
                  theme="snow"
                  style={{ height: 240 }}
                  modules={{
                    toolbar: [
                      [{ header: [1, 2, 3, false] }],
                      ['bold', 'italic', 'underline', 'strike'],
                      [{ list: 'ordered' }, { list: 'bullet' }],
                      ['link', 'clean']
                    ],
                  }}
                  placeholder="请输入正文内容（支持基础富文本格式）。"
                />
              </Form.Item>
              <Form.Item extra={config.extraFieldsHint} label={config.extraFieldsTitle || "补充展示设置"} name="extra_json">
                <Input.TextArea placeholder="如有额外展示信息，可在这里填写。" rows={8} />
              </Form.Item>
            </>
          )}
          <Form.Item extra="数字越小，排序越靠前。" label="排序" name="sort_order">
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item label="显示状态" name="is_published">
            <Select
              options={[
                { label: "显示", value: 1 },
                { label: "隐藏", value: 0 },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
