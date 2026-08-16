import {
  AppstoreOutlined,
  ArrowRightOutlined,
  DatabaseOutlined,
  FileTextOutlined,
  MessageOutlined,
  NotificationOutlined,
  PictureOutlined,
} from "@ant-design/icons";
import { Button, Card, Tag } from "antd";
import { Link } from "react-router-dom";

type HomeModuleCard = {
  title: string;
  icon: JSX.Element;
  position: string;
  source: string;
  rule: string;
  primaryAction: { label: string; path: string };
  secondaryAction?: { label: string; path: string };
};

const homeModules: HomeModuleCard[] = [
  {
    title: "轮播图",
    icon: <PictureOutlined />,
    position: "首页顶部首屏",
    source: "首页轮播图内容",
    rule: "按排序展示已启用的轮播图；多张自动轮播，单张时不显示切换条。",
    primaryAction: { label: "编辑轮播图", path: "/home/banners" },
  },
  {
    title: "最新动态（首页展示）",
    icon: <NotificationOutlined />,
    position: "首页 > 最新动态",
    source: "最新动态内容",
    rule: "首页按分类展示最新动态，每个分类最多显示 4 条；完整内容在“最新动态”模块维护。",
    primaryAction: { label: "编辑动态列表", path: "/news/articles" },
  },
  {
    title: "社区简介（首页展示）",
    icon: <FileTextOutlined />,
    position: "首页 > 社区简介",
    source: "首页社区简介展示内容",
    rule: "控制首页社区简介卡片标题、简介和跳转；完整页面内容在“社区简介”模块维护。",
    primaryAction: { label: "编辑社区简介页", path: "/community/content" },
  },
  {
    title: "创业服务入口",
    icon: <AppstoreOutlined />,
    position: "首页 > 创业服务",
    source: "首页创业服务入口卡片",
    rule: "控制首页创业服务入口卡片的标题、简介、图标和排序。",
    primaryAction: { label: "编辑服务入口", path: "/home/service-entries" },
  },
  {
    title: "AI资源市集（首页展示）",
    icon: <DatabaseOutlined />,
    position: "首页 > AI资源市集",
    source: "首页资源市集展示内容",
    rule: "首页展示数据资源、工具包、普惠算力摘要；完整资源内容在“资源市集”模块维护。",
    primaryAction: { label: "进入资源市集", path: "/marketplace/content" },
  },
  {
    title: "意见反馈",
    icon: <MessageOutlined />,
    position: "首页 > 联系我们",
    source: "前台意见反馈 / 联系我们表单",
    rule: "收集前台用户提交的帮助诉求与联系信息，后台统一查看和处理。",
    primaryAction: { label: "查看反馈列表", path: "/feedback/list" },
  },
];

export function HomeOverviewPage() {
  return (
    <div className="admin-page">
      <Card className="admin-page-card">
        <h2 style={{ marginTop: 0, marginBottom: 8 }}>首页总览</h2>
        <p className="admin-muted" style={{ marginBottom: 0, maxWidth: 980 }}>
          这里按前台首页从上到下列出所有模块，帮助你快速定位“这个位置到底去哪里改”。总览页不直接保存内容，只提供清晰的配置入口。
        </p>
      </Card>

      <div className="admin-grid-3">
        {homeModules.map((item, index) => (
          <Card className="admin-page-card" key={item.title}>
            <div className="admin-overview-card-title">
              <span className="admin-overview-card-icon">{item.icon}</span>
              <div>
                <Tag color="blue">第 {index + 1} 屏</Tag>
                <h3>{item.title}</h3>
              </div>
            </div>
            <div className="admin-overview-card-meta">
              <strong>前台位置</strong>
              <span>{item.position}</span>
            </div>
            <div className="admin-overview-card-meta">
              <strong>数据来源</strong>
              <span>{item.source}</span>
            </div>
            <div className="admin-overview-card-meta">
              <strong>展示规则</strong>
              <span>{item.rule}</span>
            </div>
            <div className="admin-overview-card-actions">
              <Link to={item.primaryAction.path}>
                <Button icon={<ArrowRightOutlined />} type="primary">
                  {item.primaryAction.label}
                </Button>
              </Link>
              {item.secondaryAction ? (
                <Link to={item.secondaryAction.path}>
                  <Button>{item.secondaryAction.label}</Button>
                </Link>
              ) : null}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
