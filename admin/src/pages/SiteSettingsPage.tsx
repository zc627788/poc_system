import { Button, Card, Form, Input, message } from "antd";
import { useEffect, useState } from "react";
import { adminApi } from "../api";
import type { ApiResponse, SiteSettingsData } from "../types";

const defaultValues: SiteSettingsData = {
  site_name: "厦门 OPC 社区门户",
  site_subtitle: "成为一流的数智产业生态构建者",
  logo_url: "/prototype-assets/集团横板logo简称-01单色.png",
  footer_text: "© 2026 厦门 OPC 社区. All rights reserved.",
  contact_phone: "0592-123456",
  contact_email: "opc@example.com",
  icp_no: "闽ICP备2026000001号"
};

export function SiteSettingsPage() {
  const [form] = Form.useForm<SiteSettingsData>();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const response = await adminApi.get<ApiResponse<SiteSettingsData>>("/admin/site-settings");
        form.setFieldsValue(response.data.data);
      } catch (error) {
        console.error("Failed to load site settings", error);
        form.setFieldsValue(defaultValues);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [form]);

  const handleFinish = async (values: SiteSettingsData) => {
    setSaving(true);
    try {
      await adminApi.put<ApiResponse<SiteSettingsData>>("/admin/site-settings", values);
      message.success("站点设置已保存");
    } catch (error) {
      console.error("Failed to save site settings", error);
      message.error("站点设置保存失败");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="admin-page-card" loading={loading}>
      <Form
        form={form}
        initialValues={defaultValues}
        layout="vertical"
        onFinish={handleFinish}
        requiredMark={false}
      >
        <Form.Item label="站点名称" name="site_name" rules={[{ required: true, message: "请输入站点名称" }]}>
          <Input placeholder="请输入站点名称" />
        </Form.Item>
        <Form.Item
          label="站点副标题"
          name="site_subtitle"
          rules={[{ required: true, message: "请输入站点副标题" }]}
        >
          <Input placeholder="请输入站点副标题" />
        </Form.Item>
        <Form.Item hidden name="logo_url">
          <Input />
        </Form.Item>
        <Form.Item label="页脚文案" name="footer_text" rules={[{ required: true, message: "请输入页脚文案" }]}>
          <Input.TextArea placeholder="请输入页脚文案" rows={3} />
        </Form.Item>
        <Form.Item label="联系电话" name="contact_phone">
          <Input placeholder="请输入联系电话" />
        </Form.Item>
        <Form.Item label="联系邮箱" name="contact_email">
          <Input placeholder="请输入联系邮箱" />
        </Form.Item>
        <Form.Item label="备案号" name="icp_no">
          <Input placeholder="请输入备案号" />
        </Form.Item>

        <Button htmlType="submit" loading={saving} type="primary">
          保存站点设置
        </Button>
      </Form>
    </Card>
  );
}
