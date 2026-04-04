import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import {
  Alert,
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
  jsonHint: string;
};

const pageConfigMap: Record<string, PageConfig> = {
  home: {
    title: "首页区块",
    description: "对应首页的社区简介摘要、AI 资源集市摘要和场景供需对接轮播区块。",
    sectionKeys: ["community_intro", "marketplace_summary", "scenario_1", "scenario_2", "scenario_3"],
    jsonHint: '{"button_text":"了解更多","action_type":"internal","action_value":"/community","image_url":"https://..."}',
  },
  news: {
    title: "最新动态页头",
    description: "对应最新动态页头部标题和副标题，资讯列表内容请在“最新动态列表”中维护。",
    sectionKeys: ["hero"],
    jsonHint: "{}",
  },
  community: {
    title: "社区简介页",
    description: "对应社区简介页头部、介绍、统计数据、基地信息和入驻条件。",
    sectionKeys: ["hero", "intro", "stats", "base_soft2", "base_soft3", "requirements"],
    jsonHint: '{"items":[{"value":"300+","label":"入驻团队"}],"image_url":"https://...","address":"厦门软件园二期观日路32号"}',
  },
  services: {
    title: "创业服务页",
    description: "对应政策筛选、政策卡片和创业配套服务卡片。",
    sectionKeys: ["hero", "policy_filters", "policy_cards", "support_cards"],
    jsonHint:
      '{"type_options":["高校毕业生"],"stage_options":["AI电商"],"items":[{"title":"高校毕业生见习补贴","desc":"...","tags":["高校毕业生"]}]}',
  },
  setup: {
    title: "OPC开办页",
    description: "对应 OPC 开办页头部和流程图所需的全部配置数据。",
    sectionKeys: ["hero", "journey"],
    jsonHint:
      '{"start":{"title":"申请人提出\\n企业开办申请"},"application_options":[{"title":"一网通办平台","desc":"全流程网上申报"}]}',
  },
  financing: {
    title: "融资对接页",
    description: "对应页头、引导文案和基金卡片。",
    sectionKeys: ["hero", "intro", "fund_cards"],
    jsonHint: '{"items":[{"icon":"Coins","title":"人工智能产业投资基金","desc":"...","button_text":"立即申请"}]}',
  },
  settlement: {
    title: "安居落户页",
    description: "对应页头、说明区块和安居服务卡片。",
    sectionKeys: ["hero", "intro", "housing_cards"],
    jsonHint:
      '{"image_url":"https://...","items":[{"icon":"Home","title":"人才房申请","desc":"...","action_value":"https://..."}]}',
  },
  marketplace: {
    title: "资源集市页",
    description: "对应资源集市页头部标题和副标题，资源卡片请在资源分类和资源条目中维护。",
    sectionKeys: ["hero"],
    jsonHint: "{}",
  },
  api_market: {
    title: "API市场页",
    description: "对应 API 市场页辅助标题说明，分类和卡片内容在资源模块中维护。",
    sectionKeys: ["hero"],
    jsonHint: "{}",
  },
  mcp_market: {
    title: "MCP市场页",
    description: "对应 MCP 市场页标题和说明文案，卡片内容在资源模块中维护。",
    sectionKeys: ["hero"],
    jsonHint: "{}",
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

export function PageSectionsPage() {
  const { pageKey = "home" } = useParams();
  const resolvedPageKey = pageConfigMap[pageKey] ? pageKey : "home";
  const config = pageConfigMap[resolvedPageKey];
  const [form] = Form.useForm<SectionFormValues>();
  const [items, setItems] = useState<PageSection[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PageSection | null>(null);

  const sectionLabelMap = useMemo(
    () => Object.fromEntries(config.sectionKeys.map((key) => [key, key])),
    [config.sectionKeys]
  );

  const loadItems = async () => {
    setLoading(true);
    try {
      const response = await adminApi.get<ApiResponse<PageSection[]>>("/admin/page-sections", {
        params: { page_key: resolvedPageKey },
      });
      setItems(response.data.data);
    } catch (error) {
      console.error("Failed to load page sections", error);
      message.error("页面区块加载失败");
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
      message.success("页面区块已删除");
      await loadItems();
    } catch (error) {
      console.error("Failed to delete page section", error);
      message.error("页面区块删除失败");
    }
  };

  const handleSubmit = async (values: SectionFormValues) => {
    setSaving(true);
    try {
      const payload = { ...values, page_key: resolvedPageKey };
      if (editingItem) {
        await adminApi.put(`/admin/page-sections/${editingItem.id}`, payload);
        message.success("页面区块已更新");
      } else {
        await adminApi.post("/admin/page-sections", payload);
        message.success("页面区块已新增");
      }
      closeModal();
      await loadItems();
    } catch (error) {
      console.error("Failed to save page section", error);
      message.error("页面区块保存失败");
    } finally {
      setSaving(false);
    }
  };

  const columns: ColumnsType<PageSection> = [
    {
      title: "区块标识",
      dataIndex: "section_key",
      key: "section_key",
      width: 180,
      render: (value: string) => <Tag color="blue">{sectionLabelMap[value] || value}</Tag>,
    },
    { title: "标题", dataIndex: "title", key: "title", width: 220 },
    { title: "副标题", dataIndex: "subtitle", key: "subtitle", ellipsis: true },
    { title: "排序", dataIndex: "sort_order", key: "sort_order", width: 80 },
    {
      title: "状态",
      dataIndex: "is_published",
      key: "is_published",
      width: 100,
      render: (value: number) => (value === 1 ? <Tag color="success">已发布</Tag> : <Tag>草稿</Tag>),
    },
    {
      title: "操作",
      key: "actions",
      width: 150,
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
        <div className="admin-toolbar">
          <div>
            <h2 style={{ marginTop: 0, marginBottom: 8 }}>{config.title}</h2>
            <p className="admin-muted" style={{ marginBottom: 0 }}>
              {config.description}
            </p>
          </div>
          <Button icon={<PlusOutlined />} onClick={openCreateModal} type="primary">
            新增页面区块
          </Button>
        </div>

        <div className="admin-tags" style={{ marginTop: 16 }}>
          {config.sectionKeys.map((key) => (
            <Tag color="blue" key={key}>
              {key}
            </Tag>
          ))}
        </div>

        <Alert
          description={`这里的 page_key 固定为 ${resolvedPageKey}。为了和原型保持稳定映射，建议优先使用上面这些 section_key。`}
          message="字段映射提示"
          showIcon
          style={{ marginTop: 16 }}
          type="info"
        />
      </Card>

      <Card className="admin-page-card">
        <Table
          columns={columns}
          dataSource={items}
          loading={loading}
          pagination={false}
          rowKey="id"
          scroll={{ x: 1120 }}
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
          <Form.Item label="页面标识" name="page_key">
            <Input disabled />
          </Form.Item>
          <Form.Item label="区块标识" name="section_key" rules={[{ required: true, message: "请输入区块标识" }]}>
            <Input placeholder={`例如：${config.sectionKeys.join(" / ")}`} />
          </Form.Item>
          <Form.Item label="区块标题" name="title" rules={[{ required: true, message: "请输入区块标题" }]}>
            <Input placeholder="请输入区块标题" />
          </Form.Item>
          <Form.Item label="区块副标题" name="subtitle">
            <Input placeholder="请输入区块副标题" />
          </Form.Item>
          <Form.Item label="正文内容" name="content">
            <Input.TextArea placeholder="请输入正文内容，如前台会读取 HTML，请按原型格式维护。" rows={6} />
          </Form.Item>
          <Form.Item label="扩展 JSON" name="extra_json">
            <Input.TextArea placeholder={config.jsonHint} rows={8} />
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
    </div>
  );
}
