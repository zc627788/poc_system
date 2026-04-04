# OPC 项目 Docker 部署说明

这份文档按“新手第一次部署”来写，默认你使用的是 Windows + Docker Desktop + PowerShell。

如果你只想先把项目跑起来，直接看“首次部署”这一节即可。  
如果你要交付给别人运维，建议整份看完。

## 1. 这份文档能部署什么

执行完本文档后，你会得到一套完整可访问的服务：

- 门户前台：`http://127.0.0.1/`
- 管理后台：`http://127.0.0.1/admin/login`
- API 健康检查：`http://127.0.0.1/health`
- 公开接口示例：`http://127.0.0.1/api/public/site-settings`

项目会通过 Docker 一次性启动这 5 个服务：

- `mysql`：数据库
- `api`：FastAPI 后端
- `web`：Next.js 前台
- `admin`：React + Vite 后台
- `nginx`：统一入口，负责把 `/`、`/admin`、`/api` 分发到对应服务

另外，MySQL 首次启动时会自动执行：

- [deploy/sql/init.sql](deploy/sql/init.sql)

## 2. 部署前准备

请先确认下面几件事：

- 已安装 Docker Desktop
- Docker Desktop 已经启动，并且右下角状态正常
- 当前电脑的 `80` 端口没有被其他程序占用
- 项目代码已经在本地目录中，例如：`C:\Users\Jackson Chan\Desktop\OPC项目原型图20260330`

你可以先打开 PowerShell，执行下面两条命令检查 Docker：

```powershell
docker --version
docker compose version
```

如果两条命令都有输出，就说明 Docker 环境没问题。

## 3. 首次部署

### 第 1 步：进入项目根目录

```powershell
Set-Location C:\Users\Jackson Chan\Desktop\OPC项目原型图20260330
```

你后面的命令，默认都在这个目录执行。

### 第 2 步：准备根目录 `.env`

项目根目录有一个示例文件：`.env.example`。  
如果你还没有 `.env`，就复制一份：

```powershell
Copy-Item .env.example .env
```

然后打开 `.env`，至少确认这几项：

```env
MYSQL_DATABASE=opc_portal
MYSQL_USER=opc
MYSQL_PASSWORD=opc123456
MYSQL_ROOT_PASSWORD=root123456
JWT_SECRET_KEY=replace-me-with-a-long-random-string
NEXT_PUBLIC_SITE_URL=http://localhost
```

说明：

- `MYSQL_*` 是数据库账号密码
- `JWT_SECRET_KEY` 是登录签名密钥，正式环境一定要改成你自己的随机字符串
- `NEXT_PUBLIC_SITE_URL` 是网站对外访问地址

如果你只是本机测试，可以先保持：

```env
NEXT_PUBLIC_SITE_URL=http://localhost
```

如果你部署到服务器并绑定域名，例如 `https://opc.example.com`，那就改成：

```env
NEXT_PUBLIC_SITE_URL=https://opc.example.com
```

### 第 3 步：一键启动 Docker 服务

```powershell
docker compose -f deploy/docker/docker-compose.yml up -d --build
```

这条命令会做 3 件事：

- 构建前台、后台、后端镜像
- 启动 MySQL、API、Web、Admin、Nginx 容器
- 自动建立容器之间的网络连接

第一次执行会比较慢，通常要等几十秒到几分钟，取决于你的网络和电脑性能。

### 第 4 步：查看容器是否启动成功

```powershell
docker compose -f deploy/docker/docker-compose.yml ps
```

理想状态下，你会看到：

- `opc-mysql`：`healthy`
- `opc-api`：`healthy`
- `opc-web`：`Up`
- `opc-admin`：`Up`
- `opc-nginx`：`Up`

如果刚启动时 `api` 还是 `starting`，等 10 到 20 秒再看一次即可。

## 4. 首次启动后，系统会自动做什么

这套 Docker 部署已经处理好了“初始化”逻辑，所以你不需要再手动执行 `init_db.py` 或 `seed.py`。

首次启动时，系统会自动：

- 创建数据库
- 自动执行 `deploy/sql/init.sql`
- 导入完整演示表结构和演示数据
- 启动 API / Web / Admin / Nginx

默认后台账号：

- 用户名：`admin`
- 密码：`Admin@123456`

说明：

- 如果你之前已经部署过，并且没有删除 Docker 数据卷，那么原来的数据会保留
- MySQL 官方镜像只会在“空数据目录首次启动”时执行 `docker-entrypoint-initdb.d` 下的 SQL
- 如果你想保留 CMS 里的真实内容，不要随便执行“清空数据卷”的命令

## 5. 启动成功后怎么访问

统一入口是 Nginx，所以 Docker 模式下请用下面这些地址：

- 前台首页：`http://127.0.0.1/`
- 后台登录页：`http://127.0.0.1/admin/login`
- API 健康检查：`http://127.0.0.1/health`
- 公开接口示例：`http://127.0.0.1/api/public/site-settings`

注意：

- Docker 模式下，优先走 `80` 端口的统一入口
- 不需要手动去访问 `3000`、`5174`、`8000`

## 6. 快速验收流程

建议你第一次部署完，至少做下面 4 步检查。

### 验收 1：检查首页是否能打开

浏览器访问：

```text
http://127.0.0.1/
```

能正常打开首页，就说明：

- `nginx` 正常
- `web` 正常
- 前台静态资源正常

### 验收 2：检查后台登录页是否能打开

浏览器访问：

```text
http://127.0.0.1/admin/login
```

如果登录页正常显示，就说明：

- `/admin` 路由正常
- 后台静态资源正常

### 验收 3：检查后端健康接口

浏览器访问：

```text
http://127.0.0.1/health
```

正确返回应该是：

```json
{"status":"ok"}
```

### 验收 4：检查公开 API

浏览器访问：

```text
http://127.0.0.1/api/public/site-settings
```

如果能返回 JSON，说明：

- `nginx -> api` 转发正常
- FastAPI 正常
- MySQL 正常

### 验收 5：确认演示数据已导入

建议再登录后台确认一下这 3 件事：

- 顶部导航已经有 6 个菜单
- 首页能看到 Banner、最新动态和资源市场数据
- 后台反馈中心已经有演示反馈记录

## 7. 常用运维命令

### 查看容器状态

```powershell
docker compose -f deploy/docker/docker-compose.yml ps
```

### 查看全部日志

```powershell
docker compose -f deploy/docker/docker-compose.yml logs
```

### 持续查看某个服务日志

看后端日志：

```powershell
docker compose -f deploy/docker/docker-compose.yml logs -f api
```

看前台日志：

```powershell
docker compose -f deploy/docker/docker-compose.yml logs -f web
```

看后台日志：

```powershell
docker compose -f deploy/docker/docker-compose.yml logs -f admin
```

看 Nginx 日志：

```powershell
docker compose -f deploy/docker/docker-compose.yml logs -f nginx
```

### 停止项目

```powershell
docker compose -f deploy/docker/docker-compose.yml down
```

这条命令只会停掉容器，不会删数据库数据。

### 再次启动项目

```powershell
docker compose -f deploy/docker/docker-compose.yml up -d
```

### 修改代码后重新构建并启动

```powershell
docker compose -f deploy/docker/docker-compose.yml up -d --build
```

### 只重启某一个服务

例如重启 Nginx：

```powershell
docker compose -f deploy/docker/docker-compose.yml restart nginx
```

## 8. 如何彻底重置数据库

这一步非常危险，只建议在“本地测试数据不要了”的情况下执行。

```powershell
docker compose -f deploy/docker/docker-compose.yml down -v
```

这条命令会：

- 停止容器
- 删除数据库卷
- 清空 MySQL 里的所有数据

执行后再次 `up -d --build`，系统会重新创建一套全新的默认数据。

这里的“默认数据”来源就是：

- [deploy/sql/init.sql](C:\Users\Jackson Chan\Desktop\OPC项目原型图20260330\deploy\sql\init.sql)

## 9. 常见问题处理

### 问题 1：提示 `port 80 is already allocated`

说明有别的程序占用了 `80` 端口。

先查是谁占用：

```powershell
Get-NetTCPConnection -LocalPort 80 -State Listen
```

如果你确认可以结束它，再根据 `OwningProcess` 查进程：

```powershell
Get-Process -Id <进程ID>
```

你也可以不处理占用，改成别的端口再启动。  
做法是修改 [`docker-compose.yml`](C:\Users\Jackson Chan\Desktop\OPC项目原型图20260330\deploy\docker\docker-compose.yml) 中 `nginx` 的端口映射，例如改成：

```yaml
ports:
  - "8080:80"
```

改完后重新执行：

```powershell
docker compose -f deploy/docker/docker-compose.yml up -d --build
```

然后通过 `http://127.0.0.1:8080/` 访问。

### 问题 2：`api` 一直起不来

先看日志：

```powershell
docker compose -f deploy/docker/docker-compose.yml logs -f api
```

常见原因：

- MySQL 还没完全启动
- `.env` 里的数据库账号密码写错
- 机器内存太紧张

一般先等 10 到 30 秒，再执行一次：

```powershell
docker compose -f deploy/docker/docker-compose.yml ps
```

### 问题 3：后台地址打不开

请确认你访问的是：

```text
http://127.0.0.1/admin/login
```

不是：

- `http://127.0.0.1:5174`
- `http://127.0.0.1/admin`

如果你输的是 `/admin`，系统会自动跳转到 `/admin/`。

### 问题 4：修改了 `.env` 但是页面没变化

前台里的部分配置会在镜像构建时写入，所以改完 `.env` 后要重新构建：

```powershell
docker compose -f deploy/docker/docker-compose.yml up -d --build
```

只执行 `restart` 不够。

## 10. 上线前建议

如果你要把这套项目正式部署到服务器，建议至少再做下面几件事：

- 把 `.env` 里的 `JWT_SECRET_KEY` 改成强随机字符串
- 把 MySQL 密码改掉
- 把 `NEXT_PUBLIC_SITE_URL` 改成正式域名
- 给 Nginx 加 HTTPS
- 定期备份 MySQL 数据卷
- 后台地址最好做 IP 白名单或内网限制

## 11. 这份文档对应的当前实际状态

这份文档不是纸上说明，而是按当前项目真实配置验证过的。

本次已实际验证通过的内容：

- `docker compose -f deploy/docker/docker-compose.yml config`
- `web` 构建成功
- `admin` 构建成功
- Docker 栈成功启动
- `http://127.0.0.1/` 返回 `200`
- `http://127.0.0.1/admin/login` 返回 `200`
- `http://127.0.0.1/health` 返回 `{"status":"ok"}`

如果你后面继续改 Docker 配置，记得同步更新这份文档。
