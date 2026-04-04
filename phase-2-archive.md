# 阶段 2 归档

## 版本说明

- 名称：`阶段2-首页闭环版`
- 日期：`2026-04-04`

## 本阶段验收范围

本阶段只验首页闭环，不包含阶段 3 内容页开发。

已纳入：

- 首页头部与页脚
- Hero Banner
- 最新动态 Tab 摘要
- 社区简介摘要
- 创业服务入口
- AI资源集市摘要
- 场景供需对接宣传位
- 首页相关 CMS 管理
- `Next.js 15` SEO 基础能力

明确不纳入：

- 最新动态完整列表页
- 社区简介详情页
- 创业服务详情页
- `OPC 开办 / 融资对接 / 安居落户` 详情页
- 资源集市完整模块
- `API 市场 / MCP 市场`
- 意见反馈流程

## 阶段 2 动态模块

这些模块会直接映射到当前首页：

1. `site_settings`
用途：头部 Logo、站点标题、SEO 基础信息、页脚版权。

2. `banners`
用途：首页首屏 Banner 的主标题、副标题、焦点标题、描述、图片和跳转。

3. `articles`
用途：首页“最新动态”四个 Tab 的摘要列表。

4. `page_sections`
用途：首页区块文案，目前主要用于：
- `community_intro`
- `marketplace_summary`
- `scenario_1`
- `scenario_2`
- `scenario_3`

5. `service_items`
用途：首页“创业服务”右侧四张服务入口卡片。

## 前端实现状态

- `web` 已迁移为 `Next.js 15 + App Router`
- 首页按原型的 `container mx-auto px-4` 适配方式实现
- 首页为真实数据驱动
- 非首页路由仍保持阶段 2 占位状态

关键文件：

- [layout.tsx](C:/Users/Jackson%20Chan/Desktop/OPC项目原型图20260330/web/src/app/layout.tsx)
- [page.tsx](C:/Users/Jackson%20Chan/Desktop/OPC项目原型图20260330/web/src/app/page.tsx)
- [home-page-view.tsx](C:/Users/Jackson%20Chan/Desktop/OPC项目原型图20260330/web/src/components/home-page-view.tsx)
- [site-header.tsx](C:/Users/Jackson%20Chan/Desktop/OPC项目原型图20260330/web/src/components/site-header.tsx)
- [site-footer.tsx](C:/Users/Jackson%20Chan/Desktop/OPC项目原型图20260330/web/src/components/site-footer.tsx)
- [tailwind.config.js](C:/Users/Jackson%20Chan/Desktop/OPC项目原型图20260330/web/tailwind.config.js)

## 后端与 CMS 状态

- 已保留首页所需的公共接口
- 已切换为“数据库真实内容 + 后台维护”为主，不再依赖 seed 重置
- 后台当前只开放阶段 2 首页闭环相关页面

关键文件：

- [init_db.py](C:/Users/Jackson%20Chan/Desktop/OPC项目原型图20260330/server/init_db.py)
- [site.py](C:/Users/Jackson%20Chan/Desktop/OPC项目原型图20260330/server/app/api/public/site.py)
- [content.py](C:/Users/Jackson%20Chan/Desktop/OPC项目原型图20260330/server/app/api/admin/content.py)
- [AdminLayout.tsx](C:/Users/Jackson%20Chan/Desktop/OPC项目原型图20260330/admin/src/components/AdminLayout.tsx)
- [DashboardPage.tsx](C:/Users/Jackson%20Chan/Desktop/OPC项目原型图20260330/admin/src/pages/DashboardPage.tsx)

## 本阶段完成后的约束

- 不把占位页视为已开发页面
- 不提前把阶段 3 内容算入阶段 2 验收
- 后续继续开发时，应从“内容页闭环”作为下一阶段正式起点
