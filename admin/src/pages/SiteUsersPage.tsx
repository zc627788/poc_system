import { EditOutlined, ReloadOutlined, UserOutlined } from "@ant-design/icons";
import { Button, Card, Form, Input, Modal, Select, Space, Table, Tag, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useState } from "react";
import { adminApi } from "../api";
import type { ApiResponse, SiteUserItem } from "../types";

type SiteUserFormValues = {
  name: string;
  status: number;
  password?: string;
};

const statusOptions = [
  { label: "全部状态", value: "all" },
  { label: "启用", value: 1 },
  { label: "停用", value: 0 },
];

function formatDateTime(value?: string | null) {
  if (!value) {
    return "-";
  }
  return value.replace("T", " ").slice(0, 19);
}

function formatAuthSource(value?: string) {
  return value === "ixiamen" ? "i厦门认证" : "本地账户";
}

export function SiteUsersPage() {
  const [form] = Form.useForm<SiteUserFormValues>();
  const [items, setItems] = useState<SiteUserItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | number>("all");
  const [editingItem, setEditingItem] = useState<SiteUserItem | null>(null);
  const [open, setOpen] = useState(false);

  const loadItems = async () => {
    setLoading(true);
    try {
      const response = await adminApi.get<ApiResponse<SiteUserItem[]>>("/admin/site-users", {
        params: {
          keyword: keyword.trim() || undefined,
          status: statusFilter === "all" ? undefined : statusFilter,
        },
      });
      setItems(response.data.data);
    } catch (error) {
      console.error("Failed to load site users", error);
      message.error("前台用户列表加载失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadItems();
  }, [statusFilter]);

  const openEditModal = (item: SiteUserItem) => {
    setEditingItem(item);
    form.setFieldsValue({
      name: item.name,
      status: item.status,
      password: "",
    });
    setOpen(true);
  };

  const closeModal = () => {
    setOpen(false);
    setEditingItem(null);
  };

  const handleSubmit = async (values: SiteUserFormValues) => {
    if (!editingItem) {
      return;
    }

    setSaving(true);
    try {
      await adminApi.put(`/admin/site-users/${editingItem.id}`, values);
      message.success("前台用户信息已更新");
      closeModal();
      await loadItems();
    } catch (error) {
      console.error("Failed to update site user", error);
      message.error("前台用户更新失败");
    } finally {
      setSaving(false);
    }
  };

  const columns: ColumnsType<SiteUserItem> = [
    { title: "ID", dataIndex: "id", key: "id", width: 70 },
    { title: "显示名称", dataIndex: "name", key: "name", width: 150 },
    {
      title: "登录来源",
      dataIndex: "auth_source",
      key: "auth_source",
      width: 120,
      render: (value?: string) => <Tag color={value === "ixiamen" ? "blue" : "default"}>{formatAuthSource(value)}</Tag>,
    },
    { title: "手机号", dataIndex: "phone", key: "phone", width: 140 },
    {
      title: "最近登录",
      dataIndex: "last_login_at",
      key: "last_login_at",
      width: 170,
      render: (value?: string | null) => formatDateTime(value),
    },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      width: 100,
      render: (value: number) => <Tag color={value === 1 ? "success" : "default"}>{value === 1 ? "启用" : "停用"}</Tag>,
    },
    {
      title: "创建时间",
      dataIndex: "created_at",
      key: "created_at",
      width: 170,
      render: (value: string) => formatDateTime(value),
    },
    {
      title: "操作",
      key: "actions",
      width: 120,
      fixed: "right",
      render: (_, record) => (
        <Button icon={<EditOutlined />} onClick={() => openEditModal(record)} type="link">
          编辑
        </Button>
      ),
    },
  ];

  return (
    <div className="admin-page">
      <Card className="admin-page-card">
        <div className="admin-toolbar">
          <div>
            <h2 style={{ marginTop: 0, marginBottom: 8 }}>前台用户管理</h2>
            <p className="admin-muted" style={{ marginBottom: 0 }}>
              统一查看门户前台用户，支持搜索、启停和名称修正。i厦门首次登录成功后，也会自动同步到这里。
            </p>
          </div>

          <div className="admin-toolbar-left">
            <Input.Search
              allowClear
              onChange={(event) => setKeyword(event.target.value)}
              onSearch={() => void loadItems()}
              placeholder="搜索名称或手机号"
              style={{ width: 240 }}
              value={keyword}
            />
            <Select
              onChange={(value) => setStatusFilter(value)}
              options={statusOptions}
              style={{ width: 140 }}
              value={statusFilter}
            />
            <Button icon={<ReloadOutlined />} onClick={() => void loadItems()}>
              刷新
            </Button>
          </div>
        </div>

      </Card>

      <Card className="admin-page-card">
        <Table
          columns={columns}
          dataSource={items}
          loading={loading}
          pagination={{ pageSize: 10 }}
          rowKey="id"
          scroll={{ x: 1200 }}
        />
      </Card>

      <Modal
        destroyOnHidden
        onCancel={closeModal}
        onOk={() => form.submit()}
        open={open}
        okButtonProps={{ loading: saving }}
        title="编辑前台用户"
        width={720}
      >
        <Space direction="vertical" size={14} style={{ display: "flex", marginBottom: 16 }}>
          <div>
            <strong>登录来源：</strong>
            {formatAuthSource(editingItem?.auth_source)}
          </div>
          <div>
            <strong>手机号：</strong>
            {editingItem?.phone || "-"}
          </div>
          <div>
            <strong>最近登录：</strong>
            {formatDateTime(editingItem?.last_login_at)}
          </div>
          {editingItem?.external_open_id ? (
            <div>
              <strong>OpenID：</strong>
              {editingItem.external_open_id}
            </div>
          ) : null}
        </Space>

        <Form form={form} layout="vertical" onFinish={handleSubmit} requiredMark={false}>
          <Form.Item label="显示名称" name="name" rules={[{ required: true, message: "请输入显示名称" }]}>
            <Input prefix={<UserOutlined />} placeholder="请输入用户显示名称" />
          </Form.Item>
          <Form.Item label="状态" name="status" rules={[{ required: true, message: "请选择状态" }]}>
            <Select
              options={[
                { label: "启用", value: 1 },
                { label: "停用", value: 0 },
              ]}
            />
          </Form.Item>
          <Form.Item extra="留空则不修改现有密码。" label="重置密码" name="password">
            <Input.Password placeholder="8 到 20 位，需包含字母和数字" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
