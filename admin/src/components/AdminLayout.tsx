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
  ShoppingOutlined,
} from "@ant-design/icons";
import { ProLayout } from "@ant-design/pro-components";
import { Breadcrumb, Button } from "antd";
import type { ReactElement } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { clearToken } from "../api";

type MenuItem = {
  path?: string;
  name: string;
  icon?: ReactElement;
  description?: string;
  children?: MenuItem[];
};

const menuItems: MenuItem[] = [
  {
    name: "首页",
    icon: <HomeOutlined />,
    children: [
      { path: "/home/overview", name: "首页总览", icon: <HomeOutlined />, description: "按前台首页从上到下快速找到每个位置的维护入口。" },
      { path: "/home/banners", name: "轮播图", icon: <PictureOutlined />, description: "维护首页首屏轮播图、图片和跳转内容。" },
      { path: "/home/service-entries", name: "创业服务入口", icon: <AppstoreOutlined />, description: "维护首页创业服务快捷入口卡片。" },
    ],
  },
  {
    name: "最新动态",
    icon: <NotificationOutlined />,
    children: [
      { path: "/news/articles", name: "动态列表", icon: <NotificationOutlined />, description: "维护活动、政策、文章、申报通知等内容，首页最新动态也从这里读取。" },
    ],
  },
  {
    name: "社区简介",
    icon: <FileTextOutlined />,
    children: [
      { path: "/community/content", name: "页面内容", icon: <FileTextOutlined />, description: "维护社区简介页面头部、介绍、统计、基地信息和入驻条件。" },
    ],
  },
  {
    name: "创业服务",
    icon: <FileTextOutlined />,
    children: [
      { path: "/services/content", name: "创业服务页", icon: <FileTextOutlined />, description: "维护创业服务页面头部、政策筛选、政策列表和配套服务。" },
      { path: "/services/financing", name: "融资对接", icon: <FileTextOutlined />, description: "维护融资对接页面。" },
      { path: "/services/settlement", name: "安居落户", icon: <FileTextOutlined />, description: "维护安居落户页面。" },
    ],
  },
  {
    name: "资源市集",
    icon: <DatabaseOutlined />,
    children: [
      { path: "/marketplace/data", name: "数据资源", icon: <TagsOutlined />, description: "维护数据资源分类卡片，首页 AI资源市集也会读取。" },
      { path: "/marketplace/tools", name: "产品工具", icon: <AppstoreOutlined />, description: "维护产品工具页的固定入口，包括热门推荐、AI编程工具、AI办公套件和大模型服务。" },
      { path: "/marketplace/compute", name: "普惠算力", icon: <DatabaseOutlined />, description: "维护普惠算力主卡和算力资源条目。" },
    ],
  },
  {
    name: "交易管理",
    icon: <ShoppingOutlined />,
    children: [
      { path: "/billing/products", name: "商品管理", icon: <ShoppingOutlined />, description: "维护按月服务和固定面额预充值商品。" },
      { path: "/billing/orders", name: "订单管理", icon: <ShoppingOutlined />, description: "查询用户订单、金额和商品快照。" },
      { path: "/billing/reconciliations", name: "支付对账", icon: <ShoppingOutlined />, description: "按日拉取支付账单，查看金额、状态和单边差异。" },
      { path: "/billing/consumption-imports", name: "消费导入", icon: <ShoppingOutlined />, description: "下载模板、上传消费 Excel、预览校验并确认导入。" },
      { path: "/billing/consumptions", name: "消费明细", icon: <ShoppingOutlined />, description: "查询已导入消费记录和筛选范围消费合计。" },
      { path: "/billing/balances", name: "服务额度", icon: <ShoppingOutlined />, description: "按用户和服务查看预充值服务额度与负余额告警。" },
      { path: "/billing/wallet-recharges", name: "钱包充值单", icon: <ShoppingOutlined />, description: "查询用户钱包充值订单与支付状态。" },
      { path: "/billing/wallet-ledger", name: "钱包流水", icon: <ShoppingOutlined />, description: "查询现金钱包充值入账与余额购单扣款。" },
    ],
  },
  {
    name: "意见反馈",
    icon: <MessageOutlined />,
    children: [{ path: "/feedback/list", name: "反馈列表", icon: <MessageOutlined />, description: "处理前台用户提交的意见反馈和回复状态。" }],
  },
  {
    name: "申请管理",
    icon: <FileTextOutlined />,
    children: [{ path: "/application/list", name: "OPC工商注册申请", icon: <FileTextOutlined />, description: "处理 OPC 开办申请列表、状态审核、缺材料标记和附件查看。" }, { path: "/application/community-join", name: "社区入驻申请", icon: <FileTextOutlined />, description: "处理社区入驻申请列表、上传合同。" }, { path: "/application/trusted-data-space", name: "可信数据空间注册", icon: <DatabaseOutlined />, description: "查看可信数据空间企业账号创建进度并刷新状态。" }],
  },
  {
    name: "系统设置",
    icon: <SettingOutlined />,
    children: [
      { path: "/settings/site", name: "站点设置", icon: <SettingOutlined />, description: "维护站点名称、Logo、页脚版权与联系方式。" },
      { path: "/settings/site-users", name: "前台用户", icon: <TeamOutlined />, description: "管理前台注册用户和账号状态。" },
    ],
  },
];

function findMenuTrail(items: MenuItem[], pathname: string, parents: MenuItem[] = []): MenuItem[] {
  for (const item of items) {
    const nextParents = [...parents, item];
    if (item.path === pathname) {
      return nextParents;
    }
    if (item.children) {
      const match = findMenuTrail(item.children, pathname, nextParents);
      if (match.length > 0) {
        return match;
      }
    }
  }
  return [];
}

export function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const currentTrail = findMenuTrail(menuItems, location.pathname);

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
          <button className="opc-admin-menu-header" onClick={() => navigate("/home/overview")} type="button">
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
        <div style={{ padding: "20px 24px 0" }}>
          <Breadcrumb items={[{ title: "后台管理" }, ...currentTrail.map((item) => ({ title: item.name }))]} />
        </div>
        <div style={{ padding: "12px 24px 24px" }}>
          <Outlet />
        </div>
      </ProLayout>
    </div>
  );
}
