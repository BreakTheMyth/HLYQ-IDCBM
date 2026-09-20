# 皓量云擎业务管理系统

皓量云擎业务管理系统是一套开源的 IDC / 云计算业务管理系统，面向 IDC 与云计算服务商，提供官网、会员控制台和运营后台的一体化基础能力。

## 技术栈

- 后端：PHP 8.4、Webman、MySQL 8.0、Redis
- 运营后台：React 19、Vite、Ant Design 6
- 会员控制台：React 19、Vite、Ant Design 6
- 官网：Webman 模板引擎，支持主题切换

## 目录结构

```text
backend/             Webman 后端
backend/plugin/      Webman 应用插件
backend/themes/      官网主题
frontend/admin/      运营后台
frontend/console/    会员控制台
frontend/install/    在线安装器
frontend/packages/   前端共享包
contracts/           API、产品和插件契约
docs/                架构及开发文档
deploy/              部署配置
```

## 本地开发

### 后端

```bash
cd backend
composer install
cp .env.example .env
php start.php start
```

后端新增业务接口前请先阅读 [Webman 后端路由开发规范](docs/development/backend-routing.md)。

### 运营后台

```bash
cd frontend/admin
pnpm install
pnpm dev
```

### 会员控制台

```bash
cd frontend/console
pnpm install
pnpm dev
```

### 在线安装

三个前端应用的生产构建产物会写入 `backend/public/`。制作发行包时只需交付包含 Composer 生产依赖和前端构建产物的 `backend/`；站点根目录必须指向 `backend/public/`。首次访问域名时，系统会自动跳转到 `/install` 完成环境检测、数据库和系统配置。

详细的构建、安装状态、安全与失败恢复说明见 [在线安装器开发与发布说明](docs/development/online-installation.md)。

## 分支约定

- `main`：默认和稳定分支，所有变更通过 Pull Request 合并
- 外部贡献者先 Fork 本仓库，再在自己的 Fork 中创建 `feature/*` 或 `fix/*` 分支
- 项目协作者从 `main` 创建短期功能或修复分支，完成后向 `main` 提交 Pull Request

## 开源协议

本项目基于 [GNU Affero General Public License v3.0](LICENSE) 开源。项目引用的第三方组件及上游代码继续遵循其各自许可证。
