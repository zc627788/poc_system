import {
  AppstoreOutlined,
  DatabaseOutlined,
  FileTextOutlined,
  MessageOutlined,
  NotificationOutlined,
  PictureOutlined,
  SettingOutlined,
  TagsOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { Alert, Card } from "antd";
import { Link } from "react-router-dom";

const quickLinks = [
  {
    title: "站点设置",
    icon: <SettingOutlined />,
    description: "维护站点名称、Logo、页脚版权与联系方式。",
    to: "/content/site-settings",
  },
  {
    title: "首页 Banner",
    icon: <PictureOutlined />,
    description: "维护首页首屏 Banner、标题说明和跳转配置。",
    to: "/content/banners",
  },
  {
    title: "最新动态",
    icon: <NotificationOutlined />,
    description: "维护新闻、政策、文章和通知内容。",
    to: "/content/articles",
  },
  {
    title: "首页服务入口",
    icon: <AppstoreOutlined />,
    description: "维护首页服务入口卡片与跳转方式。",
    to: "/content/home-services",
  },
  {
    title: "前台用户",
    icon: <TeamOutlined />,
    description: "查看前台注册用户，支持搜索、启停和密码重置。",
    to: "/users/site-users",
  },
  {
    title: "资源分类",
    icon: <TagsOutlined />,
    description: "维护资源集市、API 市场和 MCP 市场的分类结构。",
    to: "/content/resource-categories",
  },
  {
    title: "资源条目",
    icon: <DatabaseOutlined />,
    description: "维护资源卡片内容、价格、标签与扩展字段。",
    to: "/content/resource-items",
  },
  {
    title: "意见反馈",
    icon: <MessageOutlined />,
    description: "集中处理前台用户提交的意见反馈与回复状态。",
    to: "/content/feedbacks",
  },
  {
    title: "内容页区块",
    icon: <FileTextOutlined />,
    description: "维护社区简介、创业服务、开办、融资和安居等页面区块。",
    to: "/content/page-sections/community",
  },
];

export function DashboardPage() {
  return (
    <div className="admin-page">
      <Card className="admin-page-card">
        <h2 style={{ marginTop: 0, marginBottom: 10, fontSize: 28 }}>运营工作台</h2>
        <p className="admin-muted" style={{ marginTop: 0, maxWidth: 920 }}>
          这里集中管理门户内容、资源数据、前台用户与意见反馈，前台页面展示会实时读取接口结果并同步更新。
        </p>

        <Alert
          description="建议优先维护站点设置、首页 Banner、首页服务入口和内容页区块；前台注册用户与反馈提交后，也会同步出现在用户中心和反馈中心。"
          message="使用提示"
          showIcon
          type="info"
        />
      </Card>

      <div className="admin-stat-grid">
        <div className="admin-stat-card">
          <span>内容管理</span>
          <strong>6+</strong>
          <span>首页、动态页、内容页与市场页均支持动态维护</span>
        </div>
        <div className="admin-stat-card">
          <span>前台账户</span>
          <strong>Phone</strong>
          <span>前台用户使用手机号注册与登录</span>
        </div>
        <div className="admin-stat-card">
          <span>反馈处理</span>
          <strong>Closed Loop</strong>
          <span>支持提交、查看、处理与回复</span>
        </div>
        <div className="admin-stat-card">
          <span>渲染方式</span>
          <strong>SSR</strong>
          <span>Web 端基于 Next.js 15 服务端取数，兼顾 SEO</span>
        </div>
      </div>

      <div className="admin-grid-3">
        {quickLinks.map((item) => (
          <Link className="admin-link-card" key={item.title} to={item.to}>
            <div style={{ color: "#0052d9", fontSize: 18 }}>{item.icon}</div>
            <h3>{item.title}</h3>
            <p>{item.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
