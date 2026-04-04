# OPC 门户项目 UI to CMS Mapping

## 1. 文档目标

本文档用于把原型中的前台模块映射为后台 CMS 的可维护字段，解决三个问题：

1. 哪个页面模块需要后台管理
2. 后台要给运营人员什么表单字段
3. 前台渲染时读取哪类数据结构

这份文档是 UI、前端、后端、运营后台之间的桥梁。

## 2. 页面与数据源关系总览

| 前台页面 | 模块 | 后台来源 |
|---|---|---|
| 首页 | Banner 轮播 | `banners` |
| 首页 | 最新动态 | `articles` |
| 首页 | 社区简介摘要 | `page_sections` |
| 首页 | 创业服务入口 | `service_items` |
| 首页 | 资源集市摘要 | `resource_items` |
| 首页 | 场景宣传位 | `page_sections` |
| 最新动态 | 资讯列表/分类 | `articles` + `article_categories` |
| 社区简介 | 页面各区块 | `page_sections` |
| 创业服务 | 政策卡片/服务入口 | `service_items` |
| OPC 开办 | 页面区块 | `page_sections` |
| 融资对接 | 页面区块 | `page_sections` |
| 安居落户 | 页面区块 | `page_sections` |
| 资源集市 | 资源分类与资源卡片 | `resource_categories` + `resource_items` |
| API 市场 | API 分类与卡片 | `resource_categories` + `resource_items` |
| MCP 市场 | MCP 卡片 | `resource_items` |
| 意见反馈 | 表单提交 | `feedback_records` |
| 全站 | Header/Footer/联系方式 | `site_settings` + `navigation_items` |

## 3. 首页映射

## 3.1 顶部导航

### 原型模块

- 首页
- 最新动态
- 社区简介
- 创业服务
- 资源集市
- 意见反馈

### CMS 来源

- `navigation_items`

### 后台字段

| 字段 | 说明 | 前台用途 |
|---|---|---|
| label | 菜单名称 | 导航文案 |
| path | 路由路径 | 站内跳转 |
| target_type | internal/external | 跳转类型 |
| target_value | 外链或路由值 | 点击目标 |
| sort_order | 排序 | 导航顺序 |
| is_visible | 是否显示 | 控制展示 |

## 3.2 首屏 Banner 轮播

### 原型内容

- 主标题
- 副标题
- 活动标题
- 活动说明
- 背景图
- 点击跳转

### CMS 来源

- `banners`

### 后台表单字段

| 字段 | 类型 | 说明 |
|---|---|---|
| title | 文本 | 主标题 |
| subtitle | 文本 | 副标题 |
| highlight_title | 文本 | 活动标题 |
| description | 多行文本 | 活动描述 |
| image_file_id | 图片 | 背景图 |
| action_type | 枚举 | 无/站内/站外 |
| action_value | 文本 | 链接或路由 |
| sort_order | 数字 | 排序 |
| is_published | 开关 | 是否发布 |
| start_at | 时间 | 生效时间 |
| end_at | 时间 | 失效时间 |

### 前台渲染规则

- 按 `sort_order asc`
- 仅展示 `is_published=1`
- 当前时间应在生效区间内

## 3.3 首页最新动态

### 原型内容

- Tab：活动通知 / 政策文件 / 文章信息 / 申报通知
- 每项显示：标签、标题、日期

### CMS 来源

- `article_categories`
- `articles`

### 后台字段

| 字段 | 说明 |
|---|---|
| category_id | 分类 |
| title | 标题 |
| summary | 摘要 |
| publish_at | 发布时间 |
| source_name | 来源 |
| link_type | 内链/外链 |
| external_url | 外链 |
| is_top | 是否置顶 |
| sort_order | 排序 |
| is_published | 是否发布 |

### 前台规则

- 每个分类显示前 N 条
- 同分类按 `is_top desc, sort_order asc, publish_at desc`

## 3.4 首页社区简介摘要

### 原型内容

- 标题
- 描述文案
- 统计数字
- 配图

### CMS 来源

- `page_sections`

### 建议 section_key

- `home_community_intro`

### 后台字段

| 字段 | 说明 |
|---|---|
| title | 区块标题 |
| subtitle | 区块副标题 |
| content | 摘要文案 |
| cover_file_id | 展示图 |
| extra.metrics | 指标数组 |
| sort_order | 排序 |
| is_published | 是否发布 |

### extra.metrics 示例

```json
{
  "metrics": [
    { "label": "入驻团队", "value": "300+" },
    { "label": "服务人次", "value": "5000+" },
    { "label": "社区面积", "value": "2万㎡" },
    { "label": "合作机构", "value": "50+" }
  ]
}
```

## 3.5 首页创业服务入口

### 原型内容

- OPC 开办
- 政策匹配
- 安居落户
- 融资对接

### CMS 来源

- `service_items`

### module_key

- `home_service_entries`

### 后台字段

| 字段 | 说明 |
|---|---|
| title | 卡片名 |
| summary | 简介 |
| icon | 图标 |
| target_type | 跳转类型 |
| target_value | 跳转值 |
| sort_order | 排序 |
| is_published | 是否发布 |

## 3.6 首页 AI 资源集市摘要

### 原型内容

- 数据
- 工具包
- 算力
- 入口卡片

### CMS 来源

- `resource_items`
- `page_sections`

### 映射方式

- 具体资源卡片来自 `resource_items`
- 区块标题、摘要描述、宣传文案来自 `page_sections`

### 建议 section_key

- `home_marketplace_intro`
- `home_marketplace_promo`

## 3.7 首页场景宣传位

### 原型内容

- 场景机会
- 场景能力
- 场景政策

### CMS 来源

- `page_sections`

### 建议 page_key / section_key

- `home / scenario_1`
- `home / scenario_2`
- `home / scenario_3`

### extra 示例

```json
{
  "button_text": "探索场景机会",
  "action_type": "external",
  "action_value": "https://example.com",
  "bg_style": {
    "from": "#0052d9",
    "to": "#3b82f6"
  }
}
```

## 4. 最新动态页映射

## 4.1 页面模块

- 页面标题区
- 分类 Tab
- 资讯列表
- 搜索预留

### 标题区来源

- `page_sections`

建议：

- `page_key = news`
- `section_key = hero`

### 列表来源

- `articles`

### 后台字段补充

可在后台给文章设置：

| 字段 | 说明 |
|---|---|
| category_id | 分类 |
| title | 标题 |
| summary | 摘要 |
| external_url | 外链 |
| publish_at | 发布时间 |
| is_top | 是否置顶 |
| is_published | 是否发布 |

## 5. 社区简介页映射

## 5.1 页面区块建议

| section_key | 内容 |
|---|---|
| hero | 页面头图与标题 |
| intro | 社区简介正文 |
| metrics | 数据指标 |
| base_1 | 软二基地 |
| base_2 | 软三基地 |
| admission | 入驻条件 |

### CMS 来源

- `page_sections`

### `hero` 字段

| 字段 | 说明 |
|---|---|
| title | 页面标题 |
| subtitle | 页面副标题 |
| cover_file_id | 头图 |

### `intro` 字段

| 字段 | 说明 |
|---|---|
| title | 模块标题 |
| content | 介绍正文 |

### `metrics` 字段

放在 `extra.metrics`

### `base_1/base_2` 字段

| 字段 | 说明 |
|---|---|
| title | 基地名称 |
| content | 基地简介 |
| cover_file_id | 基地图 |

### `admission` 字段

建议 `extra`：

```json
{
  "items": [
    "从事AI相关领域产品/服务开发",
    "通过社区资质审核"
  ]
}
```

## 6. 创业服务页映射

## 6.1 页面结构

- Hero 标题区
- 政策卡片筛选区
- 创业配套服务卡片

### Hero 来源

- `page_sections`
- `page_key = services`
- `section_key = hero`

## 6.2 政策卡片

建议首版仍走 `service_items`，避免表过多。

### module_key

- `policy_items`

### 后台字段

| 字段 | 说明 |
|---|---|
| title | 政策名称 |
| summary | 政策简介 |
| tags | 适用标签 |
| target_type | 跳转类型 |
| target_value | 外链或站内 |
| sort_order | 排序 |
| is_published | 是否发布 |

### tags 示例

```json
["应届毕业生", "AI从业者", "开发中"]
```

### 前台筛选逻辑

- 标签筛选由前端完成
- 后端返回标签数组即可

## 6.3 创业配套服务卡片

### module_key

- `support_services`

### 字段

| 字段 | 说明 |
|---|---|
| title | 服务名称 |
| summary | 简介 |
| icon | 图标 |
| target_type | internal/external |
| target_value | 目标路由/链接 |
| sort_order | 排序 |
| is_published | 是否发布 |

## 7. OPC 开办 / 融资对接 / 安居落户 映射

这 3 个页面推荐统一走 `page_sections`，减少模型复杂度。

## 7.1 OPC 开办

建议 section：

| section_key | 内容 |
|---|---|
| hero | 页面标题区 |
| intro | 页面导语 |
| process | 流程说明 |
| links | 相关跳转 |

### `process` 的 extra 示例

```json
{
  "steps": [
    { "title": "企业登记", "subtitle": "0.5天内核发营业执照", "icon": "FileText" },
    { "title": "申领发票", "subtitle": "0.5天内核发并交邮", "icon": "Receipt" }
  ]
}
```

## 7.2 融资对接

建议 section：

| section_key | 内容 |
|---|---|
| hero | 页面头图文案 |
| intro | 服务说明 |
| fund_products | 基金/融资产品 |
| links | 跳转按钮 |

### `fund_products` extra 示例

```json
{
  "items": [
    {
      "title": "OPC 产业基金群资金申请",
      "summary": "支持种子期团队",
      "action_type": "external",
      "action_value": "https://example.com"
    }
  ]
}
```

## 7.3 安居落户

建议 section：

| section_key | 内容 |
|---|---|
| hero | 页面标题区 |
| intro | 页面说明 |
| housing_items | 政策项列表 |

### `housing_items` extra 示例

```json
{
  "items": [
    {
      "title": "人才房申请",
      "summary": "政策摘要",
      "action_type": "external",
      "action_value": "https://example.com"
    }
  ]
}
```

## 8. 资源集市映射

资源集市首版最重要的是“统一建模”。

## 8.1 页面结构

- 页面标题区
- 搜索栏
- 数据板块
- 工具包板块
- 算力板块

### 标题区来源

- `page_sections`
- `page_key = marketplace`
- `section_key = hero`

### 内容来源

- `resource_categories`
- `resource_items`

## 8.2 资源类型映射

| 前台展示模块 | resource_type |
|---|---|
| 数据资源中心 | `data_source` |
| 模型成果中心 | `model` |
| 高质量数据集 | `dataset` |
| API | `api` |
| MCP | `mcp` |
| 产品工具 | `tool` |
| 算力 | `compute` |

## 8.3 资源卡片后台字段

| 字段 | 说明 |
|---|---|
| title | 标题 |
| short_desc | 简介 |
| resource_type | 资源类型 |
| category_id | 分类 |
| vendor_name | 提供方 |
| price_text | 价格文案 |
| tag_list | 标签 |
| cover_file_id | 图片 |
| target_type | 跳转类型 |
| target_value | 跳转值 |
| is_recommended | 是否推荐 |
| sort_order | 排序 |
| is_published | 是否发布 |

### extra 结构建议

不同资源类型复用同一表，通过 `extra` 承载差异字段。

#### 数据资源

```json
{
  "owner": "市交通运输局",
  "publish_date": "2025-12-12",
  "industry_tag": "交通运输",
  "resource_format": "API"
}
```

#### 模型

```json
{
  "model_type": "大语言模型",
  "industry_tag": "文化旅游",
  "publish_date": "2026-02-05"
}
```

#### MCP

```json
{
  "tool_names": ["get_weather", "get_air_quality"]
}
```

#### 算力

```json
{
  "gpu_memory": "80GB",
  "billing_cycle": "月",
  "status_text": "可租赁"
}
```

## 9. API 市场映射

## 9.1 页面来源

- `resource_items`

过滤条件：

- `resource_type = api`

## 9.2 分类来源

- `resource_categories`

建议分类：

- 全部
- 电子商务
- 生活服务
- 数据智能

## 9.3 后台需要的表单字段

| 字段 | 说明 |
|---|---|
| category_id | 所属分类 |
| title | API 名称 |
| short_desc | 简介 |
| tag_list | 如 免费/付费/企业专用 |
| extra.icon | 图标名 |
| target_type | 跳转类型 |
| target_value | 详情地址 |
| is_published | 是否发布 |

## 10. MCP 市场映射

## 10.1 页面来源

- `resource_items`

过滤条件：

- `resource_type = mcp`

## 10.2 后台字段建议

| 字段 | 说明 |
|---|---|
| title | MCP 名称 |
| short_desc | 简介 |
| tag_list | 标签 |
| extra.icon | 图标 |
| extra.tool_names | 工具名数组 |
| target_type | 跳转类型 |
| target_value | 跳转地址 |
| sort_order | 排序 |
| is_published | 是否发布 |

## 11. 意见反馈映射

## 11.1 前台字段

| 字段 | 说明 |
|---|---|
| subject | 主题 |
| content | 反馈内容 |
| phone | 联系电话 |
| attachment_file_id | 附件 |

## 11.2 后台字段

| 字段 | 说明 |
|---|---|
| subject | 主题 |
| content | 内容 |
| phone | 联系电话 |
| attachment | 附件地址 |
| status | 状态 |
| admin_remark | 处理备注 |
| created_at | 提交时间 |

## 12. 全站设置映射

## 12.1 站点设置

### 来源

- `site_settings`

### 后台字段

| 字段 | 说明 |
|---|---|
| site_name | 站点名 |
| site_subtitle | 副标题 |
| logo_file_id | Logo |
| footer_text | 页脚文案 |
| contact_phone | 电话 |
| contact_email | 邮箱 |
| icp_no | 备案号 |

## 13. 推荐后台表单设计策略

为了减少后台页面数量，建议采用：

### 统一内容策略

- 资讯统一在“动态资讯”里管理
- 内容页统一在“页面区块”里管理
- 资源统一在“资源条目”里管理

### 不建议首版拆太细

不建议一开始就拆成：

- 社区简介管理
- OPC 开办管理
- 融资管理
- 安居管理
- 首页模块管理

太细会导致后台菜单臃肿、维护成本高。  
建议通过：

- 页面筛选器
- 模块筛选器

在同一个管理页中处理。

## 14. Human Loop 验收建议

为了避免“按 spec 一次性做完才看效果”，建议把 UI-to-CMS 映射作为每一段开发的验收依据。

推荐验收单元：

1. 首页 Banner + 最新动态
2. 社区简介页
3. 创业服务页
4. 资源集市页
5. API/MCP 页
6. 意见反馈闭环
7. 后台系统项

每一段只看三件事：

1. 前台是否还原对了
2. 对应字段是否能从后台改动生效
3. 跳转和状态是否闭环

这会比一次性验全站稳定很多。
