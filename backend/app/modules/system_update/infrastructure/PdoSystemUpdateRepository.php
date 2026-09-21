<?php

declare(strict_types=1);

namespace app\modules\system_update\infrastructure;

use app\modules\system_update\contract\SystemUpdateRepositoryInterface;
use app\modules\system_update\domain\MigrationDatabaseConfiguration;
use app\modules\system_update\exception\SystemUpdateException;
use Throwable;

/**
 * 使用 PDO 持久化系统版本和升级执行记录。
 */
final readonly class PdoSystemUpdateRepository implements SystemUpdateRepositoryInterface
{
    /**
     * 初始化系统更新仓储。
     * @param SystemUpdatePdoFactory $connections 系统更新数据库连接工厂
     * @param PdoSchemaInspector     $schema      PDO 数据库结构检查器
     */
    public function __construct(
        private SystemUpdatePdoFactory $connections,
        private PdoSchemaInspector $schema,
    ) {
    }

    /**
     * 获取数据库记录的当前系统版本。
     * @param MigrationDatabaseConfiguration $configuration 数据库迁移连接配置
     * @return string|null 当前系统版本，未安装时返回 null
     * @throws SystemUpdateException 系统版本读取失败时抛出
     */
    public function currentVersion(MigrationDatabaseConfiguration $configuration): ?string
    {
        try {
            $pdo = $this->connections->connect($configuration);
            $table = $configuration->tablePrefix . 'installation';
            if (!$this->schema->hasTable($pdo, $table)) {
                return null;
            }

            $value = $pdo->query(sprintf(
                'SELECT version FROM %s WHERE id = 1',
                $this->schema->quoteIdentifier($pdo, $table),
            ))
                ->fetchColumn();

            return $value === false ? null : (string) $value;
        } catch (SystemUpdateException $exception) {
            throw $exception;
        } catch (Throwable $exception) {
            throw new SystemUpdateException('无法读取数据库中的系统版本', 500, $exception);
        }
    }

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
    ): ?int {
        try {
            $pdo = $this->connections->connect($configuration);
            $table = $configuration->tablePrefix . 'system_update_runs';
            if (!$this->schema->hasTable($pdo, $table)) {
                return null;
            }

            $statement = $pdo->prepare(sprintf(
                'INSERT INTO %s (from_version, target_version, status, current_step, started_at)'
                . ' VALUES (:from_version, :target_version, :status, :current_step, :started_at)',
                $this->schema->quoteIdentifier($pdo, $table),
            ));
            $statement->execute([
                'from_version' => $fromVersion,
                'target_version' => $targetVersion,
                'status' => 'running',
                'current_step' => 'database_migrations',
                'started_at' => date('Y-m-d H:i:s'),
            ]);

            return (int) $pdo->lastInsertId();
        } catch (Throwable $exception) {
            throw new SystemUpdateException('无法创建系统升级记录', 500, $exception);
        }
    }

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
    ): void {
        try {
            $pdo = $this->connections->connect($configuration);
            $installationTable = $configuration->tablePrefix . 'installation';
            $updateTable = $configuration->tablePrefix . 'system_update_runs';
            $pdo->beginTransaction();

            $statement = $pdo->prepare(sprintf(
                'UPDATE %s SET version = :version WHERE id = 1',
                $this->schema->quoteIdentifier($pdo, $installationTable),
            ));
            $statement->execute(['version' => $targetVersion]);

            if ($runId === null) {
                $statement = $pdo->prepare(sprintf(
                    'INSERT INTO %s'
                    . ' (from_version, target_version, status, current_step, started_at, finished_at)'
                    . ' VALUES (:from_version, :target_version, :status, :current_step, :started_at, :finished_at)',
                    $this->schema->quoteIdentifier($pdo, $updateTable),
                ));
                $now = date('Y-m-d H:i:s');
                $statement->execute([
                    'from_version' => $fromVersion,
                    'target_version' => $targetVersion,
                    'status' => 'completed',
                    'current_step' => 'completed',
                    'started_at' => $now,
                    'finished_at' => $now,
                ]);
            } else {
                $statement = $pdo->prepare(sprintf(
                    'UPDATE %s SET status = :status, current_step = :current_step, finished_at = :finished_at'
                    . ' WHERE id = :id',
                    $this->schema->quoteIdentifier($pdo, $updateTable),
                ));
                $statement->execute([
                    'status' => 'completed',
                    'current_step' => 'completed',
                    'finished_at' => date('Y-m-d H:i:s'),
                    'id' => $runId,
                ]);
            }

            $pdo->commit();
        } catch (Throwable $exception) {
            if (isset($pdo) && $pdo->inTransaction()) {
                $pdo->rollBack();
            }
            throw new SystemUpdateException('无法完成系统版本更新记录', 500, $exception);
        }
    }

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
    ): void {
        if ($runId === null) {
            return;
        }

        try {
            $pdo = $this->connections->connect($configuration);
            $table = $configuration->tablePrefix . 'system_update_runs';
            $statement = $pdo->prepare(sprintf(
                'UPDATE %s SET status = :status, current_step = :current_step,'
                . ' error_message = :error_message, finished_at = :finished_at WHERE id = :id',
                $this->schema->quoteIdentifier($pdo, $table),
            ));
            $statement->execute([
                'status' => 'failed',
                'current_step' => 'database_migrations',
                'error_message' => mb_substr($message, 0, 1000),
                'finished_at' => date('Y-m-d H:i:s'),
                'id' => $runId,
            ]);
        } catch (Throwable) {
            // 原始升级异常优先返回，失败记录写入不能覆盖根因。
        }
    }
}
