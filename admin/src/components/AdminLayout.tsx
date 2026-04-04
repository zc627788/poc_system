import {
  AppstoreOutlined,
  DatabaseOutlined,
  FileTextOutlined,
  HomeOutlined,
  LogoutOutlined,
  MessageOutlined,
  NotificationOutlined,
  PictureOutlined,
  SettingOutlined,
  TagsOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { PageContainer, ProLayout } from "@ant-design/pro-components";
import { Button } from "antd";
import type { ReactElement } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { clearToken } from "../api";

type MenuItem = {
  path?: string;
  name: string;
  icon?: ReactElement;
  children?: MenuItem[];
};

const menuItems: MenuItem[] = [
  {
    name: "系统",
    icon: <SettingOutlined />,
    children: [
      { path: "/dashboard", name: "工作台", icon: <HomeOutlined /> },
      { path: "/content/site-settings", name: "站点设置", icon: <SettingOutlined /> },
    ],
  },
  {
    name: "用户中心",
    icon: <TeamOutlined />,
    children: [{ path: "/users/site-users", name: "前台用户", icon: <TeamOutlined /> }],
  },
  {
    name: "首页",
    icon: <HomeOutlined />,
    children: [
      { path: "/content/banners", name: "首页 Banner", icon: <PictureOutlined /> },
      { path: "/content/page-sections/home", name: "首页区块", icon: <FileTextOutlined /> },
      { path: "/content/home-services", name: "首页服务入口", icon: <AppstoreOutlined /> },
    ],
  },
  {
    name: "内容页",
    icon: <FileTextOutlined />,
    children: [
      { path: "/content/articles", name: "最新动态列表", icon: <NotificationOutlined /> },
      { path: "/content/page-sections/news", name: "最新动态页头", icon: <FileTextOutlined /> },
      { path: "/content/page-sections/community", name: "社区简介页", icon: <FileTextOutlined /> },
      { path: "/content/page-sections/services", name: "创业服务页", icon: <FileTextOutlined /> },
      { path: "/content/page-sections/setup", name: "OPC 开办页", icon: <FileTextOutlined /> },
      { path: "/content/page-sections/financing", name: "融资对接页", icon: <FileTextOutlined /> },
      { path: "/content/page-sections/settlement", name: "安居落户页", icon: <FileTextOutlined /> },
    ],
  },
  {
    name: "资源集市",
    icon: <DatabaseOutlined />,
    children: [
      { path: "/content/resource-categories", name: "资源分类", icon: <TagsOutlined /> },
      { path: "/content/resource-items", name: "资源条目", icon: <DatabaseOutlined /> },
      { path: "/content/page-sections/marketplace", name: "资源集市页头", icon: <FileTextOutlined /> },
      { path: "/content/page-sections/api_market", name: "API 市场页头", icon: <FileTextOutlined /> },
      { path: "/content/page-sections/mcp_market", name: "MCP 市场页头", icon: <FileTextOutlined /> },
    ],
  },
  {
    name: "反馈中心",
    icon: <MessageOutlined />,
    children: [{ path: "/content/feedbacks", name: "意见反馈", icon: <MessageOutlined /> }],
  },
];

function collectLeafMenus(items: MenuItem[]): MenuItem[] {
  const leafs: MenuItem[] = [];
  items.forEach((item) => {
    if (item.children && item.children.length > 0) {
      leafs.push(...collectLeafMenus(item.children));
      return;
    }
    if (item.path) {
      leafs.push(item);
    }
  });
  return leafs;
}

export function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const leafMenus = collectLeafMenus(menuItems);
  const currentTitle = leafMenus.find((item) => item.path === location.pathname)?.name || "内容管理";

  const handleLogout = () => {
    clearToken();
    navigate("/login", { replace: true });
  };

  return (
    <div className="admin-layout">
      <ProLayout
        fixSiderbar
        fixedHeader
        location={{ pathname: location.pathname }}
        logo={false}
        menuHeaderRender={() => (
          <button className="opc-admin-menu-header" onClick={() => navigate("/dashboard")} type="button">
            <span className="opc-admin-menu-header-mark">OPC</span>
            <span className="opc-admin-menu-header-title">OPC CMS</span>
          </button>
        )}
        menuFooterRender={() => (
          <div style={{ padding: 16, color: "#64748b", fontSize: 12, lineHeight: 1.8 }}>
            站点内容、前台用户与意见反馈均可在后台统一维护。
            <br />
            前台注册、登录、反馈提交与后台用户管理、反馈处理保持同步联动。
          </div>
        )}
        route={{ routes: menuItems }}
        siderWidth={256}
        title="OPC CMS"
        actionsRender={() => [
          <Button key="logout" icon={<LogoutOutlined />} onClick={handleLogout} type="text">
            退出登录
          </Button>,
        ]}
        menuItemRender={(item, dom) => {
          if (item.children && item.children.length > 0) {
            return dom;
          }
          return (
            <a
              onClick={(event) => {
                event.preventDefault();
                if (item.path) {
                  navigate(item.path);
                }
              }}
            >
              {dom}
            </a>
          );
        }}
      >
        <PageContainer
          breadcrumb={{ items: [{ title: "后台管理" }, { title: currentTitle }] }}
          content="统一维护门户内容、前台用户与意见反馈。"
          title={currentTitle}
        >
          <Outlet />
        </PageContainer>
      </ProLayout>
    </div>
  );
}
