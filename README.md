# HLYQ-IDCBM

皓量云擎开源 IDC / 云计算业务管理系统，面向 IDC 与云计算服务商，提供官网、会员控制台和运营后台的一体化基础能力。

## 技术栈

- 后端：PHP 8.4、Webman、MySQL 8.0、Redis
- 运营后台：React 19、Vite、Ant Design 6
- 会员控制台：React 19、Vite、Ant Design 6
- 官网：Webman 模板引擎，支持主题切换

## 目录结构

```text
backend/           Webman 后端
frontend/admin/    运营后台
frontend/console/  会员控制台
frontend/packages/ 前端共享包
themes/            官网主题
extensions/        产品与服务插件
contracts/         API、产品和插件契约
docs/              架构及开发文档
deploy/            部署配置
```

## 本地开发

### 后端

```bash
cd backend
composer install
cp .env.example .env
php start.php start
```

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

## 分支约定

- `main`：稳定分支，用于发布可交付版本
- `codex/develop`：日常开发集成分支
- 功能与修复分支从 `codex/develop` 创建，通过 Pull Request 合并

## 开源协议

本项目基于 [GNU Affero General Public License v3.0](LICENSE) 开源。项目引用的第三方组件及上游代码继续遵循其各自许可证。
