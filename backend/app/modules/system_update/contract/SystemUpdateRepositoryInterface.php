<?php

declare(strict_types=1);

namespace app\modules\system_update\contract;

use app\modules\system_update\domain\MigrationDatabaseConfiguration;
use app\modules\system_update\exception\SystemUpdateException;

/**
 * 定义系统版本与升级执行记录的持久化能力。
 */
interface SystemUpdateRepositoryInterface
{
    /**
     * 获取数据库记录的当前系统版本。
     * @param MigrationDatabaseConfiguration $configuration 数据库迁移连接配置
     * @return string|null 当前系统版本，未安装时返回 null
     * @throws SystemUpdateException 系统版本读取失败时抛出
     */
    public function currentVersion(MigrationDatabaseConfiguration $configuration): ?string;

    /**
     * 创建升级执行记录。
     * @param MigrationDatabaseConfiguration $configuration 数据库迁移连接配置
     * @param string                         $fromVersion    来源版本
     * @param string                         $targetVersion  目标版本
     * @return int|null 升级记录编号，记录表尚不存在时返回 null
     * @throws SystemUpdateException 升级记录写入失败时抛出
     */
    public function begin(
        MigrationDatabaseConfiguration $configuration,
        string $fromVersion,
        string $targetVersion,
    ): ?int;

    /**
     * 标记升级成功并同步数据库系统版本。
     * @param MigrationDatabaseConfiguration $configuration 数据库迁移连接配置
     * @param int|null                       $runId          升级记录编号
     * @param string                         $fromVersion    来源版本
     * @param string                         $targetVersion  目标版本
     * @return void
     * @throws SystemUpdateException 系统版本或升级记录更新失败时抛出
     */
    public function complete(
        MigrationDatabaseConfiguration $configuration,
        ?int $runId,
        string $fromVersion,
        string $targetVersion,
    ): void;

    /**
     * 标记升级失败。
     * @param MigrationDatabaseConfiguration $configuration 数据库迁移连接配置
     * @param int|null                       $runId          升级记录编号
     * @param string                         $message        已脱敏错误摘要
     * @return void
     */
    public function fail(
        MigrationDatabaseConfiguration $configuration,
        ?int $runId,
        string $message,
    ): void;
}
