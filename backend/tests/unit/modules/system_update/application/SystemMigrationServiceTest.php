<?php

declare(strict_types=1);

namespace tests\unit\modules\system_update\application;

use app\modules\system_update\application\SystemMigrationService;
use app\modules\system_update\domain\MigrationDatabaseConfiguration;
use app\modules\system_update\exception\SystemUpdateException;
use app\modules\system_update\infrastructure\PdoSystemUpdateRepository;
use app\modules\system_update\infrastructure\FileSystemMigrationLock;
use app\modules\system_update\infrastructure\PdoSchemaInspector;
use app\modules\system_update\infrastructure\PhinxCoreMigrationRunner;
use app\modules\system_update\infrastructure\SystemUpdatePdoFactory;
use PDO;
use PHPUnit\Framework\TestCase;

/**
 * 验证系统版本检查与数据库迁移应用流程。
 */
final class SystemMigrationServiceTest extends TestCase
{
    private string $databasePath;

    /**
     * 创建隔离的 SQLite 迁移测试数据库。
     * @return void
     */
    protected function setUp(): void
    {
        $path = tempnam(sys_get_temp_dir(), 'hlyq-system-update-test-');
        self::assertNotFalse($path);
        $this->databasePath = $path;
    }

    /**
     * 删除迁移测试数据库。
     * @return void
     */
    protected function tearDown(): void
    {
        if (is_file($this->databasePath)) {
            unlink($this->databasePath);
        }
        if (is_file($this->databasePath . '.lock')) {
            unlink($this->databasePath . '.lock');
        }
    }

    /**
     * 验证无新增表结构时仍会推进系统版本并记录升级结果。
     * @return void
     */
    public function testUpdatesSystemVersionWithoutPendingMigration(): void
    {
        [$service, $configuration, $pdo] = $this->installedSystem('0.1.0');

        $result = $service->migrate($configuration, '0.2.0', '0.1.0');

        self::assertSame([], $result->executed);
        self::assertSame(
            '0.2.0',
            $pdo->query('SELECT version FROM test_installation WHERE id = 1')->fetchColumn(),
        );
        self::assertSame(
            'completed',
            $pdo->query('SELECT status FROM test_system_update_runs ORDER BY id DESC LIMIT 1')->fetchColumn(),
        );
    }

    /**
     * 验证代码版本低于数据库版本时拒绝执行降级。
     * @return void
     */
    public function testRejectsDatabaseDowngrade(): void
    {
        [$service, $configuration] = $this->installedSystem('0.2.0');

        $this->expectException(SystemUpdateException::class);
        $this->expectExceptionMessage('数据库版本高于当前代码版本');

        $service->migrate($configuration, '0.1.0', '0.1.0');
    }

    /**
     * 创建已经完成基础迁移并带安装记录的系统。
     * @param string $version 当前数据库系统版本
     * @return array{SystemMigrationService, MigrationDatabaseConfiguration, PDO} 测试服务、配置与连接
     */
    private function installedSystem(string $version): array
    {
        $configuration = new MigrationDatabaseConfiguration('sqlite', $this->databasePath, 'test_');
        $connections = new SystemUpdatePdoFactory();
        $schema = new PdoSchemaInspector();
        $runner = new PhinxCoreMigrationRunner($connections, $schema);
        $repository = new PdoSystemUpdateRepository($connections, $schema);
        $service = new SystemMigrationService(
            $runner,
            $repository,
            new FileSystemMigrationLock($this->databasePath . '.lock'),
        );
        $runner->migrate($configuration);

        $pdo = $connections->connect($configuration);
        $statement = $pdo->prepare(
            'INSERT INTO test_installation'
            . ' (id, version, admin_path, agreement_version, agreement_accepted_at, installed_at)'
            . ' VALUES (1, :version, :admin_path, :agreement_version, :agreement_accepted_at, :installed_at)',
        );
        $statement->execute([
            'version' => $version,
            'admin_path' => 'admin',
            'agreement_version' => '1.0',
            'agreement_accepted_at' => '2026-09-21 12:00:00',
            'installed_at' => '2026-09-21 12:00:00',
        ]);

        return [$service, $configuration, $pdo];
    }
}
