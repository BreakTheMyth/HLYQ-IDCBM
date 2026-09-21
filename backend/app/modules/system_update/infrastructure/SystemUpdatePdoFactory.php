<?php

declare(strict_types=1);

namespace app\modules\system_update\infrastructure;

use app\modules\system_update\domain\MigrationDatabaseConfiguration;
use app\modules\system_update\exception\SystemUpdateException;
use PDO;
use PDOException;

/**
 * 为系统更新流程创建短生命周期 PDO 连接。
 */
final class SystemUpdatePdoFactory
{
    /**
     * 创建数据库迁移使用的 PDO 连接。
     * @param MigrationDatabaseConfiguration $configuration 数据库迁移连接配置
     * @return PDO 已连接的 PDO 实例
     * @throws SystemUpdateException 数据库连接失败时抛出
     */
    public function connect(MigrationDatabaseConfiguration $configuration): PDO
    {
        try {
            if ($configuration->adapter === 'sqlite') {
                return new PDO('sqlite:' . $configuration->database, options: [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                ]);
            }

            $dsn = sprintf(
                'mysql:host=%s;port=%d;dbname=%s;charset=%s',
                $configuration->host,
                $configuration->port,
                $configuration->database,
                $configuration->charset,
            );

            return new PDO(
                $dsn,
                $configuration->username,
                $configuration->password,
                [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES => false,
                    PDO::ATTR_TIMEOUT => 5,
                ],
            );
        } catch (PDOException $exception) {
            throw new SystemUpdateException('数据库连接失败，请检查系统数据库配置', 500, $exception);
        }
    }
}
