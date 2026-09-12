<?php

declare(strict_types=1);

namespace app\modules\install\infrastructure;

use app\modules\install\contract\InstallationDatabaseInterface;
use app\modules\install\domain\InstallationConfiguration;
use app\modules\install\exception\InstallationException;
use PDO;
use Throwable;

/**
 * 使用 PDO 创建安装表结构并写入系统初始数据。
 */
final readonly class PdoInstallationDatabase implements InstallationDatabaseInterface
{
    /**
     * 初始化安装数据库服务。
     * @param PdoConnectionFactory $connections 数据库连接工厂
     */
    public function __construct(private PdoConnectionFactory $connections)
    {
    }

    /**
     * 幂等创建安装所需的基础表结构。
     * @param InstallationConfiguration $configuration 已校验的安装配置
     * @return void
     * @throws InstallationException 数据库连接或建表失败时抛出
     * @throws \PDOException 执行建表语句失败时抛出
     */
    public function createSchema(InstallationConfiguration $configuration): void
    {
        $pdo = $this->connections->mysql($configuration->database);
        $prefix = $configuration->database->tablePrefix;

        $pdo->exec(
            "CREATE TABLE IF NOT EXISTS `{$prefix}system_settings` (
                `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
                `setting_key` VARCHAR(100) NOT NULL,
                `setting_value` TEXT NOT NULL,
                `is_public` TINYINT(1) NOT NULL DEFAULT 0,
                `created_at` DATETIME NOT NULL,
                `updated_at` DATETIME NOT NULL,
                PRIMARY KEY (`id`),
                UNIQUE KEY `uk_setting_key` (`setting_key`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
        );

        $pdo->exec(
            "CREATE TABLE IF NOT EXISTS `{$prefix}admin_users` (
                `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
                `username` VARCHAR(32) NOT NULL,
                `nickname` VARCHAR(32) NOT NULL,
                `password_hash` VARCHAR(255) NOT NULL,
                `status` TINYINT UNSIGNED NOT NULL DEFAULT 1,
                `last_login_at` DATETIME NULL,
                `created_at` DATETIME NOT NULL,
                `updated_at` DATETIME NOT NULL,
                PRIMARY KEY (`id`),
                UNIQUE KEY `uk_username` (`username`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
        );

        $pdo->exec(
            "CREATE TABLE IF NOT EXISTS `{$prefix}installation` (
                `id` TINYINT UNSIGNED NOT NULL,
                `version` VARCHAR(32) NOT NULL,
                `admin_path` VARCHAR(32) NOT NULL,
                `agreement_version` VARCHAR(32) NOT NULL,
                `agreement_accepted_at` DATETIME NOT NULL,
                `installed_at` DATETIME NOT NULL,
                PRIMARY KEY (`id`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
        );
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
                'version' => '0.1.0',
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
