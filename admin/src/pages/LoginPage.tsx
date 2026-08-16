import { LockOutlined, UserOutlined } from "@ant-design/icons";
import { Button, Card, Form, Input, Typography, message } from "antd";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { adminApi, saveToken } from "../api";
import type { ApiResponse } from "../types";

type LoginResponse = {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: {
    id: number;
    username: string;
    name: string;
  };
};

export function LoginPage() {
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleFinish = async (values: { username: string; password: string }) => {
    setSubmitting(true);
    try {
      const response = await adminApi.post<ApiResponse<LoginResponse>>("/admin/auth/login", values);
      saveToken(response.data.data.access_token);
      message.success(`欢迎回来，${response.data.data.user.name}`);
      const nextPath =
        typeof location.state === "object" && location.state && "from" in location.state
          ? String(location.state.from)
          : "/home/overview";
      navigate(nextPath, { replace: true });
    } catch (error) {
      console.error("Login failed", error);
      message.error("登录失败，请检查账号或密码");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-shell">
        <div className="login-brand">
          <div className="login-brand-badge">OPC CMS</div>
          <h1>OPC 管理后台</h1>
          <p>后台统一维护前台页面内容、资源数据、前台用户和意见反馈，适合日常运营与交付后的持续更新。</p>

          <div className="login-highlights">
            <div className="login-highlight">
              <strong>前后台统一联动</strong>
              <span>前台手机号注册成功后，后台用户管理会立即出现对应记录，可直接启停或重置密码。</span>
            </div>
            <div className="login-highlight">
              <strong>反馈处理集中管理</strong>
              <span>前台登录用户提交反馈后，后台反馈中心可查看提交人、手机号、处理状态和回复内容。</span>
            </div>
          </div>
        </div>

        <Card className="login-card" variant="borderless">
          <Typography.Text type="secondary">OPC CMS</Typography.Text>
          <Typography.Title level={2} style={{ marginBottom: 8, marginTop: 12 }}>
            登录后台
          </Typography.Title>
          <Typography.Paragraph type="secondary">
            登录后将直接进入首页总览，可按前台页面位置快速找到对应维护入口。
          </Typography.Paragraph>

          <Form layout="vertical" onFinish={handleFinish} requiredMark={false}>
            <Form.Item label="账号" name="username" rules={[{ required: true, message: "请输入账号" }]}>
              <Input prefix={<UserOutlined />} placeholder="请输入账号" size="large" />
            </Form.Item>
            <Form.Item label="密码" name="password" rules={[{ required: true, message: "请输入密码" }]}>
              <Input.Password prefix={<LockOutlined />} placeholder="请输入密码" size="large" />
            </Form.Item>
            <Button block htmlType="submit" loading={submitting} size="large" type="primary">
              登录后台
            </Button>
          </Form>
        </Card>
      </div>
    </div>
  );
}
