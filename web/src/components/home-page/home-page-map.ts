/**
 * 首页代码索引
 *
 * 入口：
 * - `web/src/app/page.tsx`：首页路由入口，含 metadata 与结构化数据 script，勿随意改动
 * - `web/src/components/home-page-view.tsx`：兼容导出入口
 * - `web/src/components/home-page/home-page-view.tsx`：首页真实主装配文件
 *
 * 从上到下的 section：
 * - Hero：`sections/home-hero-section.tsx`
 * - 最新动态：`sections/home-news-section.tsx`
 * - 社区简介 + 创业服务：`sections/home-community-services-section.tsx`
 * - 资源集市总装配：`sections/home-marketplace-section.tsx`
 * - 场景供需：`sections/home-scenario-section.tsx`
 *
 * 资源集市子区块：
 * - 数据资源：`sections/marketplace-data-section.tsx`
 * - 工具包：`sections/marketplace-tools-section.tsx`
 * - 普惠算力：`sections/marketplace-compute-section.tsx`
 *
 * 资源集市卡片：
 * - Featured 大卡：`cards/data-resource-featured-card.tsx`
 * - Summary 小卡：`cards/data-resource-summary-card.tsx`
 * - 工具包卡：`cards/toolkit-resource-card.tsx`
 * - 算力说明卡：`cards/compute-summary-card.tsx`
 * - GPU 商品卡：`cards/compute-product-card.tsx`
 *
 * 首页共享层：
 * - 类型：`home-page-types.ts`
 * - 首页常量：`home-page-data.ts`
 * - helper：`home-page-helpers.ts`
 * - 数据整理 / mapper：`home-page-mappers.ts`
 * - 内部共享组件：`shared/floating-button.tsx`、`shared/home-cms-icon.tsx`
 * - 跳转后回顶部链接：`../scroll-to-top-link.tsx`
 *
 * 修改原则：
 * - 先找对应 section，再找 section 内 card
 * - 不要把首页所有卡片抽成一种万能 card
 * - 保持现有展示顺序、链接行为、外链/内链逻辑不变
 * - `app/page.tsx` 内可能承载 SEO、部署、单点登录或其他接入点，非必要不要动
 */
export {};
