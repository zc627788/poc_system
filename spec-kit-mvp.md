# OPC 门户项目 MVP Spec Kit

## 1. 文档目标

本文档用于定义 `OPC 门户项目` 的 MVP 版本范围、前后端实现方案、数据库设计、CMS 后台设计、部署方案与交付节奏。

目标是：

- 在短周期内交付一版可上线、可演示、可运营维护的门户系统
- 保持与现有原型视觉和页面结构一致
- 对需求尚不清晰的模块做边界收敛，保证 MVP 闭环
- 为后续根据客户反馈快速调整保留扩展空间

## 2. 项目背景与原则

### 2.1 当前输入

- 已有高保真原型，核心参考文件：
  - [OPC20260330.html](C:/Users/Jackson%20Chan/Desktop/OPC项目原型图20260330/OPC20260330.html)
- 现有视觉方向已经明确，首页视觉、二级页布局、模块命名、跳转结构基本成型
- 技术栈已确定：
  - 前端：React
  - 后端：FastAPI
  - 数据库：MySQL
  - 部署：Docker

### 2.2 产品定位

该项目本质上是一个：

- `门户官网`
- `资源导航/聚合平台`
- `内容发布平台`
- `轻量运营后台`

它不是复杂业务交易系统，也不是重审批流程系统。原型中的绝大多数按钮和卡片为：

- 站内跳转
- 跳转至第三方页面
- 展示型内容模块

因此 MVP 设计必须遵循：

- 前台重体验、轻交互
- 后台重维护、轻流程
- 模块先内容化，再业务化

## 3. MVP 范围总览

## 3.1 前台页面范围

根据原型，MVP 包含以下页面：

1. 首页
2. 最新动态
3. 社区简介
4. 创业服务
5. OPC 开办指引
6. 融资对接
7. 安居落户
8. 资源集市
9. API 市场
10. MCP 市场
11. 意见反馈

## 3.2 后台范围

MVP 后台需要满足最小运营闭环：

1. 登录
2. Banner 管理
3. 新闻/政策/文章管理
4. 社区介绍基础信息管理
5. 创业服务模块管理
6. 资源集市内容管理
7. 第三方跳转链接管理
8. 意见反馈查看与处理
9. 文件上传管理
10. 管理员账号管理

## 3.3 不纳入 MVP 的内容

以下内容暂不纳入首版，避免工期失控：

- 复杂 RBAC 权限体系
- 工作流审批
- 多组织/多租户
- 会员体系
- 用户注册登录闭环
- 支付、下单、合同、发票
- 实时消息通知
- 大规模全文检索
- 第三方资源同步抓取
- 数据统计大屏

## 4. MVP 核心闭环

MVP 必须完成下面这套闭环：

1. 运营人员可登录后台
2. 运营人员可维护门户首页和主要栏目内容
3. 前台页面从后端 API 获取动态内容
4. 用户可提交意见反馈
5. 后台可查看反馈、标记处理状态
6. 网站可通过 Docker 部署并在线演示

这套闭环成立后，即便客户后续改文案、改跳转、改卡片顺序，也不需要频繁改代码。

## 5. 模块拆分与动态化策略

本项目最关键的是区分：

- 哪些模块写死即可
- 哪些模块必须后台动态化
- 哪些模块可以先伪动态，后续再深化

## 5.1 首页模块

### 模块列表

1. 顶部导航
2. 首屏 Banner 轮播
3. 最新动态 Tab 区
4. 社区简介摘要
5. 创业服务入口
6. AI 资源集市摘要
7. 场景轮播/宣传位
8. 页脚

### 动态化判断

- 顶部导航：`静态配置`
- Banner 轮播：`动态`
- 最新动态：`动态`
- 社区简介摘要：`动态`
- 创业服务入口卡片：`动态`
- AI 资源集市摘要：`动态`
- 场景轮播/宣传位：`动态`
- 页脚：`后台可配`

### 原因

- Banner、动态、卡片、宣传位属于高频变更内容
- 导航结构和大体信息架构在首版中变化较小，可先前端配置

## 5.2 最新动态页

### 内容类型

- 活动通知
- 政策文件
- 文章信息
- 申报通知

### 动态化判断

- 全部动态

### MVP 能力

- 列表展示
- 按分类筛选
- 发布时间展示
- 站外链接跳转
- 可设置置顶/排序

### 首版不做

- 富文本详情页
- 评论
- 收藏
- 站内搜索联想

说明：原型中主要是外链内容，因此首版不强制做站内详情页。后台可支持 `link_type=external/internal`，为后续扩展预留。

## 5.3 社区简介页

### 模块

- 社区总介绍
- 数据指标
- 基地介绍
- 图片展示
- 入驻条件/说明

### 动态化判断

- 介绍文案：动态
- 指标数据：动态
- 基地信息：动态
- 图片：动态
- 条件说明：动态

### MVP 设计

该页虽然内容不高频变化，但客户极有可能调整文案与图片，因此建议全部后台可维护。

## 5.4 创业服务页

### 模块

- 政策列表
- 标签筛选
- 搜索
- 创业配套服务入口

### 动态化判断

- 政策列表：动态
- 标签体系：动态
- 服务入口卡片：动态
- 搜索筛选逻辑：前端实现，后端提供筛选参数

### MVP 能力

- 按标签筛选
- 按关键词搜索
- 展示政策简介、适用人群、状态

### 首版建议

政策匹配先做“内容筛选”，不做真正智能匹配算法。也不做身份问卷推荐，只保留：

- 标签
- 分类
- 条件描述
- 外链申请地址

## 5.5 OPC 开办 / 融资对接 / 安居落户

这三个页面建议作为独立内容栏目管理。

### 动态化判断

- 页面标题/副标题：动态
- 内容区块：动态
- 流程节点：动态
- 外链按钮：动态

### 原因

客户后续非常可能调整：

- 流程说明
- 办理地址
- 联系方式
- 政策链接
- 引导文案

因此这类页面不建议纯写死。

## 5.6 资源集市

资源集市是后续最容易“长内容”的模块，需要从一开始就结构化。

### 模块

- 数据资源中心
- 模型成果中心
- 高质量数据集
- API 工具
- MCP 工具
- 产品工具
- 算力资源

### 动态化判断

- 整体全部动态

### MVP 能力

- 列表展示
- 分类
- 搜索
- 标签
- 外链跳转
- 排序
- 是否推荐

### 首版边界

资源集市首版定位为“资源展示和导航页”，不做：

- 资源申请审批
- 加购/下单
- 收藏
- 评分
- 用户中心

## 5.7 API 市场 / MCP 市场

### 动态化判断

- 全部动态

### MVP 能力

- 分类筛选
- 关键词搜索
- 标签展示
- 外部链接或联系引导

### 首版建议

API 市场与 MCP 市场在数据结构上应视作同类资源，只是展示模板不同。后端可以共用 `resource_items` 主表，通过 `resource_type` 区分：

- `data_source`
- `model`
- `dataset`
- `api`
- `mcp`
- `tool`
- `compute`

## 5.8 意见反馈

### 动态化判断

- 表单结构可先静态
- 提交数据必须落库
- 后台查看必须动态

### MVP 闭环

- 用户提交反馈
- 支持手机号
- 支持附件上传
- 后台查看列表
- 后台标记状态：待处理 / 处理中 / 已处理 / 已关闭

## 6. 前端方案设计

## 6.1 技术选型建议

### 门户前台

建议：

- `Next.js 15 + App Router + TypeScript`
- `Tailwind CSS`
- `Next Metadata / Sitemap / Robots`
- `Server Components + fetch`
- `Client Components` 承担 Tab/轮播等少量交互
- `Ant Design` 仅在个别复杂表单弹窗场景局部使用，不建议门户大量使用

### 原因

- 原型视觉偏官网/展示型，`Tailwind + 自定义组件` 更容易精准还原设计稿
- 如果前台整站用 Ant Design，容易出现过重、过“后台味”的观感
- 页面多为展示模块和卡片布局，Tailwind 开发效率高，适合快速还原

### 后台 CMS

建议：

- `Ant Design Pro`
- 保持独立管理端项目，或放在 monorepo 下的 `apps/admin`

### 原因

- 登录、Layout、表格、表单、权限、菜单现成
- 对内容运营后台的开发速度明显更快
- 与 FastAPI 对接成本低

结论：

- 前台：`Next.js 15 + Tailwind`
- 后台：`Ant Design Pro`

这是本项目最适合的组合。

## 6.2 前端信息架构

建议采用 monorepo：

```text
opc-portal/
  apps/
    web/        # 门户前台 Next.js 15 + Tailwind
    admin/      # 后台 Ant Design Pro
    api/        # FastAPI
  packages/
    shared/     # 类型定义、常量、接口模型
  deploy/
    nginx/
    docker/
  docs/
```

如果时间更紧，也可拆成三个并列目录：

```text
web/
admin/
server/
```

## 6.3 前端页面与路由建议

### 门户前台路由

- `/`
- `/news`
- `/community`
- `/services`
- `/services/opc-registration`
- `/services/financing`
- `/services/housing`
- `/marketplace`
- `/marketplace/apis`
- `/marketplace/mcps`
- `/feedback`

### 后台路由

- `/admin/login`
- `/admin/dashboard`
- `/admin/content/banners`
- `/admin/content/articles`
- `/admin/content/community`
- `/admin/content/services`
- `/admin/content/pages`
- `/admin/resources/items`
- `/admin/resources/categories`
- `/admin/feedback`
- `/admin/system/upload-files`
- `/admin/system/admin-users`
- `/admin/system/site-settings`

## 6.4 前端组件分层建议

### 门户组件

- Layout 组件
- Banner 组件
- NewsTabs 组件
- SectionHeader 组件
- ResourceCard 组件
- RichContentBlock 组件
- SearchFilterBar 组件
- FeedbackForm 组件

### 数据组织

前台不应把内容写死在页面组件中。应统一由 API 或 mock 层提供：

- `site settings`
- `banner list`
- `article list`
- `resource list`
- `service list`
- `page sections`

## 7. 后端方案设计

## 7.1 后端目标

FastAPI 提供以下能力：

1. 对前台输出内容 API
2. 对后台输出管理 API
3. 登录鉴权
4. 文件上传
5. 反馈落库

## 7.2 技术栈建议

- `FastAPI`
- `SQLAlchemy 2.x`
- `Alembic`
- `Pydantic v2`
- `MySQL 8`
- `Redis` 可选，不作为 MVP 必需
- `JWT` 鉴权
- `Passlib/Bcrypt` 密码哈希

## 7.3 后端分层建议

```text
server/
  app/
    api/
      admin/
      public/
    core/
      config.py
      security.py
      database.py
    models/
    schemas/
    services/
    repositories/
    utils/
    main.py
  alembic/
```

### 分层职责

- `public api`：前台读取内容
- `admin api`：后台增删改查
- `services`：业务逻辑
- `repositories`：数据库访问
- `schemas`：请求/响应模型
- `models`：ORM 模型

## 7.4 API 范围设计

### 公共 API

- `GET /api/public/site-settings`
- `GET /api/public/navigation`
- `GET /api/public/banners`
- `GET /api/public/articles`
- `GET /api/public/articles/{id}`
- `GET /api/public/page-sections/{page_key}`
- `GET /api/public/service-items`
- `GET /api/public/resource-items`
- `GET /api/public/resource-categories`
- `POST /api/public/feedback`

### 后台 API

- `POST /api/admin/auth/login`
- `GET /api/admin/me`
- `GET /api/admin/banners`
- `POST /api/admin/banners`
- `PUT /api/admin/banners/{id}`
- `DELETE /api/admin/banners/{id}`
- `GET /api/admin/articles`
- `POST /api/admin/articles`
- `PUT /api/admin/articles/{id}`
- `DELETE /api/admin/articles/{id}`
- `GET /api/admin/page-sections`
- `PUT /api/admin/page-sections/{id}`
- `GET /api/admin/service-items`
- `POST /api/admin/service-items`
- `PUT /api/admin/service-items/{id}`
- `DELETE /api/admin/service-items/{id}`
- `GET /api/admin/resource-items`
- `POST /api/admin/resource-items`
- `PUT /api/admin/resource-items/{id}`
- `DELETE /api/admin/resource-items/{id}`
- `GET /api/admin/feedback`
- `PUT /api/admin/feedback/{id}/status`
- `POST /api/admin/upload`
- `GET /api/admin/admin-users`
- `POST /api/admin/admin-users`

## 8. 数据库设计

## 8.1 设计原则

- 先满足内容管理和前台渲染
- 尽量结构化，避免全部塞进 JSON
- 对“页面块内容”允许有限 JSON 扩展
- 所有表保留排序、发布、状态字段

## 8.2 核心表清单

1. `admin_users`
2. `upload_files`
3. `site_settings`
4. `navigation_items`
5. `banners`
6. `articles`
7. `article_categories`
8. `page_sections`
9. `service_items`
10. `resource_categories`
11. `resource_items`
12. `feedback_records`
13. `tags`
14. `tag_relations`

## 8.3 表设计详述

### 8.3.1 admin_users

| 字段 | 类型 | 说明 |
|---|---|---|
| id | bigint pk | 主键 |
| username | varchar(64) unique | 登录名 |
| password_hash | varchar(255) | 密码哈希 |
| name | varchar(64) | 姓名 |
| mobile | varchar(32) | 手机号 |
| email | varchar(128) | 邮箱 |
| status | tinyint | 1启用 0禁用 |
| last_login_at | datetime | 最近登录时间 |
| created_at | datetime | 创建时间 |
| updated_at | datetime | 更新时间 |

### 8.3.2 upload_files

| 字段 | 类型 | 说明 |
|---|---|---|
| id | bigint pk | 主键 |
| file_name | varchar(255) | 原始文件名 |
| file_ext | varchar(32) | 扩展名 |
| mime_type | varchar(128) | MIME |
| file_size | bigint | 文件大小 |
| storage_path | varchar(500) | 存储路径 |
| public_url | varchar(500) | 访问地址 |
| created_by | bigint | 上传人 |
| created_at | datetime | 创建时间 |

### 8.3.3 site_settings

| 字段 | 类型 | 说明 |
|---|---|---|
| id | bigint pk | 主键 |
| site_name | varchar(128) | 站点名称 |
| site_subtitle | varchar(255) | 副标题 |
| logo_file_id | bigint | logo |
| footer_text | varchar(255) | 页脚 |
| contact_phone | varchar(64) | 联系电话 |
| contact_email | varchar(128) | 联系邮箱 |
| icp_no | varchar(64) | ICP 信息 |
| extra_json | json | 扩展配置 |
| updated_at | datetime | 更新时间 |

### 8.3.4 navigation_items

| 字段 | 类型 | 说明 |
|---|---|---|
| id | bigint pk | 主键 |
| label | varchar(64) | 菜单名 |
| path | varchar(255) | 路径 |
| target_type | varchar(32) | internal/external |
| target_url | varchar(500) | 外链 |
| sort_order | int | 排序 |
| is_visible | tinyint | 是否展示 |
| created_at | datetime | 创建时间 |
| updated_at | datetime | 更新时间 |

### 8.3.5 banners

| 字段 | 类型 | 说明 |
|---|---|---|
| id | bigint pk | 主键 |
| title | varchar(255) | 主标题 |
| subtitle | varchar(255) | 副标题 |
| highlight_title | varchar(255) | 活动标题 |
| description | text | 活动说明 |
| image_file_id | bigint | 背景图 |
| action_type | varchar(32) | internal/external/none |
| action_value | varchar(500) | 跳转地址或路由 |
| sort_order | int | 排序 |
| is_published | tinyint | 是否发布 |
| start_at | datetime nullable | 生效时间 |
| end_at | datetime nullable | 失效时间 |
| created_at | datetime | 创建时间 |
| updated_at | datetime | 更新时间 |

### 8.3.6 article_categories

| 字段 | 类型 | 说明 |
|---|---|---|
| id | bigint pk | 主键 |
| name | varchar(64) | 分类名 |
| code | varchar(64) unique | 分类编码 |
| sort_order | int | 排序 |
| is_enabled | tinyint | 是否启用 |

建议默认内置：

- `activity`
- `policy`
- `article`
- `notice`

### 8.3.7 articles

| 字段 | 类型 | 说明 |
|---|---|---|
| id | bigint pk | 主键 |
| category_id | bigint | 分类 |
| title | varchar(255) | 标题 |
| summary | text | 摘要 |
| cover_file_id | bigint nullable | 封面 |
| content | longtext nullable | 富文本正文 |
| link_type | varchar(32) | external/internal |
| external_url | varchar(500) nullable | 外部链接 |
| publish_at | datetime | 发布时间 |
| source_name | varchar(128) | 来源 |
| is_top | tinyint | 是否置顶 |
| is_published | tinyint | 是否发布 |
| sort_order | int | 排序 |
| created_by | bigint | 创建人 |
| created_at | datetime | 创建时间 |
| updated_at | datetime | 更新时间 |

### 8.3.8 page_sections

该表用于管理内容型页面区块，例如：

- 社区简介页
- OPC 开办页
- 融资对接页
- 安居落户页
- 首页宣传区

| 字段 | 类型 | 说明 |
|---|---|---|
| id | bigint pk | 主键 |
| page_key | varchar(64) | 页面标识 |
| section_key | varchar(64) | 区块标识 |
| title | varchar(255) | 区块标题 |
| subtitle | varchar(255) | 区块副标题 |
| content | longtext | 内容 |
| cover_file_id | bigint nullable | 配图 |
| extra_json | json | 扩展结构 |
| sort_order | int | 排序 |
| is_published | tinyint | 是否发布 |
| created_at | datetime | 创建时间 |
| updated_at | datetime | 更新时间 |

建议的 `page_key`：

- `home`
- `community`
- `opc_registration`
- `financing`
- `housing`

### 8.3.9 service_items

| 字段 | 类型 | 说明 |
|---|---|---|
| id | bigint pk | 主键 |
| module_key | varchar(64) | 所属模块 |
| title | varchar(255) | 标题 |
| summary | text | 简介 |
| icon | varchar(64) | 图标名 |
| cover_file_id | bigint nullable | 图片 |
| target_type | varchar(32) | internal/external/none |
| target_value | varchar(500) | 目标值 |
| tags_json | json | 标签 |
| sort_order | int | 排序 |
| is_published | tinyint | 是否发布 |
| created_at | datetime | 创建时间 |
| updated_at | datetime | 更新时间 |

`module_key` 示例：

- `home_service_entries`
- `policy_items`
- `support_services`

如果后续政策卡片复杂度上升，也可再拆分 `policy_items` 独立表。MVP 阶段可先复用此表或单独拆表，二者均可。

### 8.3.10 resource_categories

| 字段 | 类型 | 说明 |
|---|---|---|
| id | bigint pk | 主键 |
| parent_id | bigint nullable | 父级分类 |
| name | varchar(64) | 分类名 |
| code | varchar(64) unique | 编码 |
| resource_type | varchar(32) | 资源类型 |
| sort_order | int | 排序 |
| is_enabled | tinyint | 是否启用 |

### 8.3.11 resource_items

该表是资源集市、API 市场、MCP 市场的主表。

| 字段 | 类型 | 说明 |
|---|---|---|
| id | bigint pk | 主键 |
| category_id | bigint nullable | 分类 |
| resource_type | varchar(32) | data_source/model/dataset/api/mcp/tool/compute |
| title | varchar(255) | 标题 |
| short_desc | varchar(500) | 短描述 |
| content | longtext nullable | 详细内容 |
| cover_file_id | bigint nullable | 封面 |
| vendor_name | varchar(128) nullable | 提供方 |
| price_text | varchar(64) nullable | 价格文案 |
| tag_json | json | 标签 |
| extra_json | json | 扩展字段 |
| target_type | varchar(32) | internal/external/contact |
| target_value | varchar(500) | 跳转地址 |
| is_recommended | tinyint | 是否推荐 |
| is_published | tinyint | 是否发布 |
| sort_order | int | 排序 |
| publish_at | datetime nullable | 发布时间 |
| created_at | datetime | 创建时间 |
| updated_at | datetime | 更新时间 |

### 8.3.12 feedback_records

| 字段 | 类型 | 说明 |
|---|---|---|
| id | bigint pk | 主键 |
| subject | varchar(255) | 主题 |
| content | text | 反馈内容 |
| phone | varchar(32) | 联系电话 |
| attachment_file_id | bigint nullable | 附件 |
| status | varchar(32) | pending/processing/resolved/closed |
| admin_remark | text nullable | 处理备注 |
| created_at | datetime | 提交时间 |
| updated_at | datetime | 更新时间 |

### 8.3.13 tags / tag_relations

如果首版想更快，可不单独建通用标签表，先使用 JSON。  
如果希望后台标签管理更正规，可以补充：

- `tags`
- `tag_relations`

MVP 推荐先使用 JSON，减少开发量。

## 9. 后台功能设计

## 9.1 后台角色

MVP 仅设置单一角色：

- `admin`

后续如有需要可扩展：

- `editor`
- `operator`
- `super_admin`

但首版不做复杂权限矩阵。

## 9.2 后台菜单设计

### 内容管理

- Banner 管理
- 动态资讯
- 页面区块
- 创业服务

### 资源管理

- 资源分类
- 资源条目

### 反馈管理

- 意见反馈

### 系统管理

- 文件管理
- 管理员
- 站点设置

## 9.3 后台页面能力

### Banner 管理

- 新增、编辑、删除
- 上传图片
- 设置跳转类型
- 排序
- 发布状态

### 动态资讯

- 按分类管理
- 设置发布时间
- 设置外链
- 是否置顶
- 发布状态

### 页面区块管理

- 根据页面筛选区块
- 富文本编辑
- 图片上传
- 按区块排序

### 资源条目管理

- 分类
- 标签
- 外链
- 价格文案
- 推荐状态
- 发布状态

### 反馈管理

- 列表查看
- 查看详情
- 修改状态
- 填写处理备注

## 10. 业务规则

## 10.1 发布规则

- 后台创建内容后默认可保存为未发布
- 前台只读取 `is_published=1` 的内容
- 按 `sort_order` 和 `publish_at` 排序

## 10.2 跳转规则

所有前台可点击内容统一支持：

- `internal`：站内路由
- `external`：外部 URL
- `none`：不可点击
- `contact`：引导联系或表单

## 10.3 文件上传规则

支持类型：

- 图片：`jpg/png/webp`
- 文档：`pdf`

限制：

- 图片单文件建议不超过 `5MB`
- 附件不超过 `10MB`

## 10.4 反馈规则

- `subject` 必填
- `content` 必填
- `phone` 必填
- 附件选填

首版不做短信验证，不做验证码。  
如果上线环境担心垃圾提交，可增加：

- 简单图形验证码
- 频率限制

## 11. 非功能需求

## 11.1 性能

- 首页首屏尽量控制在 3 秒内完成主要可见内容加载
- 前台内容接口应支持分页与条件查询
- 图片需支持压缩与尺寸控制

## 11.2 SEO

MVP 当前直接采用 `Next.js 15 SSR` 上线，建议至少补齐：

- 页面 title
- description
- og 基础信息

当前版本已经按 SEO 诉求采用 SSR，后续可根据访问量再补充缓存、增量静态化和更细粒度的 SEO 策略。

## 11.3 安全

- 后台接口需 JWT 鉴权
- 密码必须哈希存储
- 文件上传校验 MIME 和扩展名
- 富文本内容需做基础 XSS 过滤
- 管理端接口需限制跨域来源

## 11.4 日志

MVP 建议记录：

- 登录日志
- 内容新增/编辑日志
- 反馈状态修改日志

首版可先落应用日志，不必做专门审计表。

## 12. Docker 与部署方案

## 12.1 部署目标

首版建议最小部署结构：

1. `web` 前台 Next.js SSR 站点
2. `admin` 后台静态站点
3. `api` FastAPI 服务
4. `mysql`
5. `nginx`

## 12.2 推荐部署拓扑

```text
Internet
  -> Nginx
      -> /        next-web
      -> /admin   admin
      -> /api     fastapi
  -> MySQL
```

## 12.3 Docker Compose 服务建议

- `opc-web`
- `opc-admin`
- `opc-api`
- `opc-mysql`
- `opc-nginx`

可选：

- `opc-redis`

## 12.4 上传文件存储

MVP 可先使用本地挂载目录：

- `/data/uploads`

后续再迁移对象存储：

- 阿里云 OSS
- 腾讯云 COS
- MinIO

## 13. 开发优先级

## 13.1 P0

- 前台基础框架
- 首页
- 最新动态
- 社区简介
- 创业服务
- 资源集市
- 意见反馈
- 后台登录
- Banner 管理
- 资讯管理
- 页面区块管理
- 资源条目管理
- 反馈管理
- Docker 部署

## 13.2 P1

- OPC 开办页完善
- 融资对接页完善
- 安居落户页完善
- 文件管理
- 管理员管理
- 站点设置

## 13.3 P2

- 富文本详情页
- 推荐位编排
- SEO 增强
- 操作日志
- 统计看板

## 14. 推荐开发排期

## 14.1 Day 1

- 初始化前后端项目
- 抽离原型模块
- 完成前台 Layout、首页、公共组件
- 建数据库基础表
- 完成后台登录和 Banner/资讯管理基础页

## 14.2 Day 2

- 完成动态页、社区页、创业服务页、资源集市页
- 完成页面区块管理、资源管理、反馈管理
- 完成公共 API 与后台 API
- 联调前后台

## 14.3 Day 3

- 完成 OPC 开办、融资对接、安居落户
- 修复 UI 细节
- 上传能力
- Docker 化
- 测试环境部署

## 15. 风险与控制

## 15.1 主要风险

1. 客户会在视觉细节上频繁微调
2. 资源集市数据结构容易扩散
3. 创业服务可能被临时要求做复杂匹配逻辑
4. 后台如果范围不收敛，会迅速膨胀

## 15.2 控制方案

1. 前台全部组件化，避免整页硬编码
2. 资源统一使用 `resource_items` 主模型
3. 政策匹配首版只做标签筛选，不做智能推荐
4. 后台坚持“内容管理型 CMS”，不演变成业务系统

## 16. 最终建议

对于这个项目，推荐采用如下路线：

- 门户前台使用 `Next.js 15 + Tailwind`
- CMS 后台使用 `Ant Design Pro`
- 后端使用 `FastAPI + SQLAlchemy + Alembic + MySQL`
- Docker Compose 完成首版部署

这是当前时间成本、交付稳定性、后续可改造性之间最均衡的方案。

## 17. 首版确认项

在正式开工前，建议与你的客户或内部一起确认以下 7 项：

1. 首版是否只做内容管理，不做用户体系
2. 最新动态是否全部外链，还是部分需要站内详情
3. 资源集市是否只做展示跳转，不做申请流程
4. 创业服务是否只做筛选，不做智能推荐
5. 意见反馈是否只后台查看，不需要短信通知
6. 页面文案和图片是否由客户提供最终版
7. 上线域名、服务器、备案、文件存储方式是否已明确

---

如果进入下一步开发，建议直接基于本 spec 再补两份落地文档：

1. `接口设计文档 API Spec`
2. `页面字段映射表 UI-to-CMS Mapping`

这样开发时会更顺，不会在“这个模块到底后台配不配”上反复来回。
