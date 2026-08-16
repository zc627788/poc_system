import { DeleteOutlined, DownloadOutlined, EyeOutlined, InboxOutlined, ReloadOutlined, UploadOutlined } from "@ant-design/icons";
import { Button, Card, DatePicker, Descriptions, Drawer, Modal, Select, Space, Table, Tag, Upload, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { UploadFile, UploadProps } from "antd/es/upload/interface";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { adminApi, downloadAuthorizedFile } from "../api";
import type {
  ApiResponse,
  CommunityJoinActionLog,
  CommunityJoinApplicationDetail,
  CommunityJoinApplicationListData,
  CommunityJoinApplicationListItem,
  CommunityJoinMaterialFile,
} from "../types";

const { RangePicker } = DatePicker;
const { Dragger } = Upload;

const formatDateTime = (value?: string | null) => (value ? value.replace("T", " ").slice(0, 19) : "-");
const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

const statusTag = (value: string) => (
  <Tag color={value === "已上传" ? "blue" : "gold"}>{value}</Tag>
);

const campusOptions = [
  { label: "园区二", value: "园区二" },
  { label: "园区三", value: "园区三" },
];

const statusOptions = [
  { label: "未上传", value: "未上传" },
  { label: "已上传", value: "已上传" },
];

const ALLOWED_TYPES_HINT = "支持 jpg/jpeg/png/gif/webp/pdf/doc/docx/xls/xlsx/ppt/pptx/zip/rar/txt，单文件最大 10 MB，最多 20 个文件";
const MAX_FILES = 20;
const CHUNK_SIZE = 1024 * 1024; // 1MB per chunk
const CONCURRENCY = 3; // Max concurrent chunk uploads

export function CommunityJoinApplicationsPage() {
  const [items, setItems] = useState<CommunityJoinApplicationListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [campusFilter, setCampusFilter] = useState<string | undefined>();
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);
  const [page, setPage] = useState(1);

  const [selectedItem, setSelectedItem] = useState<CommunityJoinApplicationListItem | null>(null);
  const [detail, setDetail] = useState<CommunityJoinApplicationDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadTargetId, setUploadTargetId] = useState<number | null>(null);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});

  const loadItems = async (p = page): Promise<void> => {
    setLoading(true);
    try {
      const response = await adminApi.get<ApiResponse<CommunityJoinApplicationListData>>(
        "/admin/community-join-applications",
        {
          params: {
            submitter_keyword: keyword.trim() || undefined,
            status_value: statusFilter,
            target_campus: campusFilter,
            start_time: dateRange?.[0]?.startOf("day").toISOString(),
            end_time: dateRange?.[1]?.endOf("day").toISOString(),
            page: p,
            page_size: 10,
          },
        }
      );
      setItems(response.data.data.items);
      setTotal(response.data.data.total);
    } catch {
      message.error("申请列表加载失败");
    } finally {
      setLoading(false);
    }
  };

  const loadDetail = async (id: number): Promise<void> => {
    setDetailLoading(true);
    try {
      const response = await adminApi.get<ApiResponse<CommunityJoinApplicationDetail>>(
        `/admin/community-join-applications/${id}`
      );
      setDetail(response.data.data);
    } catch {
      message.error("详情加载失败");
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    void loadItems();
  }, []);

  const openDetail = async (record: CommunityJoinApplicationListItem): Promise<void> => {
    setSelectedItem(record);
    await loadDetail(record.id);
  };

  const openUploadModal = (id: number) => {
    setUploadTargetId(id);
    setFileList([]);
    setUploadProgress({});
    setUploadModalOpen(true);
  };

  const handleUpload = async (): Promise<void> => {
    if (!uploadTargetId || fileList.length === 0) {
      message.warning("请先选择文件");
      return;
    }
    setUploading(true);

    const uploadSingleFile = async (file: UploadFile): Promise<void> => {
      if (!file.originFileObj) return;

      const updateProgress = (percent: number) => {
        setUploadProgress((prev: Record<string, number>) => ({ ...prev, [file.uid]: percent }));
      };

      try {
        // Small files (< 2MB) upload directly
        if (file.originFileObj.size <= 2 * 1024 * 1024) {
          const formData = new FormData();
          formData.append("files", file.originFileObj);

          await adminApi.post(
            `/admin/community-join-applications/${uploadTargetId}/materials`,
            formData,
            {
              timeout: 3600000, // 1 hour for large file uploads
              onUploadProgress: (evt: any) => {
                if (evt.total) {
                  updateProgress(Math.round((evt.loaded * 100) / evt.total));
                }
              }
            }
          );
        } else {
          // Large files upload in chunks
          const uploadId = `${Date.now()}_${Math.random().toString(36).slice(2)}`;
          const totalChunks = Math.ceil(file.originFileObj.size / CHUNK_SIZE);

          // Upload all chunks with concurrency control
          const uploadChunk = async (index: number): Promise<void> => {
            const start = index * CHUNK_SIZE;
            const end = Math.min(start + CHUNK_SIZE, file.originFileObj!.size);
            const chunk = file.originFileObj!.slice(start, end);

            const formData = new FormData();
            formData.append("chunk", chunk, `${file.name}.part${index}`);
            formData.append("upload_id", uploadId);
            formData.append("chunk_index", String(index));
            formData.append("total_chunks", String(totalChunks));

            await adminApi.post(
              `/admin/community-join-applications/${uploadTargetId}/materials/chunk`,
              formData,
              {
                timeout: 3600000, // 1 hour for chunk uploads
                onUploadProgress: (evt: any) => {
                  if (evt.total) {
                    const completedRatio = index / totalChunks;
                    const currentRatio = (evt.loaded / evt.total) / totalChunks;
                    updateProgress(Math.round((completedRatio + currentRatio) * 100));
                  }
                }
              }
            );
          };

          // Upload chunks with concurrency control
          const indices = Array.from({ length: totalChunks }, (_, i) => i);
          
          // Process chunks in batches with concurrency limit
          for (let i = 0; i < indices.length; i += CONCURRENCY) {
            const batch = indices.slice(i, i + CONCURRENCY);
            await Promise.all(batch.map(index => uploadChunk(index)));
            
            // Update progress after each batch
            const completedChunks = Math.min(i + CONCURRENCY, totalChunks);
            updateProgress(Math.round((completedChunks / totalChunks) * 90));
          }

          // Update progress to 95% before merge
          updateProgress(95);

          // Merge chunks
          await adminApi.post(
            `/admin/community-join-applications/${uploadTargetId}/materials/merge`,
            {
              upload_id: uploadId,
              file_name: file.name,
              total_chunks: totalChunks
            },
            {
              timeout: 3600000 // 1 hour for merge operation
            }
          );

          // Update progress to 100% after successful merge
          updateProgress(100);
        }

      } catch (err) {
        updateProgress(0);
        throw err;
      }
    };

    // Upload all files concurrently
    const results = await Promise.allSettled(fileList.map((f: UploadFile) => uploadSingleFile(f)));

    const successCount = results.filter((r: PromiseSettledResult<void>) => r.status === "fulfilled").length;
    const failCount = results.filter((r: PromiseSettledResult<void>) => r.status === "rejected").length;

    setUploading(false);

    if (successCount > 0) {
      message.success(`${successCount} 个文件上传成功`);
    }

    if (failCount > 0) {
      const errors = results
        .filter((r: PromiseSettledResult<void>): r is PromiseRejectedResult => r.status === "rejected")
        .map((r: PromiseRejectedResult) => String(r.reason));
      message.error(`${failCount} 个文件上传失败: ${errors[0]}`);
    }

    if (successCount > 0) {
      setUploadModalOpen(false);
      setFileList([]);
      setUploadProgress({});
      await loadItems();
      if (selectedItem?.id === uploadTargetId) {
        await loadDetail(uploadTargetId);
      }
    }
  };

  const handleDeleteMaterial = async (fileId: number): Promise<void> => {
    if (!selectedItem) return;
    try {
      await adminApi.delete(
        `/admin/community-join-applications/${selectedItem.id}/materials/${fileId}`
      );
      message.success("文件已删除");
      await loadDetail(selectedItem.id);
      await loadItems();
    } catch (err: unknown) {
      const detail =
        typeof err === "object" && err && "response" in err
          ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
          : undefined;
      message.error(detail || "删除失败");
    }
  };

  const handleDownloadMaterial = async (fileId: number, fileName: string): Promise<void> => {
    if (!selectedItem) return;
    try {
      await downloadAuthorizedFile(
        `/admin/community-join-applications/${selectedItem.id}/materials/${fileId}/download`,
        fileName
      );
    } catch {
      message.error("下载失败");
    }
  };

  const uploadProps: UploadProps = {
    multiple: true,
    fileList,
    beforeUpload: (file, newList) => {
      const currentCount = fileList.length + newList.length;
      if (currentCount > MAX_FILES) {
        message.warning(`最多上传 ${MAX_FILES} 个文件`);
        return Upload.LIST_IGNORE;
      }
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
      const allowed = ["jpg", "jpeg", "png", "gif", "webp", "bmp", "pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "zip", "rar", "7z", "txt"];
      if (!allowed.includes(ext)) {
        message.error(`不支持的文件类型 .${ext}`);
        return Upload.LIST_IGNORE;
      }
      if (file.size > 10 * 1024 * 1024) {
        message.error(`${file.name} 超出 10 MB 限制`);
        return Upload.LIST_IGNORE;
      }
      return false;
    },
    onChange: ({ fileList: newFileList }) => {
      setFileList(newFileList);
    },
    onRemove: (file) => {
      setFileList((prev) => prev.filter((f) => f.uid !== file.uid));
      setUploadProgress((prev) => {
        const next = { ...prev };
        delete next[file.uid];
        return next;
      });
    },
  };

  const columns: ColumnsType<CommunityJoinApplicationListItem> = [
    {
      title: "提交人",
      key: "submitter",
      width: 160,
      render: (_, record) => (
        <div>
          <div>{record.site_user_name || "-"}</div>
          <div style={{ color: "#999", fontSize: 12 }}>{record.site_user_phone || "-"}</div>
        </div>
      ),
    },
    {
      title: "提交时间",
      dataIndex: "submitted_at",
      key: "submitted_at",
      width: 170,
      render: formatDateTime,
    },
    {
      title: "申请园区",
      dataIndex: "target_campus",
      key: "target_campus",
      width: 120,
      render: (v: string) => <Tag color="geekblue">{v}</Tag>,
    },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      width: 110,
      render: statusTag,
    },
    {
      title: "操作",
      key: "action",
      width: 160,
      fixed: "right",
      render: (_, record) => (
        <Space>
          <Button
            icon={<UploadOutlined />}
            size="small"
            onClick={() => openUploadModal(record.id)}
          >
            上传
          </Button>
          <Button
            icon={<EyeOutlined />}
            size="small"
            type="link"
            onClick={() => void openDetail(record)}
          >
            查看
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="admin-page">
      <Card className="admin-page-card">
        <div className="admin-toolbar">
          <div>
            <p className="admin-muted" style={{ marginBottom: 0 }}>
              按照提交人、提交时间、状态筛选社区入驻申请，并执行上传合同的操作
            </p>
          </div>
          <Space wrap>
            <input
              placeholder="提交人或手机号"
              style={{ height: 32, border: "1px solid #d9d9d9", borderRadius: 4, padding: "0 8px", width: 180 }}
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { setPage(1); void loadItems(1); } }}
            />
            <Select
              allowClear
              placeholder="申请园区"
              style={{ width: 120 }}
              value={campusFilter}
              options={campusOptions}
              onChange={(v) => setCampusFilter(v)}
            />
            <Select
              allowClear
              placeholder="状态筛选"
              style={{ width: 120 }}
              value={statusFilter}
              options={statusOptions}
              onChange={(v) => setStatusFilter(v)}
            />
            <RangePicker
              value={dateRange as never}
              onChange={(v) => setDateRange(v as [dayjs.Dayjs | null, dayjs.Dayjs | null] | null)}
            />
            <Button
              icon={<ReloadOutlined />}
              onClick={() => { setPage(1); void loadItems(1); }}
            >
              刷新
            </Button>
          </Space>
        </div>
      </Card>

      <Card className="admin-page-card">
        <Table
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={items}
          scroll={{ x: 800 }}
          pagination={{
            current: page,
            pageSize: 10,
            total,
            onChange: (p) => { setPage(p); void loadItems(p); },
          }}
        />
      </Card>

      <Drawer
        width={860}
        title={selectedItem ? `申请详情 - ${selectedItem.site_user_name || selectedItem.site_user_phone || "未知"}` : "申请详情"}
        open={!!selectedItem}
        onClose={() => { setSelectedItem(null); setDetail(null); }}
        extra={
          selectedItem ? (
            <Button icon={<UploadOutlined />} type="primary" onClick={() => openUploadModal(selectedItem.id)}>
              上传材料
            </Button>
          ) : null
        }
      >
        {detailLoading || !detail ? (
          <div style={{ color: "#999", padding: 24 }}>正在加载详情...</div>
        ) : (
          <Space direction="vertical" size={16} style={{ width: "100%" }}>
            <Card size="small" title="申请人信息">
              <Descriptions bordered column={2} size="small">
                <Descriptions.Item label="提交人">{detail.site_user_name || "-"}</Descriptions.Item>
                <Descriptions.Item label="手机号">{detail.site_user_phone || "-"}</Descriptions.Item>
                <Descriptions.Item label="申请园区">
                  <Tag color="geekblue">{detail.target_campus}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="状态">{statusTag(detail.status)}</Descriptions.Item>
                <Descriptions.Item label="提交时间" span={2}>{formatDateTime(detail.submitted_at)}</Descriptions.Item>
              </Descriptions>
            </Card>

            <Card
              size="small"
              title={`材料列表（${detail.materials.length} 个）`}
              extra={
                <Button size="small" icon={<UploadOutlined />} onClick={() => openUploadModal(detail.id)}>
                  上传材料
                </Button>
              }
            >
              {detail.materials.length === 0 ? (
                <div style={{ color: "#999", padding: "8px 0" }}>暂无材料，请通过上传按钮上传合同或相关文件</div>
              ) : (
                detail.materials.map((material: CommunityJoinMaterialFile) => (
                  <div
                    key={material.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 12,
                      padding: "10px 0",
                      borderBottom: "1px solid #f0f0f0",
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 500 }}>{material.original_file_name}</div>
                      <div style={{ color: "#999", fontSize: 12, marginTop: 2 }}>
                        {formatFileSize(material.file_size)} · {formatDateTime(material.uploaded_at)}
                      </div>
                    </div>
                    <Space>
                      <Button
                        icon={<DownloadOutlined />}
                        size="small"
                        onClick={() => void handleDownloadMaterial(material.id, material.original_file_name)}
                      >
                        下载
                      </Button>
                      <Button
                        danger
                        icon={<DeleteOutlined />}
                        size="small"
                        onClick={() => {
                          Modal.confirm({
                            title: "确认删除",
                            content: `确认删除文件"${material.original_file_name}"？`,
                            okText: "删除",
                            okType: "danger",
                            cancelText: "取消",
                            onOk: () => void handleDeleteMaterial(material.id),
                          });
                        }}
                      >
                        删除
                      </Button>
                    </Space>
                  </div>
                ))
              )}
            </Card>

            <Card size="small" title="操作日志">
              {detail.action_logs.length === 0 ? (
                <div style={{ color: "#999", padding: "8px 0" }}>暂无操作日志</div>
              ) : (
                detail.action_logs.map((log: CommunityJoinActionLog) => (
                  <div
                    key={log.id}
                    style={{ padding: "8px 0", borderBottom: "1px solid #f5f5f5", fontSize: 13 }}
                  >
                    <span style={{ color: "#999", marginRight: 12 }}>{formatDateTime(log.operated_at)}</span>
                    <span style={{ marginRight: 8 }}>{log.action_summary}</span>
                    {log.action_detail ? (
                      <span style={{ color: "#666" }}>— {log.action_detail}</span>
                    ) : null}
                    {log.operated_by_name ? (
                      <span style={{ color: "#aaa", fontSize: 12, marginLeft: 8 }}>by {log.operated_by_name}</span>
                    ) : null}
                  </div>
                ))
              )}
            </Card>
          </Space>
        )}
      </Drawer>

      <Modal
        title="上传材料"
        open={uploadModalOpen}
        onCancel={() => { if (!uploading) { setUploadModalOpen(false); setFileList([]); setUploadProgress({}); } }}
        footer={[
          <Button
            key="cancel"
            disabled={uploading}
            onClick={() => { setUploadModalOpen(false); setFileList([]); setUploadProgress({}); }}
          >
            取消
          </Button>,
          <Button
            key="upload"
            type="primary"
            loading={uploading}
            icon={<UploadOutlined />}
            disabled={fileList.length === 0}
            onClick={() => void handleUpload()}
          >
            {uploading ? `上传中 (${fileList.length} 个)` : `开始上传 (${fileList.length} 个)`}
          </Button>,
        ]}
        width={600}
      >
        <div style={{ marginBottom: 12, color: "#666", fontSize: 13 }}>{ALLOWED_TYPES_HINT}</div>
        <Dragger {...uploadProps} style={{ marginBottom: 8 }}>
          <p className="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p className="ant-upload-text">点击或拖拽文件到此处上传</p>
          <p className="ant-upload-hint">支持批量上传，最多 {MAX_FILES} 个文件</p>
        </Dragger>

        {fileList.length > 0 && uploading && (
          <div style={{ marginTop: 12 }}>
            {fileList.map((f) => (
              <div key={f.uid} style={{ marginBottom: 6 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                  <span style={{ color: "#333", maxWidth: "70%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {f.name}
                  </span>
                  <span style={{ color: "#1677ff" }}>{uploadProgress[f.uid] ?? 0}%</span>
                </div>
                <div style={{ height: 4, background: "#f0f0f0", borderRadius: 2, marginTop: 3 }}>
                  <div
                    style={{
                      height: "100%",
                      width: `${uploadProgress[f.uid] ?? 0}%`,
                      background: "#1677ff",
                      borderRadius: 2,
                      transition: "width 0.2s",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
}
