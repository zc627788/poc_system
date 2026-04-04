# OPC 门户项目 API Spec MVP

## 1. 文档目标

本文档定义 `OPC 门户项目` MVP 阶段前后台 API 规范，用于：

- 前台门户读取动态内容
- 后台 CMS 管理内容
- 意见反馈提交与处理
- 管理端登录鉴权

接口风格默认：

- 协议：`HTTPS`
- 数据格式：`JSON`
- 字符集：`UTF-8`
- 风格：`RESTful`
- 基础前缀：`/api`

## 2. 通用规范

## 2.1 统一响应结构

成功响应：

```json
{
  "code": 0,
  "message": "ok",
  "data": {}
}
```

分页响应：

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "items": [],
    "total": 0,
    "page": 1,
    "page_size": 10
  }
}
```

失败响应：

```json
{
  "code": 4001,
  "message": "invalid params",
  "data": null
}
```

## 2.2 认证方式

后台接口使用：

- `Authorization: Bearer <token>`

JWT 建议：

- access token 有效期：`2h`
- refresh token MVP 可不做

## 2.3 时间格式

统一使用：

- `ISO 8601`
- 示例：`2026-04-02T10:30:00+08:00`

## 2.4 文件 URL

统一返回完整可访问地址，例如：

```json
{
  "id": 1,
  "url": "https://domain.com/uploads/2026/04/banner-01.png"
}
```

## 3. 枚举定义

## 3.1 通用状态

- `0`：禁用 / 未发布
- `1`：启用 / 已发布

## 3.2 action_type

- `none`
- `internal`
- `external`
- `contact`

## 3.3 article category code

- `activity`
- `policy`
- `article`
- `notice`

## 3.4 resource_type

- `data_source`
- `model`
- `dataset`
- `api`
- `mcp`
- `tool`
- `compute`

## 3.5 feedback status

- `pending`
- `processing`
- `resolved`
- `closed`

## 4. Public API

## 4.1 获取站点设置

### `GET /api/public/site-settings`

返回站点基础信息，前台 Header/Footer 使用。

响应示例：

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "site_name": "OPC 厦门社区门户",
    "site_subtitle": "成为一流的数智产业生态构建者",
    "logo_url": "https://domain.com/uploads/logo.png",
    "footer_text": "© 2026 厦门 OPC 社区. All rights reserved.",
    "contact_phone": "0592-123456",
    "contact_email": "opc@example.com",
    "icp_no": "闽ICP备xxxx号"
  }
}
```

## 4.2 获取导航菜单

### `GET /api/public/navigation`

响应示例：

```json
{
  "code": 0,
  "message": "ok",
  "data": [
    {
      "id": 1,
      "label": "首页",
      "path": "/",
      "target_type": "internal",
      "target_value": "/",
      "sort_order": 1
    }
  ]
}
```

## 4.3 获取首页 Banner

### `GET /api/public/banners`

查询参数：

- `position` 可选，默认 `home`

响应示例：

```json
{
  "code": 0,
  "message": "ok",
  "data": [
    {
      "id": 1,
      "title": "数智立信 创见不凡",
      "subtitle": "成为一流的数智产业生态构建者",
      "highlight_title": "AI 黑客松大赛",
      "description": "48小时极限开发...",
      "image_url": "https://domain.com/uploads/banner-1.png",
      "action_type": "external",
      "action_value": "https://mp.weixin.qq.com/xxx",
      "sort_order": 1
    }
  ]
}
```

## 4.4 获取文章列表

### `GET /api/public/articles`

查询参数：

- `category_code` 可选
- `keyword` 可选
- `is_top` 可选
- `page` 默认 `1`
- `page_size` 默认 `10`

响应示例：

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "items": [
      {
        "id": 1001,
        "category": {
          "id": 1,
          "code": "activity",
          "name": "活动通知"
        },
        "title": "AI 火炬系列活动",
        "summary": "活动简介",
        "cover_url": null,
        "link_type": "external",
        "external_url": "https://mp.weixin.qq.com/xxx",
        "publish_at": "2026-03-18T00:00:00+08:00",
        "source_name": "微信公众号",
        "is_top": true
      }
    ],
    "total": 1,
    "page": 1,
    "page_size": 10
  }
}
```

## 4.5 获取文章详情

### `GET /api/public/articles/{id}`

说明：

- 若文章为纯外链，可返回 `external_url`
- 若后续支持站内详情，可返回 `content`

## 4.6 获取页面区块内容

### `GET /api/public/page-sections/{page_key}`

用于：

- 社区简介
- OPC 开办
- 融资对接
- 安居落户
- 首页宣传位

响应示例：

```json
{
  "code": 0,
  "message": "ok",
  "data": [
    {
      "id": 1,
      "page_key": "community",
      "section_key": "intro",
      "title": "专业化智创社区",
      "subtitle": "开放共享 / 设施齐全 / 全链服务",
      "content": "厦门信息集团 OPC 社区...",
      "cover_url": "https://domain.com/uploads/community.png",
      "extra": {
        "metrics": [
          { "label": "入驻团队", "value": "300+" }
        ]
      },
      "sort_order": 1
    }
  ]
}
```

## 4.7 获取创业服务入口

### `GET /api/public/service-items`

查询参数：

- `module_key` 可选
- `keyword` 可选
- `tag` 可选
- `page`
- `page_size`

适用：

- 首页创业服务入口
- 创业服务页政策卡片
- 配套服务卡片

## 4.8 获取资源分类

### `GET /api/public/resource-categories`

查询参数：

- `resource_type` 可选

## 4.9 获取资源列表

### `GET /api/public/resource-items`

查询参数：

- `resource_type` 可选
- `category_id` 可选
- `keyword` 可选
- `is_recommended` 可选
- `page`
- `page_size`

响应示例：

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "items": [
      {
        "id": 1,
        "resource_type": "api",
        "category": {
          "id": 2,
          "name": "数据智能"
        },
        "title": "AI 图像生成",
        "short_desc": "根据提示词生成图像",
        "cover_url": null,
        "vendor_name": "某服务商",
        "price_text": "免费",
        "tag_list": ["免费", "支持MCP"],
        "target_type": "external",
        "target_value": "https://example.com",
        "is_recommended": true,
        "publish_at": "2026-04-02T10:00:00+08:00"
      }
    ],
    "total": 1,
    "page": 1,
    "page_size": 10
  }
}
```

## 4.10 提交意见反馈

### `POST /api/public/feedback`

请求体：

```json
{
  "subject": "页面建议",
  "content": "建议增加联系方式",
  "phone": "13800138000",
  "attachment_file_id": 1
}
```

响应：

```json
{
  "code": 0,
  "message": "submitted",
  "data": {
    "id": 10001,
    "status": "pending"
  }
}
```

校验规则：

- `subject` 必填，最大 `100`
- `content` 必填，最大 `2000`
- `phone` 必填，最大 `32`

## 5. Admin Auth API

## 5.1 登录

### `POST /api/admin/auth/login`

请求体：

```json
{
  "username": "admin",
  "password": "123456"
}
```

响应：

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "access_token": "jwt-token",
    "token_type": "Bearer",
    "expires_in": 7200,
    "user": {
      "id": 1,
      "username": "admin",
      "name": "系统管理员"
    }
  }
}
```

## 5.2 当前用户信息

### `GET /api/admin/me`

## 6. Admin Content API

## 6.1 Banner 管理

### `GET /api/admin/banners`

查询参数：

- `keyword`
- `is_published`
- `page`
- `page_size`

### `POST /api/admin/banners`

请求体：

```json
{
  "title": "数智立信 创见不凡",
  "subtitle": "成为一流的数智产业生态构建者",
  "highlight_title": "AI 黑客松大赛",
  "description": "活动介绍",
  "image_file_id": 1,
  "action_type": "external",
  "action_value": "https://mp.weixin.qq.com/xxx",
  "sort_order": 1,
  "is_published": 1,
  "start_at": null,
  "end_at": null
}
```

### `PUT /api/admin/banners/{id}`

### `DELETE /api/admin/banners/{id}`

建议：

- 物理删除可先不做，后端实现逻辑删除也可

## 6.2 文章分类管理

### `GET /api/admin/article-categories`

### `POST /api/admin/article-categories`

### `PUT /api/admin/article-categories/{id}`

## 6.3 文章管理

### `GET /api/admin/articles`

查询参数：

- `category_id`
- `keyword`
- `is_published`
- `page`
- `page_size`

### `POST /api/admin/articles`

请求体：

```json
{
  "category_id": 1,
  "title": "AI 火炬系列活动",
  "summary": "活动简介",
  "cover_file_id": null,
  "content": "",
  "link_type": "external",
  "external_url": "https://mp.weixin.qq.com/xxx",
  "publish_at": "2026-03-18T00:00:00+08:00",
  "source_name": "微信公众号",
  "is_top": 1,
  "is_published": 1,
  "sort_order": 1
}
```

### `PUT /api/admin/articles/{id}`

### `DELETE /api/admin/articles/{id}`

## 6.4 页面区块管理

### `GET /api/admin/page-sections`

查询参数：

- `page_key`
- `section_key`
- `page`
- `page_size`

### `POST /api/admin/page-sections`

请求体：

```json
{
  "page_key": "community",
  "section_key": "intro",
  "title": "专业化智创社区",
  "subtitle": "开放共享 / 设施齐全 / 全链服务",
  "content": "页面介绍内容",
  "cover_file_id": 2,
  "extra": {
    "metrics": [
      { "label": "入驻团队", "value": "300+" }
    ]
  },
  "sort_order": 1,
  "is_published": 1
}
```

### `PUT /api/admin/page-sections/{id}`

### `DELETE /api/admin/page-sections/{id}`

## 6.5 创业服务管理

### `GET /api/admin/service-items`

查询参数：

- `module_key`
- `keyword`
- `is_published`
- `page`
- `page_size`

### `POST /api/admin/service-items`

请求体：

```json
{
  "module_key": "support_services",
  "title": "融资对接",
  "summary": "对接优质投资机构与资金",
  "icon": "Coins",
  "cover_file_id": null,
  "target_type": "internal",
  "target_value": "/services/financing",
  "tags": ["投资", "融资"],
  "sort_order": 1,
  "is_published": 1
}
```

### `PUT /api/admin/service-items/{id}`

### `DELETE /api/admin/service-items/{id}`

## 7. Admin Resource API

## 7.1 资源分类管理

### `GET /api/admin/resource-categories`

### `POST /api/admin/resource-categories`

请求体：

```json
{
  "parent_id": null,
  "name": "数据智能",
  "code": "data-intelligence",
  "resource_type": "api",
  "sort_order": 1,
  "is_enabled": 1
}
```

### `PUT /api/admin/resource-categories/{id}`

### `DELETE /api/admin/resource-categories/{id}`

## 7.2 资源条目管理

### `GET /api/admin/resource-items`

查询参数：

- `resource_type`
- `category_id`
- `keyword`
- `is_published`
- `page`
- `page_size`

### `POST /api/admin/resource-items`

请求体：

```json
{
  "category_id": 2,
  "resource_type": "api",
  "title": "AI 图像生成",
  "short_desc": "根据提示词生成图像",
  "content": "详细介绍",
  "cover_file_id": null,
  "vendor_name": "Open Platform",
  "price_text": "免费",
  "tag_list": ["免费", "支持MCP"],
  "extra": {
    "icon": "Image",
    "feature_list": ["文生图", "多风格"]
  },
  "target_type": "external",
  "target_value": "https://example.com",
  "is_recommended": 1,
  "is_published": 1,
  "sort_order": 1,
  "publish_at": "2026-04-02T10:00:00+08:00"
}
```

### `PUT /api/admin/resource-items/{id}`

### `DELETE /api/admin/resource-items/{id}`

## 8. Admin Feedback API

## 8.1 获取反馈列表

### `GET /api/admin/feedback`

查询参数：

- `status`
- `keyword`
- `page`
- `page_size`

响应示例：

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "items": [
      {
        "id": 1,
        "subject": "页面建议",
        "content": "建议增加联系方式",
        "phone": "13800138000",
        "attachment_url": "https://domain.com/uploads/feedback-1.pdf",
        "status": "pending",
        "admin_remark": "",
        "created_at": "2026-04-02T10:00:00+08:00"
      }
    ],
    "total": 1,
    "page": 1,
    "page_size": 10
  }
}
```

## 8.2 获取反馈详情

### `GET /api/admin/feedback/{id}`

## 8.3 修改反馈状态

### `PUT /api/admin/feedback/{id}/status`

请求体：

```json
{
  "status": "processing",
  "admin_remark": "已转交运营处理"
}
```

## 9. Admin System API

## 9.1 文件上传

### `POST /api/admin/upload`

请求格式：

- `multipart/form-data`

字段：

- `file`

响应：

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "id": 1,
    "file_name": "banner.png",
    "url": "https://domain.com/uploads/2026/04/banner.png"
  }
}
```

## 9.2 文件列表

### `GET /api/admin/upload-files`

## 9.3 管理员列表

### `GET /api/admin/admin-users`

## 9.4 新增管理员

### `POST /api/admin/admin-users`

请求体：

```json
{
  "username": "editor01",
  "password": "123456",
  "name": "运营编辑",
  "mobile": "13800138000",
  "email": "editor@example.com",
  "status": 1
}
```

## 9.5 更新管理员

### `PUT /api/admin/admin-users/{id}`

## 9.6 站点设置

### `GET /api/admin/site-settings`

### `PUT /api/admin/site-settings`

请求体：

```json
{
  "site_name": "OPC 厦门社区门户",
  "site_subtitle": "成为一流的数智产业生态构建者",
  "logo_file_id": 1,
  "footer_text": "© 2026 厦门 OPC 社区. All rights reserved.",
  "contact_phone": "0592-123456",
  "contact_email": "opc@example.com",
  "icp_no": "闽ICP备xxxx号"
}
```

## 10. 错误码建议

| code | 含义 |
|---|---|
| 0 | 成功 |
| 4000 | 请求参数错误 |
| 4001 | 数据校验失败 |
| 4010 | 未登录 |
| 4011 | token 无效 |
| 4030 | 无权限 |
| 4040 | 数据不存在 |
| 4090 | 数据冲突 |
| 5000 | 服务器内部错误 |

## 11. 首版接口实现优先级

### P0

- `POST /api/admin/auth/login`
- `GET /api/public/site-settings`
- `GET /api/public/banners`
- `GET /api/public/articles`
- `GET /api/public/page-sections/{page_key}`
- `GET /api/public/service-items`
- `GET /api/public/resource-items`
- `POST /api/public/feedback`
- `GET/POST/PUT` Banner 管理
- `GET/POST/PUT` 文章管理
- `GET/POST/PUT` 页面区块管理
- `GET/POST/PUT` 资源管理
- `GET /api/admin/feedback`
- `PUT /api/admin/feedback/{id}/status`
- `POST /api/admin/upload`

### P1

- 管理员管理
- 资源分类管理
- 站点设置
- 文件列表

## 12. 开发建议

建议开发顺序不是按表全做完，而是按“页面闭环”做：

1. 首页闭环
2. 动态资讯闭环
3. 社区/创业服务闭环
4. 资源集市闭环
5. 意见反馈闭环

这样每一轮都能看到真实页面效果，便于 Human Loop 验收。
