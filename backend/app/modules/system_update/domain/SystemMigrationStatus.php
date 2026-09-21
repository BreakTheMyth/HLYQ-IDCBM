<?php

declare(strict_types=1);

namespace app\modules\system_update\domain;

/**
 * 表示程序版本与数据库迁移版本的综合状态。
 */
final readonly class SystemMigrationStatus
{
    /**
     * 创建系统迁移状态。
     * @param string          $codeVersion     当前代码包版本
     * @param string|null     $databaseVersion 数据库记录的系统版本
     * @param MigrationStatus $migrations      数据库迁移状态
     */
    public function __construct(
        public string $codeVersion,
        public ?string $databaseVersion,
        public MigrationStatus $migrations,
    ) {
    }

    /**
     * 判断系统是否需要执行升级。
     * @return bool 代码版本、数据库版本或迁移状态不一致时返回 true
     */
    public function requiresUpdate(): bool
    {
        return $this->databaseVersion !== $this->codeVersion || !$this->migrations->isUpToDate();
    }
}
