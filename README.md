# OPC 门户 + CMS 系统

一个基于 `Next.js 15 + React + FastAPI + MySQL + Docker` 的门户网站与内容管理后台项目。

当前仓库包含：

- `web`：门户前台
- `admin`：CMS 管理后台
- `server`：FastAPI 后端
- `deploy`：Docker、Nginx、SQL 初始化文件

## 功能范围

- 门户首页与原型稿样式还原
- 最新动态、社区简介、创业服务、OPC 开办、融资对接、安居落户
- 资源集市 / API 市场 / MCP 市场
- 前台手机号注册、登录、反馈提交
- 后台内容管理、反馈管理、前台用户管理
- Docker 一体化部署
- MySQL 首次启动自动导入演示数据

## 运行截图

### 门户首页

![门户首页](docs/screenshots/web-home.png)

### 前台登录页

![前台登录页](docs/screenshots/web-login.png)

### 后台登录页

![后台登录页](docs/screenshots/admin-login.png)

## 演示账号

### 后台管理员

- 账号：`admin`
- 密码：`Admin@123456`

### 前台演示用户

- 手机号：`13900001111`
- 密码：`Demo@123456`

## SQL 初始化说明

当前仓库已经提供完整的演示数据库初始化文件：

- [deploy/sql/init.sql](deploy/sql/init.sql)

这份 SQL 不是空壳表结构，而是当前项目的完整演示数据导出，包含：

- 表结构
- 核心站点配置
- 首页与内容页演示数据
- 资源市场演示数据
- 后台管理员账号
- 前台演示用户
- 反馈演示数据

Docker 模式下，MySQL 在“空数据卷首次启动”时会自动执行这份 SQL。

注意：

- 只有第一次初始化空数据库时会自动执行
- 如果你之前已经跑过一次，再次 `up -d` 不会重复导入
- 如果你想重新回到这份演示数据，需要执行 `docker compose down -v` 后再重新启动

## 推荐启动方式：Docker

### 1. 进入项目目录

```powershell
Set-Location C:\Users\Jackson Chan\Desktop\OPC项目原型图20260330
```

### 2. 准备根目录 `.env`

如果还没有 `.env`，先复制：

```powershell
Copy-Item .env.example .env
```

### 3. 一键启动

```powershell
docker compose -f deploy/docker/docker-compose.yml up -d --build
```

### 4. 访问地址

- 前台首页：`http://127.0.0.1/`
- 前台登录：`http://127.0.0.1/login`
- 后台登录：`http://127.0.0.1/admin/login`
- 健康检查：`http://127.0.0.1/health`

### 5. 查看状态

```powershell
docker compose -f deploy/docker/docker-compose.yml ps
```

## 本地开发启动

如果你不是部署，而是需要本地联调开发，可以分别启动：

### 1. 启动 MySQL

```powershell
Set-Location C:\Users\Jackson Chan\Desktop\OPC项目原型图20260330
docker compose -f deploy/docker/docker-compose.yml up -d mysql
```

### 2. 启动后端

```powershell
Set-Location C:\Users\Jackson Chan\Desktop\OPC项目原型图20260330\server
.\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

### 3. 启动前台

```powershell
Set-Location C:\Users\Jackson Chan\Desktop\OPC项目原型图20260330\web
npm.cmd run dev
```

### 4. 启动后台

```powershell
Set-Location C:\Users\Jackson Chan\Desktop\OPC项目原型图20260330\admin
npm.cmd run dev -- --host 127.0.0.1 --port 5174
```

本地开发访问地址：

- Web：`http://127.0.0.1:3000`
- Admin：`http://127.0.0.1:5174/login`
- API：`http://127.0.0.1:8000/health`

## 常用命令

### 查看日志

```powershell
docker compose -f deploy/docker/docker-compose.yml logs -f
```

### 停止服务

```powershell
docker compose -f deploy/docker/docker-compose.yml down
```

### 清空数据库并重置成演示数据

```powershell
docker compose -f deploy/docker/docker-compose.yml down -v
docker compose -f deploy/docker/docker-compose.yml up -d --build
```

## 相关文档

- [deployment-runbook.md](deployment-runbook.md)
- [spec-kit-mvp.md](spec-kit-mvp.md)
- [api-spec-mvp.md](api-spec-mvp.md)
- [ui-to-cms-mapping.md](ui-to-cms-mapping.md)
- [delivery-slices.md](delivery-slices.md)
