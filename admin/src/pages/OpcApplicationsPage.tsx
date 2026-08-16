import { CheckCircleOutlined, DeleteOutlined, DownloadOutlined, EyeOutlined, ReloadOutlined, StopOutlined } from "@ant-design/icons";
import { Button, Card, DatePicker, Descriptions, Drawer, Form, Input, Modal, Select, Space, Switch, Table, Tag, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { adminApi, downloadAuthorizedFile } from "../api";
import type { ApiResponse, OpcApplicationDetailItem, OpcApplicationListData, OpcApplicationListItem } from "../types";

const { RangePicker } = DatePicker;
const statusOptions = ["待审核", "审核通过", "审核不通过", "办理完成"];
const formatDateTime = (value?: string | null) => (value ? value.replace("T", " ").slice(0, 19) : "-");
const statusTag = (value: string) => <Tag color={value === "待审核" ? "gold" : value === "审核通过" ? "blue" : value === "审核不通过" ? "red" : "green"}>{value}</Tag>;

export function OpcApplicationsPage() {
  const [items, setItems] = useState<OpcApplicationListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);
  const [selectedItem, setSelectedItem] = useState<OpcApplicationListItem | null>(null);
  const [detail, setDetail] = useState<OpcApplicationDetailItem | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [reviewModal, setReviewModal] = useState<"approve" | "reject" | "complete" | null>(null);
  const [reviewForm] = Form.useForm();

  const loadItems = async (): Promise<void> => {
    setLoading(true);
    try {
      const response = await adminApi.get<ApiResponse<OpcApplicationListData>>("/admin/opc-applications", {
        params: {
          submitter_keyword: keyword.trim() || undefined,
          status_value: statusFilter,
          start_time: dateRange?.[0]?.startOf("day").toISOString(),
          end_time: dateRange?.[1]?.endOf("day").toISOString(),
          page: 1,
          page_size: 100,
        },
      });
      setItems(response.data.data.items);
    } catch {
      message.error("申请列表加载失败");
    } finally {
      setLoading(false);
    }
  };

  const loadDetail = async (id: number): Promise<void> => {
    setDetailLoading(true);
    try {
      const response = await adminApi.get<ApiResponse<OpcApplicationDetailItem>>(`/admin/opc-applications/${id}`);
      setDetail(response.data.data);
    } catch {
      message.error("申请详情加载失败");
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    void loadItems();
  }, []);

  const openDetail = async (record: OpcApplicationListItem): Promise<void> => {
    setSelectedItem(record);
    await loadDetail(record.id);
  };

  const submitReview = async (): Promise<void> => {
    if (!selectedItem) return;
    try {
      const values = await reviewForm.validateFields();
      if (reviewModal === "approve") {
        await adminApi.post(`/admin/opc-applications/${selectedItem.id}/approve`);
        message.success("审核通过，已触发短信通知");
      }
      if (reviewModal === "complete") {
        await adminApi.post(`/admin/opc-applications/${selectedItem.id}/complete`);
        message.success("已更新为办理完成，已触发领取通知短信");
      }
      if (reviewModal === "reject") {
        await adminApi.post(`/admin/opc-applications/${selectedItem.id}/reject`, {
          status: "审核不通过",
          reject_reason: values.reject_reason,
          user_visible_note: values.user_visible_note,
          internal_note: values.internal_note,
        });
        message.success("已更新为审核不通过");
      }
      setReviewModal(null);
      reviewForm.resetFields();
      await loadItems();
      await loadDetail(selectedItem.id);
    } catch {
      if (reviewModal) message.error("状态更新失败");
    }
  };

  const toggleMissing = async (checked: boolean): Promise<void> => {
    if (!selectedItem) return;
    try {
      await adminApi.put(`/admin/opc-applications/${selectedItem.id}/missing-materials`, { is_missing_materials: checked });
      message.success("缺材料标记已更新");
      await loadItems();
      await loadDetail(selectedItem.id);
    } catch {
      message.error("缺材料标记更新失败");
    }
  };

  const deleteMaterial = async (fileId: number): Promise<void> => {
    if (!selectedItem) return;
    try {
      await adminApi.delete(`/admin/opc-applications/${selectedItem.id}/materials/${fileId}`);
      message.success("附件已删除");
      await loadDetail(selectedItem.id);
      await loadItems();
    } catch (error: unknown) {
      const detailMessage = typeof error === "object" && error && "response" in error ? (error as { response?: { data?: { detail?: string } } }).response?.data?.detail : undefined;
      message.error(detailMessage || "附件删除失败，仅高权限管理员可删除附件");
    }
  };

  const downloadMaterial = async (fileId: number, fileName: string): Promise<void> => {
    if (!selectedItem) return;
    try {
      await downloadAuthorizedFile(`/admin/opc-applications/${selectedItem.id}/materials/${fileId}/download`, fileName);
      message.success("附件下载成功");
    } catch {
      message.error("附件下载失败");
    }
  };

  const exportRows = async (): Promise<void> => {
    const ids = selectedRowKeys.map((key) => Number(key));
    if (!ids.length) {
      message.warning("请先选择要导出的记录");
      return;
    }
    try {
      const response = await adminApi.post("/admin/opc-applications/export", { application_ids: ids }, { responseType: "blob" });
      const blob = new Blob([response.data], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `opc-applications-${dayjs().format("YYYYMMDDHHmmss")}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      message.success("导出成功");
    } catch {
      message.error("导出失败");
    }
  };

  const columns: ColumnsType<OpcApplicationListItem> = [
    { title: "提交人", dataIndex: "site_user_name", key: "site_user_name", width: 150, render: (_, record) => <div><div>{record.site_user_name || "-"}</div><div style={{ color: "#999", fontSize: 12 }}>{record.site_user_phone || "-"}</div></div> },
    { title: "提交时间", dataIndex: "submitted_at", key: "submitted_at", width: 170, render: formatDateTime },
    { title: "提交内容", key: "submit_content", width: 360, render: (_, record) => <div><div>{record.submit_content}</div><div style={{ color: "#999", fontSize: 12, marginTop: 4 }}>申请编号：{record.application_no}</div></div> },
    { title: "是否邮寄", key: "mailing_status", width: 220, render: (_, record) => <div><div>{record.mailing_status === "待开发" ? "否（待开发）" : record.mailing_status}</div><div style={{ color: "#999", fontSize: 12, marginTop: 4 }}>{record.mailing_contact_info || "暂无收件信息"}</div></div> },
    { title: "状态", dataIndex: "status", key: "status", width: 120, render: statusTag },
    { title: "审核时间", dataIndex: "reviewed_at", key: "reviewed_at", width: 170, render: formatDateTime },
    { title: "不通过原因", dataIndex: "reject_reason_summary", key: "reject_reason_summary", width: 240, render: (value?: string | null) => value || "-" },
    { title: "操作", key: "action", width: 120, fixed: "right", render: (_, record) => <Button icon={<EyeOutlined />} type="link" onClick={() => void openDetail(record)}>查看</Button> },
  ];

  return (
    <div className="admin-page">
      <Card className="admin-page-card">
        <div className="admin-toolbar">
          <div>
            <h2 style={{ marginTop: 0, marginBottom: 8 }}>申请管理</h2>
            <p className="admin-muted" style={{ marginBottom: 0 }}>
              按提交人、提交时间、状态筛选 OPC 开办申请，并执行审核通过、不通过、办理完成等操作。
            </p>
          </div>
          <Space wrap>
            <Input.Search placeholder="提交人或手机号" allowClear value={keyword} onChange={(e) => setKeyword(e.target.value)} onSearch={() => void loadItems()} style={{ width: 220 }} />
            <Select allowClear placeholder="状态筛选" value={statusFilter} onChange={setStatusFilter} options={statusOptions.map((item) => ({ label: item, value: item }))} style={{ width: 150 }} />
            <RangePicker value={dateRange as never} onChange={(value) => setDateRange(value as [dayjs.Dayjs | null, dayjs.Dayjs | null] | null)} />
            <Button icon={<ReloadOutlined />} onClick={() => void loadItems()}>刷新</Button>
            <Button onClick={() => void exportRows()}>导出选中</Button>
          </Space>
        </div>
      </Card>

      <Card className="admin-page-card">
        <Table rowKey="id" rowSelection={{ selectedRowKeys, onChange: setSelectedRowKeys }} loading={loading} columns={columns} dataSource={items} scroll={{ x: 1600 }} pagination={{ pageSize: 10 }} />
      </Card>

      <Drawer width={920} title={selectedItem ? `申请详情 - ${selectedItem.application_no}` : "申请详情"} open={!!selectedItem} onClose={() => { setSelectedItem(null); setDetail(null); }}>
        <div>
          {detailLoading || !detail ? "正在加载详情..." : (
            <Space direction="vertical" size={16} style={{ width: "100%" }}>
              <Descriptions bordered column={2} size="small">
                <Descriptions.Item label="提交人">{detail.site_user_name || detail.site_user_phone || "-"}</Descriptions.Item>
                <Descriptions.Item label="提交时间">{formatDateTime(detail.submitted_at)}</Descriptions.Item>
                <Descriptions.Item label="企业名称（拟）">{detail.company_name}</Descriptions.Item>
                <Descriptions.Item label="注册资本">{detail.registered_capital}</Descriptions.Item>
                <Descriptions.Item label="状态">{statusTag(detail.status)}</Descriptions.Item>
                <Descriptions.Item label="缺材料">
                  <Switch checked={detail.is_missing_materials} checkedChildren="是" unCheckedChildren="否" onChange={(checked) => void toggleMissing(checked)} />
                </Descriptions.Item>
                <Descriptions.Item label="法定代表人">{detail.legal_representative_name || "-"}</Descriptions.Item>
                <Descriptions.Item label="工商联络人">{detail.industrial_contact_name || "-"}</Descriptions.Item>
                <Descriptions.Item label="经营范围" span={2}>{detail.business_scope}</Descriptions.Item>
                <Descriptions.Item label="是否邮寄">{detail.mailing_status === "待开发" ? "否（待开发）" : detail.mailing_status}</Descriptions.Item>
                <Descriptions.Item label="收件信息">{selectedItem?.mailing_contact_info || "暂无收件信息"}</Descriptions.Item>
                <Descriptions.Item label="住所来源凭证" span={2}>{detail.premises_source_json || "-"}</Descriptions.Item>
              </Descriptions>

              <Card title="审核操作">
                <Space wrap>
                  <Button type="primary" icon={<CheckCircleOutlined />} onClick={() => setReviewModal("approve")}>通过</Button>
                  <Button danger icon={<StopOutlined />} onClick={() => setReviewModal("reject")}>不通过</Button>
                  <Button onClick={() => setReviewModal("complete")}>办理完成</Button>
                </Space>
              </Card>

              <Card title="材料列表">
                {detail.materials.map((material) => (
                  <div key={material.id} style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "10px 0", borderBottom: "1px solid #f0f0f0" }}>
                    <div>
                      <div>{material.original_file_name}</div>
                      <div style={{ color: "#999", fontSize: 12 }}>{material.material_category} / {formatDateTime(material.uploaded_at)}</div>
                    </div>
                    <Space>
                      <Button icon={<DownloadOutlined />} onClick={() => void downloadMaterial(material.id, material.original_file_name)}>下载</Button>
                      <Button danger icon={<DeleteOutlined />} onClick={() => void deleteMaterial(material.id)}>删除</Button>
                    </Space>
                  </div>
                ))}
              </Card>

              <Card title="不通过原因与用户可见备注">
                {detail.review_records.map((record) => (
                  <div key={record.id} style={{ padding: "8px 0", borderBottom: "1px solid #f5f5f5" }}>
                    <div>{formatDateTime(record.operated_at)} / {record.current_status}</div>
                    <div style={{ color: "#cf1322" }}>{record.reject_reason || "-"}</div>
                    <div>{record.user_visible_note || "-"}</div>
                    <div style={{ color: "#999" }}>内部备注：{record.internal_note || "-"}</div>
                  </div>
                ))}
              </Card>

              <Card title="操作日志">
                {detail.action_logs.map((log) => (
                  <div key={log.id} style={{ padding: "8px 0", borderBottom: "1px solid #f5f5f5" }}>
                    {formatDateTime(log.operated_at)} / {log.action_summary} / {log.action_detail || "-"}
                  </div>
                ))}
              </Card>
            </Space>
          )}
        </div>
      </Drawer>

      <Modal title={reviewModal === "approve" ? "确认审核通过" : reviewModal === "complete" ? "确认办理完成" : "审核不通过"} open={!!reviewModal} onOk={() => void submitReview()} onCancel={() => { setReviewModal(null); reviewForm.resetFields(); }}>
        {reviewModal === "reject" ? (
          <Form form={reviewForm} layout="vertical">
            <Form.Item label="不通过原因" name="reject_reason" rules={[{ required: true, message: "请输入不通过原因" }]}>
              <Input.TextArea rows={3} placeholder="请输入审核不通过原因，用户可在我的办件中查看" />
            </Form.Item>
            <Form.Item label="用户可见备注" name="user_visible_note">
              <Input.TextArea rows={3} placeholder="可填写补件要求、重新提交说明等" />
            </Form.Item>
            <Form.Item label="内部备注" name="internal_note">
              <Input.TextArea rows={3} placeholder="仅后台可见" />
            </Form.Item>
          </Form>
        ) : (
          <div>
            {reviewModal === "approve"
              ? "确认后将状态更新为“审核通过”，并向当前申请人手机号自动发送审核通过短信通知。"
              : "确认后将状态更新为“办理完成”，并向当前申请人手机号自动发送营业执照领取通知短信。"}
          </div>
        )}
      </Modal>
    </div>
  );
}
