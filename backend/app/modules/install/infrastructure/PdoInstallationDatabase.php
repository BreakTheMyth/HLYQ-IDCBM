<?php

declare(strict_types=1);

namespace app\modules\install\infrastructure;

use app\modules\install\contract\InstallationDatabaseInterface;
use app\modules\install\domain\InstallationConfiguration;
use app\modules\install\exception\InstallationException;
use app\modules\system_update\contract\CoreMigrationRunnerInterface;
use app\modules\system_update\contract\SystemMigrationLockInterface;
use app\modules\system_update\domain\MigrationDatabaseConfiguration;
use PDO;
use Throwable;

/**
 * 使用核心数据库迁移和 PDO 完成系统初始数据写入。
 */
final readonly class PdoInstallationDatabase implements InstallationDatabaseInterface
{
    /**
     * 初始化安装数据库服务。
     * @param PdoConnectionFactory         $connections   数据库连接工厂
     * @param CoreMigrationRunnerInterface $migrations    核心数据库迁移执行器
     * @param SystemMigrationLockInterface $migrationLock 系统数据库迁移锁
     */
    public function __construct(
        private PdoConnectionFactory $connections,
        private CoreMigrationRunnerInterface $migrations,
        private SystemMigrationLockInterface $migrationLock,
    ) {
    }

    /**
     * 执行所有尚未应用的核心数据库迁移。
     * @param InstallationConfiguration $configuration 已校验的安装配置
     * @return void
     * @throws InstallationException 数据库连接或迁移执行失败时抛出
     */
    public function createSchema(InstallationConfiguration $configuration): void
    {
        try {
            $migrationConfiguration = new MigrationDatabaseConfiguration(
                'mysql',
                $configuration->database->mysqlDatabase,
                $configuration->database->tablePrefix,
                $configuration->database->mysqlHost,
                $configuration->database->mysqlPort,
                $configuration->database->mysqlUsername,
                $configuration->database->mysqlPassword,
            );
            $this->migrationLock->synchronized(
                fn () => $this->migrations->migrate($migrationConfiguration),
            );
        } catch (Throwable $exception) {
            throw new InstallationException('初始化数据表结构失败，请检查数据库权限后重试', 500, $exception);
        }
    }

    /**
     * 在事务中写入网站、管理员和安装记录。
     * @param InstallationConfiguration $configuration 已校验的安装配置
     * @return void
     * @throws InstallationException 密码加密或初始数据写入失败时抛出
     */
    public function seedSystem(InstallationConfiguration $configuration): void
    {
        $pdo = $this->connections->mysql($configuration->database);
        $prefix = $configuration->database->tablePrefix;
        $now = date('Y-m-d H:i:s');
        $passwordHash = password_hash($configuration->adminPassword, PASSWORD_DEFAULT);
        if ($passwordHash === false) {
            throw new InstallationException('管理员密码加密失败', 500);
        }

        $pdo->beginTransaction();
        try {
            $settingStatement = $pdo->prepare(
                "INSERT INTO `{$prefix}system_settings`
                    (`setting_key`, `setting_value`, `is_public`, `created_at`, `updated_at`)
                 VALUES (:setting_key, :setting_value, :is_public, :created_at, :updated_at)
                 ON DUPLICATE KEY UPDATE
                    `setting_value` = VALUES(`setting_value`),
                    `is_public` = VALUES(`is_public`),
                    `updated_at` = VALUES(`updated_at`)",
            );

            foreach ([
                ['site.name', $configuration->siteName, 1],
                ['site.title', $configuration->siteTitle, 1],
                ['site.description', $configuration->siteDescription, 1],
                ['site.url', $configuration->siteUrl, 1],
                ['admin.path', $configuration->adminPath, 0],
                ['legal.software_agreement_version', InstallationConfiguration::AGREEMENT_VERSION, 0],
            ] as [$key, $value, $public]) {
                $settingStatement->execute([
                    'setting_key' => $key,
                    'setting_value' => $value,
                    'is_public' => $public,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }

            $adminStatement = $pdo->prepare(
                "INSERT INTO `{$prefix}admin_users`
                    (`username`, `nickname`, `password_hash`, `status`, `created_at`, `updated_at`)
                 VALUES (:username, :nickname, :password_hash, 1, :created_at, :updated_at)
                 ON DUPLICATE KEY UPDATE
                    `nickname` = VALUES(`nickname`),
                    `password_hash` = VALUES(`password_hash`),
                    `status` = 1,
                    `updated_at` = VALUES(`updated_at`)",
            );
            $adminStatement->execute([
                'username' => $configuration->adminUsername,
                'nickname' => $configuration->adminNickname,
                'password_hash' => $passwordHash,
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            $installStatement = $pdo->prepare(
                "INSERT INTO `{$prefix}installation`
                    (`id`, `version`, `admin_path`, `agreement_version`, `agreement_accepted_at`, `installed_at`)
                 VALUES (1, :version, :admin_path, :agreement_version, :agreement_accepted_at, :installed_at)
                 ON DUPLICATE KEY UPDATE
                    `version` = VALUES(`version`),
                    `admin_path` = VALUES(`admin_path`),
                    `agreement_version` = VALUES(`agreement_version`),
                    `agreement_accepted_at` = VALUES(`agreement_accepted_at`),
                    `installed_at` = VALUES(`installed_at`)",
            );
            $installStatement->execute([
                'version' => (string) config('version.current', '0.1.0'),
                'admin_path' => $configuration->adminPath,
                'agreement_version' => InstallationConfiguration::AGREEMENT_VERSION,
                'agreement_accepted_at' => $now,
                'installed_at' => $now,
            ]);

            $pdo->commit();
        } catch (Throwable $exception) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            throw new InstallationException('初始化系统数据失败，请检查数据库权限后重试', 500, $exception);
        }
    }
}
