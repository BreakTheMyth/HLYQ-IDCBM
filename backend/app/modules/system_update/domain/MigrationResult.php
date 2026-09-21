<?php

declare(strict_types=1);

namespace app\modules\system_update\domain;

/**
 * 表示一次核心数据库迁移执行结果。
 */
final readonly class MigrationResult
{
    /**
     * 创建数据库迁移执行结果。
     * @param list<int>       $executed 本次执行的迁移版本
     * @param MigrationStatus $status   执行完成后的迁移状态
     * @param string          $output   Phinx 执行摘要
     */
    public function __construct(
        public array $executed,
        public MigrationStatus $status,
        public string $output,
    ) {
    }
}
