# HLYQ-IDCBM 项目协作规范

## 适用范围

本文件适用于整个仓库。子目录若存在更具体的 `AGENTS.md`，以离目标文件最近的规范为补充；冲突时遵循更高优先级的系统、用户和仓库规则。

## 沟通语言

- 项目讨论、任务说明、代码审查结论和交付说明统一使用中文。
- Git 提交标题、提交正文和 Pull Request 描述统一使用中文。
- 代码标识符、协议字段、数据库字段和第三方 API 名称保持英文，不做生硬翻译。

## 项目技术栈

- 后端：PHP 8.4、Webman、MySQL 8.0、Redis。
- 运营后台：React 19、TypeScript、Vite、Ant Design 6。
- 会员控制台：React 19、TypeScript、Vite、Ant Design 6。
- 官网：由 Webman 渲染，支持主题切换。
- 开源协议：AGPL-3.0；第三方依赖继续遵循各自许可证。

## 目录边界

- `backend/`：Webman 后端、官网渲染、插件和主题运行环境。
- `backend/app/`：核心业务代码。核心产品、订单、客户、财务、营销和履约能力不得为追求“可插拔”而全部插件化。
- `backend/plugin/`：Webman 应用插件目录，用于可独立安装、升级、禁用和卸载的扩展。
- `backend/themes/`：官网主题模板源码；主题静态资源应发布到受控的公开目录。
- `frontend/admin/`：运营后台独立 Vite 应用。
- `frontend/console/`：会员控制台独立 Vite 应用。
- `frontend/packages/`：两个前端共享的 API、类型、Schema 渲染器和通用组件。
- `contracts/`：OpenAPI、JSON Schema、插件清单、产品配置和跨端公共契约。
- `docs/`：架构、开发、插件、主题和部署文档。
- `deploy/`：Docker、Nginx、安装和发布配置。
- `.agents/skills/`：项目级开发 Skill，除非任务明确要求，否则不要修改。

禁止直接修改 `vendor/`、`node_modules/`、`dist/` 和 `runtime/` 中的生成内容。

## 后端架构规范

后端按 DDD 分层组织，新增业务优先使用以下边界：

```text
backend/app/
├── controller/       HTTP 入口、参数接收和响应转换
├── application/      用例编排、事务边界和应用服务
├── domain/           实体、值对象、领域服务、领域事件和业务规则
├── contract/         Repository、Gateway 和外部能力接口
├── infrastructure/   数据库、Redis、队列和第三方接口实现
└── shared/           跨领域且稳定的公共能力
```

- Controller 不直接访问 Model、数据库或第三方接口，必须经过应用服务。
- Domain 不得依赖 `Request`、`Response`、`Db`、`Redis` 或其他 Webman/Illuminate 基础设施类。
- Application 依赖接口，不依赖 Infrastructure 的具体实现。
- Infrastructure 必须实现 `contract/` 中的接口，并通过容器完成绑定。
- 核心领域不得出现供应商专属字段；供应商字段通过产品契约、能力声明和映射规则转换。
- PHP 文件使用 `declare(strict_types=1);`，参数、属性和返回值必须声明类型。
- 类默认声明为 `final`；不可变数据优先使用 `readonly`。
- `app/` 下目录统一使用小写，多单词目录使用下划线；命名空间必须与目录一致。
- Webman 是常驻内存、多进程应用，不得把请求、当前用户、Session 或事务状态保存在静态属性、单例或全局变量中。
- 配置、进程和 Composer 依赖变更必须明确 reload/restart 边界。

## 插件规范

- 普通项目内模块放在 `backend/app/`；只有具备独立安装、版本和生命周期的能力才放入 `backend/plugin/`。
- 插件标识仅使用小写字母、数字和下划线，发布后不得随意修改。
- 插件必须通过 Core 定义的 Contract、事件和 DTO 交互，不得直接修改核心领域对象或依赖内部实现类。
- 每个插件必须声明唯一 ID、版本、系统兼容范围、插件类型、权限、依赖、入口、迁移和静态资源。
- 插件安装包不得包含 `.env`、密钥、生产连接信息、日志、测试上传物或 `node_modules`。
- 插件涉及前端时，客户服务器只安装预构建产物，不执行 `npm install` 或现场编译。
- 表单、产品参数和普通列表优先使用 Schema UI；小型扩展使用受控 Slot；复杂独立页面使用隔离的 iframe 与稳定 SDK 通信。
- 插件安装、升级和卸载脚本视为高风险变更，必须支持重复执行检查、失败处理和明确的数据保留策略。
- 应用商店分发经过构建、校验和签名的不可变安装包，不直接分发工作区源码。

## 主题规范

- 主题目录使用 `backend/themes/<theme_id>/`，至少包含主题清单、模板、静态资源和预览图。
- 主题 ID 和模板名称必须通过白名单解析，禁止将请求参数直接拼接为模板路径。
- 第三方主题不得包含可执行 PHP 文件；模板变量默认转义，未经净化的数据不得使用 raw 输出。
- 主题模板不放入 `public/`；只有需要公开访问的版本化静态资源才能发布到公开目录。
- 主题上传和安装必须校验文件类型、路径穿越、压缩炸弹、版本兼容和完整性。

## 前端规范

- 两个前端应用保持独立构建、独立路由和独立部署，不得跨目录直接引用彼此的 `src/`。
- 共享代码进入 `frontend/packages/`，通过明确的包入口引用。
- TypeScript 禁止使用 `any`；外部数据先定义类型并在边界完成校验。
- 组件优先使用 Ant Design 6 和项目已有组件，不重复实现已有基础组件。
- 全局主题色固定为 `#1677FF`，矩形组件全局圆角固定为 `2px`；头像、状态点等语义元素可以为圆形。
- 页面必须处理加载、空数据、错误、无权限和提交中状态。
- API 地址、路由和权限标识集中管理，不在页面组件中散落硬编码。
- 视觉改动除 lint/build 外，应检查桌面端和移动端关键尺寸、溢出及控制台错误。

## 数据与安全

- 金额统一使用整数最小货币单位存储和计算，不使用浮点数参与结算。
- 数据库迁移必须可审查；不可逆变更需提供备份、灰度或回退说明。
- 不提交真实 `.env`、访问令牌、私钥、数据库密码或生产地址。
- 日志不得记录密码、Authorization、Cookie、完整支付数据和未脱敏个人信息。
- `public/` 是唯一公开文件边界，配置、模板源码、私有上传、日志和迁移不得放入公开目录。
- 所有后台、会员和插件接口必须分别完成认证、权限和对象归属校验。

## 验证要求

根据改动范围执行最小充分验证，并在交付时说明实际执行结果。

后端常用检查：

```bash
cd backend
composer validate --no-check-publish
find app config support -type f -name '*.php' -print0 | xargs -0 -n1 php -l
vendor/bin/phpunit
```

运营后台：

```bash
cd frontend/admin
pnpm lint
pnpm build
```

会员控制台：

```bash
cd frontend/console
pnpm lint
pnpm build
```

- 文档或单一目录改动无需机械执行全部测试，但必须运行与风险相称的检查。
- 不得把语法检查描述成数据库、网络、多进程或生产环境验证。
- 已存在且与本次无关的失败必须明确说明，不得为了通过检查擅自修改无关代码。

## Git 工作流

- `main` 是默认和稳定分支；外部贡献者通过 Fork + Pull Request 参与开发。
- 项目协作者从 `main` 创建短期功能或修复分支，完成后向 `main` 提交 Pull Request。
- 普通贡献分支建议使用 `feature/<name>`、`fix/<name>`、`docs/<name>`；自动化代理同时遵循其运行环境要求的分支前缀。
- 每个提交只包含一个清晰目标，不混入无关格式化、生成文件或用户未授权的修改。
- 提交前检查 `git status`、暂存差异、敏感信息和大文件。
- 未经明确授权，不执行强制推送、历史重写、标签发布、Release 发布或破坏性 Git 操作。

### Git 提交信息

提交格式统一为：

```text
<类型>(<范围>): <中文描述>
```

范围可省略。类型使用以下固定英文标识，冒号后的标题必须使用中文：

- `feat`：新增功能。
- `fix`：修复问题。
- `refactor`：不改变外部行为的重构。
- `perf`：性能优化。
- `docs`：文档变更。
- `test`：测试变更。
- `build`：构建或依赖变更。
- `ci`：持续集成变更。
- `chore`：其他维护工作。
- `revert`：回退提交。

正确示例：

```text
feat(order): 增加订单退款审核流程
fix(plugin): 修复插件升级失败后的回滚问题
docs: 补充主题开发规范
chore: 初始化项目协作规范
```

禁止使用纯英文或含糊描述，例如 `update files`、`fix bug`、`changes`。需要提交正文时，使用中文说明改动原因、影响范围、迁移方式和验证结果；破坏性变更在正文或 Footer 中明确标注。
