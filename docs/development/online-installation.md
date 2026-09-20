# 在线安装器开发与发布说明

## 目标

发行包只需要包含 `backend/`。运营后台、会员控制台和安装器都在发布前完成构建，产物随 Webman 后端一起交付；客户服务器无需安装 Node.js，也不会在浏览器运行时访问 CDN。

## 访问与安装状态

- 未安装时访问 `/`、`/console` 或自定义后台路径会跳转到 `/install`。
- 未安装时，除安装接口以外的 `/api/*` 返回 HTTP 503，并携带安装入口。
- 安装成功后访问 `/install` 会跳转到自定义后台路径，安装接口拒绝重复执行。
- 安装状态以 `.env` 中的 `APP_INSTALLED=true` 为最终判定；`runtime/install/installed.json` 只用于保存非敏感安装摘要。
- 自定义后台路径在安装时写入 `.env`，路由会先匹配核心和插件路由，再由 fallback 判断后台入口，避免覆盖插件路由。

## 安装流程

1. 阅读宁波皓量云擎网络科技有限公司《皓量云擎业务管理系统软件使用协议》并明确勾选同意；社区版代码的许可权利仍以仓库 AGPL-3.0 为准。
2. 检测 PHP 8.4、必需扩展、`.env` 与 `runtime/` 写权限及安装器静态资源。
3. 配置并实际测试 MySQL 8.0 与 Redis 连接；只有连接测试成功后才允许进入下一步。数据表前缀固定为 `hlyq_`，Redis 安装配置只使用密码认证，不展示 ACL 用户名。
4. 配置网站名称与地址、自定义或随机后台路径，以及管理员昵称、账号和密码；初始网站标题自动与网站名称保持一致，网站描述留空，管理员账号与密码可分别随机生成。
5. 分阶段创建基础表、写入系统数据、原子生成 `.env`、写入安装标记，并返回实时阶段进度。
6. 使用 Ant Design `Result` 展示成功或失败结果；成功时提供首页、后台、管理员信息及单项/全部复制。

管理员账号为 6 至 32 位，必须以英文字母开头，且只能包含英文字母、数字和下划线。管理员密码至少 8 位，并同时包含大写字母、小写字母、数字和特殊字符。密码只以哈希形式进入数据库；明文密码仅存在于当前安装页面的表单状态中，不写入 `.env`、安装摘要或服务端响应。安装记录会保存用户同意的软件使用协议版本和同意时间，便于后续审计。

仓库内置的软件使用协议是产品初稿，正式对外发布前应由宁波皓量云擎网络科技有限公司的法务或受托律师结合实际销售模式、商业版授权和隐私政策完成定稿。

## 安全与恢复

- 安装写接口要求同源 Session 与 256 位安装令牌。
- `runtime/install/operation.lock` 保证并发阶段串行执行，`active.json` 阻止不同浏览器会话同时安装，活动锁 30 分钟过期。
- 服务端会记录已完成阶段并按阶段锁定配置：数据库步骤成功后锁定 MySQL/Redis，系统数据步骤成功后再锁定网站与管理员信息；既禁止跳过步骤执行最终安装，也允许失败阶段在尚未落库前修正配置。
- 表结构使用 `CREATE TABLE IF NOT EXISTS`，系统数据使用幂等写入；数据库步骤失败后可以修复配置再重试。
- `.env` 通过同目录临时文件原子替换并设置为 `0600`。只有所有步骤完成后才写入 `APP_INSTALLED=true`。
- 安装页启用仅允许同源资源的 CSP；HTTPS 站点会自动写入安全 Session Cookie 配置。
- 安装完成会尝试安排 Webman 平滑重载；若运行环境不支持信号，需由运维手动执行 `php start.php reload`。
- Web 服务器的站点根目录必须指向 `backend/public/`，不得直接暴露 `backend/`。

## 本地依赖与构建产物

安装器离线使用固定版本 Ant Design 6.6.4。Ant Design JavaScript 与 React 一起由 Vite 打入安装器应用产物，避免外置 UMD 与 React 运行时不一致；浏览器运行期间不会访问 CDN。样式文件使用预先下载的本地发行文件：

```text
backend/public/install-assets/vendor/antd.css
```

安装器自身仍使用 React 19 和 Vite 开发，构建后的 JavaScript/CSS 位于 `backend/public/install-assets/app/`。另外两个应用分别构建到 `backend/public/app/admin/` 与 `backend/public/app/console/`。

从仓库根目录依次执行：

```bash
cd frontend/install
pnpm install --frozen-lockfile
pnpm lint
pnpm build

cd ../admin
pnpm install --frozen-lockfile
pnpm lint
pnpm build

cd ../console
pnpm install --frozen-lockfile
pnpm lint
pnpm build
```

构建结果需要纳入发行包。安装器依赖文件升级时，必须同时更新版本锁定、许可证文件并重新完成浏览器验收。

## 后端验证

```bash
cd backend
composer install
composer validate --no-check-publish
find app config support tests -type f -name '*.php' -print0 | xargs -0 -n1 php -l
vendor/bin/phpunit
php webman route:list
```

完成验证后，发行目录使用 `composer install --no-dev --classmap-authoritative` 安装生产依赖。用于上传的发行包应包含生产 Composer 依赖，但不应包含开发机的 `.env`、`runtime/` 内容、日志、测试数据库凭据或其他敏感数据。首次启动前确保 PHP 进程用户能创建/写入 `.env` 与 `runtime/`，安装结束后可收紧 `.env` 权限。
