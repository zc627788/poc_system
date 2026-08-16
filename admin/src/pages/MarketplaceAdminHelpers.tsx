import { DeleteOutlined, EditOutlined, LinkOutlined, PlusOutlined, SaveOutlined } from "@ant-design/icons";
import { Button, Form, Input, InputNumber, Modal, Popconfirm, Select, Space, Switch, Table, Tag, Tooltip } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { ReactNode } from "react";
import { CmsIconBadge } from "../components/CmsIconPreview";
import type { PageSection, ResourceCategory, ResourceItem } from "../types";

export const marketplaceIconOptions = [
  { label: "数据库", value: "Database" },
  { label: "闪电能力", value: "Zap" },
  { label: "流程协同", value: "Workflow" },
  { label: "算力芯片", value: "Cpu" },
  { label: "接口服务", value: "Cable" },
  { label: "机器人", value: "Bot" },
  { label: "工具箱", value: "Briefcase" },
  { label: "票券权益", value: "Ticket" },
  { label: "补贴资金", value: "Banknote" },
  { label: "模型服务", value: "Sparkles" },
  { label: "认证服务", value: "UserCheck" },
  { label: "楼宇空间", value: "Building2" },
];

export function parseJson<T>(value?: string | null, fallback?: T): T {
  if (!value) {
    return fallback as T;
  }
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback as T;
  }
}

export function stringifyJson(value: unknown) {
  return JSON.stringify(value);
}

export function sortByOrder<T extends { sort_order?: number }>(items: T[]) {
  return [...items].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
}

export function renderIconBadge(icon?: string) {
  return <CmsIconBadge name={icon || "Briefcase"} size={16} strokeWidth={2.1} wrapperSize={32} />;
}

export function renderLinkIcon(url?: string) {
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

export function publishTag(value?: number) {
  return value === 0 ? <Tag>草稿</Tag> : <Tag color="success">已发布</Tag>;
}

export function resolveActionType(url?: string) {
  if (!url) {
    return "none";
  }
  return /^https?:\/\//i.test(url) ? "external" : "internal";
}

export function normalizeSection(sections: PageSection[], key: string) {
  return sections.find((item) => item.section_key === key) || null;
}

export function normalizeCategory(categories: ResourceCategory[], code: string) {
  return categories.find((item) => item.code === code) || null;
}

export function sectionBody(
  title: string,
  subtitle?: string | null,
  extra?: ReactNode
) {
  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={{ fontSize: 22, fontWeight: 700 }}>{title || "-"}</div>
      {subtitle ? <div style={{ color: "#475569", fontSize: 15 }}>{subtitle}</div> : null}
      {extra}
    </div>
  );
}

export type PageInfoFormValues = {
  title: string;
  subtitle: string;
  content?: string;
  button_text?: string;
  action_value?: string;
};

export function PageInfoCard({
  title,
  saving,
  editing,
  onEdit,
  onCancel,
  onSave,
  form,
  children,
  fields,
}: {
  title?: string;
  saving: boolean;
  editing: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
  form: ReturnType<typeof Form.useForm<PageInfoFormValues>>[0];
  children: ReactNode;
  fields?: ReactNode;
}) {
  return (
    <div className="admin-page-card ant-card ant-card-bordered">
      <div className="ant-card-body" style={{ padding: "22px 24px" }}>
        <div className="admin-toolbar" style={{ marginBottom: editing ? 16 : 0 }}>
          <div>{title ? <div style={{ fontSize: 18, fontWeight: 700 }}>{title}</div> : null}</div>
          {editing ? (
            <Space>
              <Button onClick={onCancel}>取消</Button>
              <Button icon={<SaveOutlined />} loading={saving} onClick={onSave} type="primary">
                保存
              </Button>
            </Space>
          ) : (
            <Button icon={<EditOutlined />} onClick={onEdit} type="primary">
              编辑
            </Button>
          )}
        </div>
        {editing ? (
          <Form form={form} layout="vertical" requiredMark={false}>
            {fields}
          </Form>
        ) : (
          children
        )}
      </div>
    </div>
  );
}

export type BasicCardFormValues = {
  icon: string;
  title: string;
  summary: string;
  action_value: string;
  button_text?: string;
  sort_order: number;
  is_published: boolean;
};

export function basicCardColumns<T extends { icon?: string | null; title: string; summary?: string; action_value?: string | null; sort_order?: number; is_published?: number }>(
  options: {
    titleLabel?: string;
    summaryLabel?: string;
    includeButtonText?: boolean;
    renderButtonText?: (record: T) => ReactNode;
    onEdit: (record: T, index: number) => void;
    onDelete: (index: number) => void;
  }
): ColumnsType<T> {
  const columns: ColumnsType<T> = [
    {
      title: "图标",
      dataIndex: "icon",
      key: "icon",
      width: 76,
      render: (value?: string) => renderIconBadge(value),
    },
    {
      title: options.titleLabel || "标题",
      dataIndex: "title",
      key: "title",
      width: 170,
      ellipsis: true,
    },
    {
      title: options.summaryLabel || "描述",
      dataIndex: "summary",
      key: "summary",
      width: 300,
      ellipsis: true,
    },
  ];

  if (options.includeButtonText) {
    columns.push({
      title: "按钮文案",
      key: "button_text",
      width: 100,
      ellipsis: true,
      render: (_, record) => options.renderButtonText?.(record) || "-",
    });
  }

  columns.push(
    {
      title: "跳转链接",
      key: "action_value",
      width: 90,
      align: "center",
      render: (_, record) => renderLinkIcon(record.action_value || ""),
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
      render: (value?: number) => publishTag(value),
    },
    {
      title: "操作",
      key: "actions",
      width: 96,
      fixed: "right",
      render: (_, record, index) => (
        <Space size={4}>
          <Tooltip title="编辑">
            <Button icon={<EditOutlined />} onClick={() => options.onEdit(record, index)} type="link" />
          </Tooltip>
          <Popconfirm onConfirm={() => options.onDelete(index)} title="确认删除这条内容吗？">
            <Tooltip title="删除">
              <Button danger icon={<DeleteOutlined />} type="link" />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    }
  );

  return columns;
}

export function CardEditorModal({
  open,
  title,
  saving,
  form,
  onCancel,
  onSubmit,
  includeButtonText = false,
  buttonTextLabel = "按钮文案",
  titleLabel = "标题",
  summaryLabel = "描述",
}: {
  open: boolean;
  title: string;
  saving: boolean;
  form: ReturnType<typeof Form.useForm<BasicCardFormValues>>[0];
  onCancel: () => void;
  onSubmit: () => void;
  includeButtonText?: boolean;
  buttonTextLabel?: string;
  titleLabel?: string;
  summaryLabel?: string;
}) {
  return (
    <Modal confirmLoading={saving} destroyOnHidden onCancel={onCancel} onOk={onSubmit} open={open} title={title} width={760}>
      <Form form={form} layout="vertical" requiredMark={false}>
        <Form.Item label="图标" name="icon" rules={[{ required: true, message: "请选择图标" }]}>
          <Select
            optionFilterProp="label"
            options={marketplaceIconOptions}
            optionRender={(option) => {
              const data = option.data as { label: string; value: string };
              return (
                <div style={{ alignItems: "center", display: "flex", gap: 10 }}>
                  {renderIconBadge(data.value)}
                  <span>{data.label}</span>
                </div>
              );
            }}
            placeholder="请选择图标"
            showSearch
          />
        </Form.Item>
        <Form.Item label={titleLabel} name="title" rules={[{ required: true, message: `请输入${titleLabel}` }]}>
          <Input placeholder={`请输入${titleLabel}`} />
        </Form.Item>
        <Form.Item label={summaryLabel} name="summary" rules={[{ required: true, message: `请输入${summaryLabel}` }]}>
          <Input.TextArea placeholder={`请输入${summaryLabel}`} rows={4} />
        </Form.Item>
        {includeButtonText ? (
          <Form.Item label={buttonTextLabel} name="button_text">
            <Input placeholder={`请输入${buttonTextLabel}`} />
          </Form.Item>
        ) : null}
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
  );
}

export function normalizeTags(value?: string | null) {
  const list = parseJson<string[]>(value, []);
  return Array.isArray(list) ? list : [];
}

export function normalizeMeta(value?: string | null) {
  return parseJson<Record<string, unknown>>(value, {});
}

export function toolFixedOrder(code: string) {
  const orderMap: Record<string, number> = {
    marketplace_tools: 1,
    marketplace_api: 2,
    marketplace_mcp: 3,
    marketplace_model_plaza: 4,
  };
  return orderMap[code] || 99;
}

export const toolFixedEntries = [
  { code: "marketplace_tools", label: "热门推荐", defaultLink: "/marketplace/tools" },
  { code: "marketplace_api", label: "AI编程工具", defaultLink: "/marketplace/tools/API" },
  { code: "marketplace_mcp", label: "AI办公套件", defaultLink: "/marketplace/tools/MCP" },
  { code: "marketplace_model_plaza", label: "大模型服务", defaultLink: "/marketplace/tools/model-plaza" },
];

export type MarketplaceModelFormValues = {
  title: string;
  summary: string;
  image_url?: string;
  icon?: string;
  tags: string[];
  highlight?: string;
  link_value: string;
  sort_order: number;
  is_published: boolean;
};

export function modelItemFromResource(values: MarketplaceModelFormValues, item?: ResourceItem | null) {
  const meta = item ? normalizeMeta(item.meta_json) : {};
  return {
    resource_type: "marketplace",
    category_code: "marketplace_model_plaza",
    title: values.title.trim(),
    summary: values.summary.trim(),
    icon: values.icon || null,
    image_url: values.image_url || null,
    badge_text: item?.badge_text || null,
    price: item?.price || null,
    unit_label: item?.unit_label || null,
    status_text: item?.status_text || null,
    link_type: resolveActionType(values.link_value.trim()),
    link_value: values.link_value.trim(),
    primary_button_text: item?.primary_button_text || null,
    secondary_link_type: item?.secondary_link_type || "none",
    secondary_link_value: item?.secondary_link_value || null,
    secondary_button_text: item?.secondary_button_text || null,
    tags_json: stringifyJson(values.tags.filter(Boolean)),
    meta_json: stringifyJson({
      ...meta,
      highlight: values.highlight?.trim() || "",
    }),
    show_on_home: item?.show_on_home ?? 1,
    sort_order: values.sort_order,
    is_published: values.is_published ? 1 : 0,
  };
}

export const commonTagOptions = [
  "免费",
  "付费",
  "企业专用",
  "个人高级认证",
  "支持MCP",
];
