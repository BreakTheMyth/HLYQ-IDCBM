# 数据库迁移与系统版本更新规范

## 目标

核心数据表结构统一由 Phinx 迁移管理。首次在线安装和已安装系统升级执行同一组迁移，禁止继续在安装器、控制器、应用服务或发布脚本中维护另一套建表 SQL。

系统版本与数据库迁移版本相互独立：

- `backend/config/version.php` 保存当前代码包版本和允许直接升级的最低来源版本。
- `hlyq_installation.version` 保存数据库最后成功更新到的系统版本。
- `hlyq_migration_versions` 由 Phinx 管理，记录已经执行的核心迁移。
- `hlyq_system_update_runs` 记录升级来源版本、目标版本、执行状态和失败摘要。

数据表前缀来自 `DB_PREFIX`，默认且在线安装固定使用 `hlyq_`。

## 目录

```text
backend/
├── database/
│   └── migrations/              核心数据库迁移
├── app/modules/system_update/   迁移执行、版本检查与升级记录
├── app/command/                 安全的系统迁移命令
├── config/version.php           代码包版本
└── phinx.php                    Phinx 开发配置
```

插件不得把迁移放入核心迁移目录。具备独立生命周期的插件应在自己的目录保存迁移，并使用插件 ID 隔离迁移记录；该能力随应用中心和插件安装器实现。

## 开发新迁移

在 `backend/` 目录创建迁移：

```bash
php vendor/bin/phinx create AddStatusToProducts
```

迁移文件必须满足以下要求：

1. 使用无前缀逻辑表名，例如 `products`，由迁移执行器统一添加 `hlyq_`。
2. 已提交、发布或可能在任何环境执行过的迁移不得修改；修复必须新增前向迁移。
3. 新增结构优先使用可回滚的 `change()`；涉及数据转换、删除或不可逆变更时使用明确的 `up()`/`down()`。
4. 不可逆迁移的 `down()` 必须抛出 `IrreversibleMigrationException`，不得伪造成功回滚。
5. 大表索引、字段类型修改和历史数据回填必须评估锁表、执行时间、磁盘空间和中断恢复。
6. 采用“先扩展、再迁移、后收缩”：先发布兼容字段，再回填数据，最后在后续版本删除旧结构。

## 状态检查与执行

只读检查使用：

```bash
php webman system:migration-status
```

生产执行前必须完成数据库备份，然后运行：

```bash
php webman system:migrate
```

非交互部署需要明确确认已经完成备份：

```bash
php webman system:migrate --no-interaction --force
```

`system:migrate` 会执行以下保护：

1. 读取代码版本、数据库版本和 Phinx 迁移日志。
2. 拒绝数据库版本高于代码版本的降级运行。
3. 拒绝低于 `minimum_upgrade_version` 的跨版本直接升级。
4. 拒绝数据库已经记录、但当前代码包缺失的迁移文件。
5. 写入升级运行记录并执行全部待处理迁移。
6. 迁移成功后更新 `hlyq_installation.version`，失败时保留失败摘要。

直接执行 `php vendor/bin/phinx migrate` 不会同步系统版本和升级运行记录，因此只允许在隔离开发环境调试，不作为产品升级入口。

## 首次安装与旧安装兼容

在线安装器通过核心迁移执行器创建表结构，然后写入管理员和系统初始数据。基础迁移会检测旧安装器已经创建的 `system_settings`、`admin_users` 和 `installation` 表：存在时保留原表及数据，并补充迁移日志和系统升级记录表。

这项基线兼容只负责接管当前已知的旧安装结构。以后任何字段差异都必须通过新的迁移显式修复，不能依赖 `CREATE TABLE IF NOT EXISTS` 自动同步字段。

## 发布顺序

推荐发布流程：

1. 确认目标版本和来源版本兼容范围。
2. 备份数据库、`.env`、插件清单和持久化上传目录。
3. 上传并校验不可变发布包。
4. 执行 `php webman system:migration-status`。
5. 进入维护模式并运行 `php webman system:migrate --no-interaction --force`。
6. 替换或切换程序版本，清理必要缓存并重载 Webman。
7. 执行健康检查、关键读写验证和迁移状态复查。
8. 退出维护模式。

MySQL DDL 不保证全部变更都能随应用事务回滚。生产故障优先采用前向修复迁移；代码回退必须确保旧代码仍兼容已经升级的数据库结构。
