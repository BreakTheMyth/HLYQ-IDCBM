<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;
use Phinx\Migration\IrreversibleMigrationException;

/**
 * 创建皓量云擎业务管理系统的基础数据表。
 */
final class CreateInitialCoreTables extends AbstractMigration
{
    /**
     * 创建基础表；已由旧安装器创建的表会被识别并保留。
     * @return void
     */
    public function up(): void
    {
        if (!$this->hasTable('system_settings')) {
            $this->table('system_settings', [
                'id' => false,
                'primary_key' => ['id'],
                'engine' => 'InnoDB',
                'collation' => 'utf8mb4_unicode_ci',
            ])
                ->addColumn('id', 'integer', ['identity' => true, 'signed' => false])
                ->addColumn('setting_key', 'string', ['limit' => 100])
                ->addColumn('setting_value', 'text')
                ->addColumn('is_public', 'boolean', ['default' => false])
                ->addColumn('created_at', 'datetime')
                ->addColumn('updated_at', 'datetime')
                ->addIndex(['setting_key'], ['unique' => true, 'name' => 'uk_setting_key'])
                ->create();
        }

        if (!$this->hasTable('admin_users')) {
            $this->table('admin_users', [
                'id' => false,
                'primary_key' => ['id'],
                'engine' => 'InnoDB',
                'collation' => 'utf8mb4_unicode_ci',
            ])
                ->addColumn('id', 'integer', ['identity' => true, 'signed' => false])
                ->addColumn('username', 'string', ['limit' => 32])
                ->addColumn('nickname', 'string', ['limit' => 32])
                ->addColumn('password_hash', 'string', ['limit' => 255])
                ->addColumn('status', 'integer', ['default' => 1, 'signed' => false])
                ->addColumn('last_login_at', 'datetime', ['null' => true])
                ->addColumn('created_at', 'datetime')
                ->addColumn('updated_at', 'datetime')
                ->addIndex(['username'], ['unique' => true, 'name' => 'uk_username'])
                ->create();
        }

        if (!$this->hasTable('installation')) {
            $this->table('installation', [
                'id' => false,
                'primary_key' => ['id'],
                'engine' => 'InnoDB',
                'collation' => 'utf8mb4_unicode_ci',
            ])
                ->addColumn('id', 'integer', ['signed' => false, 'null' => false])
                ->addColumn('version', 'string', ['limit' => 32])
                ->addColumn('admin_path', 'string', ['limit' => 32])
                ->addColumn('agreement_version', 'string', ['limit' => 32])
                ->addColumn('agreement_accepted_at', 'datetime')
                ->addColumn('installed_at', 'datetime')
                ->create();
        }

        if (!$this->hasTable('system_update_runs')) {
            $this->table('system_update_runs', [
                'id' => false,
                'primary_key' => ['id'],
                'engine' => 'InnoDB',
                'collation' => 'utf8mb4_unicode_ci',
            ])
                ->addColumn('id', 'integer', ['identity' => true, 'signed' => false])
                ->addColumn('from_version', 'string', ['limit' => 32])
                ->addColumn('target_version', 'string', ['limit' => 32])
                ->addColumn('status', 'string', ['limit' => 20])
                ->addColumn('current_step', 'string', ['limit' => 100, 'null' => true])
                ->addColumn('error_message', 'text', ['null' => true])
                ->addColumn('package_checksum', 'string', ['limit' => 64, 'null' => true])
                ->addColumn('operator_id', 'biginteger', ['signed' => false, 'null' => true])
                ->addColumn('started_at', 'datetime')
                ->addColumn('finished_at', 'datetime', ['null' => true])
                ->addIndex(['status'], ['name' => 'idx_update_status'])
                ->addIndex(['started_at'], ['name' => 'idx_update_started_at'])
                ->create();
        }
    }

    /**
     * 阻止通过回滚命令删除系统基础表和客户数据。
     * @return void
     * @throws IrreversibleMigrationException 基础表迁移不可逆时抛出
     */
    public function down(): void
    {
        throw new IrreversibleMigrationException('系统基础表迁移不可逆，请使用前向修复迁移。');
    }
}
