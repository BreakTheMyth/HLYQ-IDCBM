<?php

declare(strict_types=1);

namespace tests\unit\modules\system_update\domain;

use app\modules\system_update\domain\MigrationDatabaseConfiguration;
use InvalidArgumentException;
use PHPUnit\Framework\TestCase;

/**
 * 验证数据库迁移连接配置的白名单和边界约束。
 */
final class MigrationDatabaseConfigurationTest extends TestCase
{
    /**
     * 验证 Webman 数据库配置能够转换为迁移连接配置。
     * @return void
     */
    public function testCreatesConfigurationFromWebmanDatabaseConfig(): void
    {
        $configuration = MigrationDatabaseConfiguration::fromArray([
            'driver' => 'mysql',
            'host' => '127.0.0.1',
            'port' => 3306,
            'database' => 'idcbm',
            'username' => 'root',
            'password' => 'secret',
            'prefix' => 'hlyq_',
            'charset' => 'utf8mb4',
        ]);

        self::assertSame('mysql', $configuration->adapter);
        self::assertSame('idcbm', $configuration->database);
        self::assertSame('hlyq_', $configuration->tablePrefix);
        self::assertSame(3306, $configuration->port);
    }

    /**
     * 验证不安全的数据表前缀会被拒绝。
     * @return void
     */
    public function testRejectsUnsafeTablePrefix(): void
    {
        $this->expectException(InvalidArgumentException::class);

        new MigrationDatabaseConfiguration('sqlite', ':memory:', 'hlyq_;DROP TABLE users');
    }
}
