<?php

declare(strict_types=1);

namespace app\modules\system_update\domain;

use InvalidArgumentException;

/**
 * 表示数据库迁移运行时使用的受控连接配置。
 */
final readonly class MigrationDatabaseConfiguration
{
    /**
     * 创建数据库迁移连接配置。
     * @param string $adapter     数据库适配器
     * @param string $database    数据库名称或 SQLite 文件路径
     * @param string $tablePrefix 数据表前缀
     * @param string $host        数据库主机
     * @param int    $port        数据库端口
     * @param string $username    数据库用户名
     * @param string $password    数据库密码
     * @param string $charset     数据库字符集
     * @throws InvalidArgumentException 适配器、数据库名称、端口或表前缀不合法时抛出
     */
    public function __construct(
        public string $adapter,
        public string $database,
        public string $tablePrefix,
        public string $host = '',
        public int $port = 0,
        public string $username = '',
        public string $password = '',
        public string $charset = 'utf8mb4',
    ) {
        if (!in_array($adapter, ['mysql', 'sqlite'], true)) {
            throw new InvalidArgumentException('数据库迁移仅支持 mysql 或 sqlite 适配器');
        }
        if ($database === '') {
            throw new InvalidArgumentException('数据库迁移必须指定数据库名称或文件路径');
        }
        if (!preg_match('/^[a-zA-Z][a-zA-Z0-9_]{0,31}$/', $tablePrefix)) {
            throw new InvalidArgumentException('数据库表前缀格式不正确');
        }
        if ($adapter === 'mysql' && ($host === '' || $port < 1 || $port > 65535)) {
            throw new InvalidArgumentException('MySQL 迁移连接地址或端口不正确');
        }
    }

    /**
     * 从 Webman 数据库连接配置创建迁移配置。
     * @param array<string, mixed> $configuration 数据库连接配置
     * @return self 数据库迁移连接配置
     * @throws InvalidArgumentException 数据库连接配置不完整时抛出
     */
    public static function fromArray(array $configuration): self
    {
        return new self(
            (string) ($configuration['driver'] ?? 'mysql'),
            (string) ($configuration['database'] ?? ''),
            (string) ($configuration['prefix'] ?? 'hlyq_'),
            (string) ($configuration['host'] ?? ''),
            (int) ($configuration['port'] ?? 0),
            (string) ($configuration['username'] ?? ''),
            (string) ($configuration['password'] ?? ''),
            (string) ($configuration['charset'] ?? 'utf8mb4'),
        );
    }
}
