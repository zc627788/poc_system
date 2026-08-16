import { EditOutlined, PlusOutlined, ReloadOutlined, ShoppingOutlined } from "@ant-design/icons";
import { Alert, Button, Card, Drawer, Form, Input, InputNumber, Popconfirm, Radio, Select, Space, Switch, Table, Tag, Typography, message } from "antd";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";
import axios from "axios";
import { useCallback, useEffect, useState } from "react";
import { adminApi } from "../api";
import type { ApiResponse, BillingMode, BillingProduct, BillingProductListData, BillingProductStatus } from "../types";

type ProductFormValues = {
  product_code?: string;
  service_code: string;
  service_name: string;
  supplier_name: string;
  name: string;
  description?: string;
  billing_mode: BillingMode;
  price: string | number;
  sort_order: number;
  status: BillingProductStatus;
};

const defaults: ProductFormValues = { product_code: "", service_code: "", service_name: "", supplier_name: "", name: "", description: "", billing_mode: "MONTHLY", price: "", sort_order: 0, status: "OFF_SALE" };
const modeLabels: Record<BillingMode, string> = { MONTHLY: "按月固定费用", PREPAID: "固定面额预充值" };

function errorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    const body = error.response?.data as { detail?: string; message?: string } | undefined;
    return body?.detail || body?.message || (error.response?.status === 401 ? "登录已失效，请重新登录" : "请求失败，请稍后重试");
  }
  return error instanceof Error ? error.message : "请求失败，请稍后重试";
}

export function BillingProductsPage() {
  const [form] = Form.useForm<ProductFormValues>();
  const selectedMode = Form.useWatch("billing_mode", form);
  const [items, setItems] = useState<BillingProduct[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [keyword, setKeyword] = useState("");
  const [keywordInput, setKeywordInput] = useState("");
  const [mode, setMode] = useState<BillingMode | undefined>();
  const [status, setStatus] = useState<BillingProductStatus | undefined>();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<BillingProduct | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setLoadError("");
    try {
      const response = await adminApi.get<ApiResponse<BillingProductListData>>("/admin/billing/products", { params: { page, page_size: pageSize, keyword: keyword || undefined, billing_mode: mode, status } });
      setItems(response.data.data.items); setTotal(response.data.data.total);
    } catch (error) { setLoadError(errorMessage(error)); }
    finally { setLoading(false); }
  }, [keyword, mode, page, pageSize, status]);

  useEffect(() => { void load(); }, [load]);

  const openCreate = () => { setEditing(null); form.setFieldsValue(defaults); setDrawerOpen(true); };
  const openEdit = (item: BillingProduct) => {
    setEditing(item);
    form.setFieldsValue({ product_code: item.product_code, service_code: item.service_code, service_name: item.service_name, supplier_name: item.supplier_name, name: item.name, description: item.description || "", billing_mode: item.billing_mode, price: item.price, sort_order: item.sort_order, status: item.status });
    setDrawerOpen(true);
  };

  const submit = async (values: ProductFormValues) => {
    setSaving(true);
    const payload = { ...values, price: String(values.price), description: values.description?.trim() || null };
    try {
      if (editing) {
        const { product_code: _productCode, ...updatePayload } = payload;
        await adminApi.put(`/admin/billing/products/${editing.id}`, updatePayload);
        message.success("商品已更新");
      } else {
        await adminApi.post("/admin/billing/products", payload);
        message.success("商品已创建");
      }
      setDrawerOpen(false); await load();
    } catch (error) { message.error(errorMessage(error)); }
    finally { setSaving(false); }
  };

  const changeStatus = async (item: BillingProduct) => {
    const nextStatus: BillingProductStatus = item.status === "ON_SALE" ? "OFF_SALE" : "ON_SALE";
    try { await adminApi.put(`/admin/billing/products/${item.id}/status`, { status: nextStatus }); message.success(nextStatus === "ON_SALE" ? "商品已上架" : "商品已下架"); await load(); }
    catch (error) { message.error(errorMessage(error)); }
  };

  const columns: ColumnsType<BillingProduct> = [
    { title: "商品", key: "product", width: 250, fixed: "left", render: (_, item) => <div className="billing-admin-product"><strong title={item.name}>{item.name}</strong><span title={item.product_code}>{item.product_code}</span></div> },
    { title: "服务", key: "service", width: 190, render: (_, item) => <div className="billing-admin-product"><strong title={item.service_name}>{item.service_name}</strong><span title={item.service_code}>{item.service_code}</span></div> },
    { title: "供应商", dataIndex: "supplier_name", width: 170, ellipsis: true },
    { title: "计费模式", dataIndex: "billing_mode", width: 130, render: (value: BillingMode) => <Tag color={value === "MONTHLY" ? "blue" : "green"}>{value === "MONTHLY" ? "按月" : "预充值"}</Tag> },
    { title: "价格（CNY）", dataIndex: "price", width: 135, align: "right", render: (value: string, item) => <Typography.Text strong>¥ {Number(value).toLocaleString("zh-CN", { minimumFractionDigits: 2 })}{item.billing_mode === "MONTHLY" ? "/月" : ""}</Typography.Text> },
    { title: "排序", dataIndex: "sort_order", width: 75, align: "center" },
    { title: "状态", dataIndex: "status", width: 105, render: (_: BillingProductStatus, item) => <Popconfirm cancelText="取消" okText="确认" onConfirm={() => void changeStatus(item)} title={`确认${item.status === "ON_SALE" ? "下架" : "上架"}该商品？`}><Switch checked={item.status === "ON_SALE"} checkedChildren="上架" unCheckedChildren="下架" /></Popconfirm> },
    { title: "更新时间", dataIndex: "updated_at", width: 165, render: (value: string) => new Date(value.endsWith("Z") ? value : `${value}Z`).toLocaleString("zh-CN", { timeZone: "Asia/Shanghai", hour12: false }) },
    { title: "操作", key: "actions", width: 90, fixed: "right", render: (_, item) => <Button icon={<EditOutlined />} onClick={() => openEdit(item)} type="link">编辑</Button> },
  ];

  const pagination: TablePaginationConfig = { current: page, pageSize, total, showSizeChanger: true, showTotal: (value) => `共 ${value} 条`, onChange: (nextPage, nextSize) => { setPage(nextSize === pageSize ? nextPage : 1); setPageSize(nextSize); } };

  return <div className="admin-page billing-admin-page">
    <Card className="admin-page-card"><div className="admin-toolbar"><div><h2><ShoppingOutlined /> 商品管理</h2><p className="admin-muted">维护按月服务与固定面额预充值商品，商品编码创建后不可修改。</p></div><Button icon={<PlusOutlined />} onClick={openCreate} type="primary">新增商品</Button></div></Card>
    <Card className="admin-page-card">
      <div className="billing-admin-filters"><Input.Search allowClear onChange={(event) => setKeywordInput(event.target.value)} onSearch={(value) => { setKeyword(value.trim()); setPage(1); }} placeholder="商品编码、名称或服务" value={keywordInput} /><Select allowClear onChange={(value) => { setMode(value); setPage(1); }} options={[{ label: "按月固定费用", value: "MONTHLY" }, { label: "固定面额预充值", value: "PREPAID" }]} placeholder="计费模式" value={mode} /><Select allowClear onChange={(value) => { setStatus(value); setPage(1); }} options={[{ label: "已上架", value: "ON_SALE" }, { label: "已下架", value: "OFF_SALE" }]} placeholder="商品状态" value={status} /><Button icon={<ReloadOutlined />} onClick={() => void load()}>刷新</Button></div>
      {loadError ? <Alert action={<Button onClick={() => void load()} size="small">重试</Button>} message={loadError} showIcon type="error" /> : null}
      <Table columns={columns} dataSource={items} loading={loading} pagination={pagination} rowKey="id" scroll={{ x: 1380 }} size="middle" tableLayout="fixed" />
    </Card>
    <Drawer destroyOnClose extra={<Space><Button onClick={() => setDrawerOpen(false)}>取消</Button><Button loading={saving} onClick={() => form.submit()} type="primary">保存</Button></Space>} onClose={() => setDrawerOpen(false)} open={drawerOpen} title={editing ? "编辑商品" : "新增商品"} width={620}>
      <Form form={form} initialValues={defaults} layout="vertical" onFinish={(values) => void submit(values)} requiredMark={false}>
        <div className="admin-grid-2"><Form.Item label="商品编码" name="product_code" rules={[{ required: true, message: "请输入商品编码" }, { pattern: /^[A-Z0-9_]{2,64}$/, message: "仅支持 2-64 位大写字母、数字和下划线" }]}><Input disabled={Boolean(editing)} maxLength={64} placeholder="例如 AI_COMPUTE_MONTHLY" /></Form.Item><Form.Item label="服务编码" name="service_code" rules={[{ required: true, message: "请输入服务编码" }, { pattern: /^[A-Z0-9_]{2,64}$/, message: "仅支持 2-64 位大写字母、数字和下划线" }]}><Input maxLength={64} placeholder="例如 AI_COMPUTE" /></Form.Item></div>
        <div className="admin-grid-2"><Form.Item label="商品名称" name="name" rules={[{ required: true, whitespace: true, message: "请输入商品名称" }]}><Input maxLength={128} /></Form.Item><Form.Item label="服务名称" name="service_name" rules={[{ required: true, whitespace: true, message: "请输入服务名称" }]}><Input maxLength={128} /></Form.Item></div>
        <Form.Item label="服务供应商" name="supplier_name" rules={[{ required: true, whitespace: true, message: "请输入服务供应商" }]}><Input maxLength={128} /></Form.Item>
        <Form.Item label="商品说明" name="description"><Input.TextArea maxLength={2000} rows={4} showCount /></Form.Item>
        <Form.Item label="计费模式" name="billing_mode" rules={[{ required: true }]}><Radio.Group optionType="button" buttonStyle="solid" options={[{ label: "按月固定费用", value: "MONTHLY" }, { label: "固定面额预充值", value: "PREPAID" }]} /></Form.Item>
        <div className="admin-grid-2"><Form.Item label="价格（人民币）" name="price" rules={[{ required: true, message: "请输入价格" }]}><InputNumber addonAfter={selectedMode === "MONTHLY" ? "元/月" : "元/面额"} min="0.01" precision={2} stringMode style={{ width: "100%" }} /></Form.Item><Form.Item label="前台排序" name="sort_order" rules={[{ required: true }]}><InputNumber precision={0} style={{ width: "100%" }} /></Form.Item></div>
        <Form.Item label="商品状态" name="status" rules={[{ required: true }]}><Select options={[{ label: "下架（前台不可见）", value: "OFF_SALE" }, { label: "上架（前台可见）", value: "ON_SALE" }]} /></Form.Item>
        <Alert message={`同一服务编码下的商品必须使用相同的服务名称和供应商名称。${selectedMode ? `当前选择：${modeLabels[selectedMode]}` : ""}`} showIcon type="info" />
      </Form>
    </Drawer>
  </div>;
}
