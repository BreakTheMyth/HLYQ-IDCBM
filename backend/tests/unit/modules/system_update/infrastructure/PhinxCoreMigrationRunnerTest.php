<?php

declare(strict_types=1);

namespace tests\unit\modules\system_update\infrastructure;

use app\modules\system_update\domain\MigrationDatabaseConfiguration;
use app\modules\system_update\exception\SystemUpdateException;
use app\modules\system_update\infrastructure\PdoSchemaInspector;
use app\modules\system_update\infrastructure\PhinxCoreMigrationRunner;
use app\modules\system_update\infrastructure\SystemUpdatePdoFactory;
use PDO;
use PHPUnit\Framework\TestCase;

/**
 * 验证核心迁移可用于全新数据库、重复执行和旧安装基线接管。
 */
final class PhinxCoreMigrationRunnerTest extends TestCase
{
    /**
     * @var list<string> 测试结束后需要删除的 SQLite 文件
     */
    private array $databasePaths = [];

    /**
     * 清理迁移测试创建的临时数据库。
     * @return void
     */
    protected function tearDown(): void
    {
        foreach ($this->databasePaths as $path) {
            if (is_file($path)) {
                unlink($path);
            }
        }
    }

    /**
     * 验证全新数据库会执行基础迁移且能够安全重复调用。
     * @return void
     */
    public function testMigratesFreshDatabaseAndIsIdempotent(): void
    {
        $configuration = $this->configuration();
        $runner = new PhinxCoreMigrationRunner(new SystemUpdatePdoFactory(), new PdoSchemaInspector());

        $before = $runner->status($configuration);
        self::assertSame([20260921000100], $before->pending);
        $beforePdo = (new SystemUpdatePdoFactory())->connect($configuration);
        self::assertSame(
            0,
            (int) $beforePdo->query(
                "SELECT COUNT(*) FROM sqlite_master WHERE type = 'table' AND name = 'test_migration_versions'",
            )->fetchColumn(),
        );

        $first = $runner->migrate($configuration);
        self::assertSame([20260921000100], $first->executed);
        self::assertTrue($first->status->isUpToDate());

        $second = $runner->migrate($configuration);
        self::assertSame([], $second->executed);
        self::assertTrue($second->status->isUpToDate());

        $pdo = (new SystemUpdatePdoFactory())->connect($configuration);
        $tables = $pdo->query("SELECT name FROM sqlite_master WHERE type = 'table'")->fetchAll(PDO::FETCH_COLUMN);
        self::assertContains('test_system_settings', $tables);
        self::assertContains('test_admin_users', $tables);
        self::assertContains('test_installation', $tables);
        self::assertContains('test_system_update_runs', $tables);
        self::assertContains('test_migration_versions', $tables);
    }

    /**
     * 验证旧安装器已经创建的表不会被删除或覆盖。
     * @return void
     */
    public function testAdoptsExistingInstallationAsBaseline(): void
    {
        $configuration = $this->configuration();
        $pdo = (new SystemUpdatePdoFactory())->connect($configuration);
        $pdo->exec('CREATE TABLE test_system_settings (id INTEGER PRIMARY KEY, setting_key TEXT NOT NULL)');
        $pdo->exec('CREATE TABLE test_admin_users (id INTEGER PRIMARY KEY, username TEXT NOT NULL)');
        $pdo->exec('CREATE TABLE test_installation (id INTEGER PRIMARY KEY, version TEXT NOT NULL)');
        $pdo->exec("INSERT INTO test_installation (id, version) VALUES (1, '0.1.0')");

        $runner = new PhinxCoreMigrationRunner(new SystemUpdatePdoFactory(), new PdoSchemaInspector());
        $result = $runner->migrate($configuration);

        self::assertSame([20260921000100], $result->executed);
        self::assertSame(
            '0.1.0',
            $pdo->query('SELECT version FROM test_installation WHERE id = 1')->fetchColumn(),
        );
        self::assertSame(
            1,
            (int) $pdo->query(
                "SELECT COUNT(*) FROM sqlite_master WHERE type = 'table' AND name = 'test_system_update_runs'",
            )->fetchColumn(),
        );
    }

    /**
     * 验证数据库记录了当前代码包缺失的迁移时禁止继续更新。
     * @return void
     */
    public function testRejectsMissingMigrationFile(): void
    {
        $configuration = $this->configuration();
        $connections = new SystemUpdatePdoFactory();
        $runner = new PhinxCoreMigrationRunner($connections, new PdoSchemaInspector());
        $runner->migrate($configuration);

        $pdo = $connections->connect($configuration);
        $pdo->exec(
            "INSERT INTO test_migration_versions"
            . " (version, migration_name, start_time, end_time, breakpoint)"
            . " VALUES (20260921999999, 'MissingMigration', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0)",
        );

        $this->expectException(SystemUpdateException::class);
        $this->expectExceptionMessage('缺失的迁移记录');

        $runner->migrate($configuration);
    }

    /**
     * 创建使用独立临时 SQLite 文件的迁移配置。
     * @return MigrationDatabaseConfiguration 数据库迁移连接配置
     */
    private function configuration(): MigrationDatabaseConfiguration
    {
        $path = tempnam(sys_get_temp_dir(), 'hlyq-migration-test-');
        self::assertNotFalse($path);
        $this->databasePaths[] = $path;

        return new MigrationDatabaseConfiguration('sqlite', $path, 'test_');
    }
}
