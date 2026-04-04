# 阶段 5 归档

## 阶段名称

反馈闭环与后台分组治理阶段

## 本阶段目标

1. 完成意见反馈前后台闭环
2. 后台导航按业务分组重构，降低使用门槛
3. 前台反馈页按原型适配策略还原

## 完成内容

### 前台 Web

- `feedback` 路由不再占位，改为真实页面
- 页面结构按原型实现：
- 顶部蓝色说明区
- 面包屑
- 主题 / 内容 / 电话 / 附件名称表单
- 提交按钮与状态提示
- 表单提交直连后端 `POST /api/public/feedbacks`

关键文件：

- [feedback-page.tsx](C:/Users/Jackson%20Chan/Desktop/OPC项目原型图20260330/web/src/components/feedback-page.tsx)
- [page.tsx](C:/Users/Jackson%20Chan/Desktop/OPC项目原型图20260330/web/src/app/[...slug]/page.tsx)
- [placeholder-routes.ts](C:/Users/Jackson%20Chan/Desktop/OPC项目原型图20260330/web/src/lib/placeholder-routes.ts)

### 后端 Server

- 新增 `feedbacks` 数据表模型
- 新增前台提交接口 `POST /api/public/feedbacks`
- 新增后台管理接口：
- `GET /api/admin/feedbacks`
- `PUT /api/admin/feedbacks/{id}`
- 支持状态流转：`pending / processing / resolved / rejected`
- 记录处理人、处理时间、处理回复

关键文件：

- [feedback.py](C:/Users/Jackson%20Chan/Desktop/OPC项目原型图20260330/server/app/models/feedback.py)
- [site.py](C:/Users/Jackson%20Chan/Desktop/OPC项目原型图20260330/server/app/api/public/site.py)
- [content.py](C:/Users/Jackson%20Chan/Desktop/OPC项目原型图20260330/server/app/api/admin/content.py)
- [content.py](C:/Users/Jackson%20Chan/Desktop/OPC项目原型图20260330/server/app/schemas/content.py)
- [site.py](C:/Users/Jackson%20Chan/Desktop/OPC项目原型图20260330/server/app/schemas/site.py)
- [database.py](C:/Users/Jackson%20Chan/Desktop/OPC项目原型图20260330/server/app/core/database.py)
- [__init__.py](C:/Users/Jackson%20Chan/Desktop/OPC项目原型图20260330/server/app/models/__init__.py)

### 后台 Admin

- 新增意见反馈管理页
- 支持按状态筛选、查看详情、更新状态、填写处理回复
- 侧边栏重构为分组导航：
- 系统
- 首页
- 内容页
- 资源集市
- 反馈中心
- 顶部阶段标识升级为 `Stage 5`

关键文件：

- [FeedbacksPage.tsx](C:/Users/Jackson%20Chan/Desktop/OPC项目原型图20260330/admin/src/pages/FeedbacksPage.tsx)
- [index.tsx](C:/Users/Jackson%20Chan/Desktop/OPC项目原型图20260330/admin/src/router/index.tsx)
- [AdminLayout.tsx](C:/Users/Jackson%20Chan/Desktop/OPC项目原型图20260330/admin/src/components/AdminLayout.tsx)
- [DashboardPage.tsx](C:/Users/Jackson%20Chan/Desktop/OPC项目原型图20260330/admin/src/pages/DashboardPage.tsx)
- [types.ts](C:/Users/Jackson%20Chan/Desktop/OPC项目原型图20260330/admin/src/types.ts)

## 动态模块范围（阶段 5）

- 站点设置
- 首页 Banner
- 最新动态列表
- 页面区块
- 首页服务入口
- 资源分类
- 资源条目
- 意见反馈（新增）

## 备注

- 阶段 5 首版附件处理策略为“记录附件名称”，暂不做真实文件上传
- 真实上传能力可在后续阶段扩展为对象存储或本地文件服务
