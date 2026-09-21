<?php

declare(strict_types=1);

namespace app\modules\system_update\application;

use app\modules\system_update\contract\CoreMigrationRunnerInterface;
use app\modules\system_update\contract\SystemMigrationLockInterface;
use app\modules\system_update\contract\SystemUpdateRepositoryInterface;
use app\modules\system_update\domain\MigrationDatabaseConfiguration;
use app\modules\system_update\domain\MigrationResult;
use app\modules\system_update\domain\SystemMigrationStatus;
use app\modules\system_update\exception\SystemUpdateException;
use Throwable;

/**
 * 编排系统版本检查、核心数据库迁移和升级记录持久化。
 */
final readonly class SystemMigrationService
{
    /**
     * 初始化系统数据库迁移应用服务。
     * @param CoreMigrationRunnerInterface    $migrations 核心数据库迁移执行器
     * @param SystemUpdateRepositoryInterface $updates    系统更新仓储
     * @param SystemMigrationLockInterface    $lock       系统数据库迁移锁
     */
    public function __construct(
        private CoreMigrationRunnerInterface $migrations,
        private SystemUpdateRepositoryInterface $updates,
        private SystemMigrationLockInterface $lock,
    ) {
    }

    /**
     * 查询代码版本、数据库版本和迁移状态。
     * @param MigrationDatabaseConfiguration $configuration 数据库迁移连接配置
     * @param string                         $codeVersion    当前代码包版本
     * @return SystemMigrationStatus 系统数据库迁移综合状态
     * @throws SystemUpdateException 版本或迁移状态读取失败时抛出
     */
    public function status(
        MigrationDatabaseConfiguration $configuration,
        string $codeVersion,
    ): SystemMigrationStatus {
        return new SystemMigrationStatus(
            $codeVersion,
            $this->updates->currentVersion($configuration),
            $this->migrations->status($configuration),
        );
    }

    /**
     * 执行核心数据库迁移并将数据库版本推进到当前代码版本。
     * @param MigrationDatabaseConfiguration $configuration        数据库迁移连接配置
     * @param string                         $targetVersion        当前代码包目标版本
     * @param string                         $minimumSourceVersion 允许直接升级的最低来源版本
     * @return MigrationResult 数据库迁移执行结果
     * @throws SystemUpdateException 系统未安装、版本不兼容或迁移失败时抛出
     */
    public function migrate(
        MigrationDatabaseConfiguration $configuration,
        string $targetVersion,
        string $minimumSourceVersion,
    ): MigrationResult {
        return $this->lock->synchronized(fn (): MigrationResult => $this->migrateLocked(
            $configuration,
            $targetVersion,
            $minimumSourceVersion,
        ));
    }

    /**
     * 在已经取得迁移锁后执行版本校验、数据库迁移和结果记录。
     * @param MigrationDatabaseConfiguration $configuration        数据库迁移连接配置
     * @param string                         $targetVersion        当前代码包目标版本
     * @param string                         $minimumSourceVersion 允许直接升级的最低来源版本
     * @return MigrationResult 数据库迁移执行结果
     * @throws SystemUpdateException 系统未安装、版本不兼容或迁移失败时抛出
     */
    private function migrateLocked(
        MigrationDatabaseConfiguration $configuration,
        string $targetVersion,
        string $minimumSourceVersion,
    ): MigrationResult {
        $fromVersion = $this->updates->currentVersion($configuration);
        if ($fromVersion === null) {
            throw new SystemUpdateException('未检测到有效的系统安装记录，请先使用在线安装器', 409);
        }
        if (version_compare($fromVersion, $targetVersion, '>')) {
            throw new SystemUpdateException('数据库版本高于当前代码版本，禁止执行降级迁移', 409);
        }
        if (version_compare($fromVersion, $minimumSourceVersion, '<')) {
            throw new SystemUpdateException(
                "当前版本 {$fromVersion} 不能直接升级，请先升级到 {$minimumSourceVersion}",
                409,
            );
        }

        $status = $this->migrations->status($configuration);
        if ($status->missing !== []) {
            throw new SystemUpdateException('数据库存在当前代码包中缺失的迁移记录，禁止继续更新', 409);
        }
        if ($status->pending === [] && $fromVersion === $targetVersion) {
            return new MigrationResult([], $status, '数据库结构和系统版本已经是最新状态');
        }

        $runId = $this->updates->begin($configuration, $fromVersion, $targetVersion);
        try {
            $result = $this->migrations->migrate($configuration);
            $this->updates->complete($configuration, $runId, $fromVersion, $targetVersion);

            return $result;
        } catch (Throwable $exception) {
            $this->updates->fail($configuration, $runId, $exception->getMessage());
            if ($exception instanceof SystemUpdateException) {
                throw $exception;
            }

            throw new SystemUpdateException('系统数据库更新失败', 500, $exception);
        }
    }
}
