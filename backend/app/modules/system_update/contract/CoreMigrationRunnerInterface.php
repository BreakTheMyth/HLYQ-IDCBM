<?php

declare(strict_types=1);

namespace app\modules\system_update\contract;

use app\modules\system_update\domain\MigrationDatabaseConfiguration;
use app\modules\system_update\domain\MigrationResult;
use app\modules\system_update\domain\MigrationStatus;
use app\modules\system_update\exception\SystemUpdateException;

/**
 * 定义核心数据库迁移的状态查询与执行能力。
 */
interface CoreMigrationRunnerInterface
{
    /**
     * 查询核心数据库迁移状态。
     * @param MigrationDatabaseConfiguration $configuration 数据库迁移连接配置
     * @return MigrationStatus 数据库迁移状态
     * @throws SystemUpdateException 迁移目录、连接或版本日志不可读取时抛出
     */
    public function status(MigrationDatabaseConfiguration $configuration): MigrationStatus;

    /**
     * 执行尚未应用的核心数据库迁移。
     * @param MigrationDatabaseConfiguration $configuration 数据库迁移连接配置
     * @return MigrationResult 数据库迁移执行结果
     * @throws SystemUpdateException 迁移文件缺失或执行失败时抛出
     */
    public function migrate(MigrationDatabaseConfiguration $configuration): MigrationResult;
}
