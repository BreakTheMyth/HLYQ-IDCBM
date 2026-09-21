<?php

declare(strict_types=1);

namespace app\modules\system_update\domain;

/**
 * 表示核心数据库迁移的当前执行状态。
 */
final readonly class MigrationStatus
{
    /**
     * 创建数据库迁移状态。
     * @param list<int> $applied 已执行迁移版本
     * @param list<int> $pending 待执行迁移版本
     * @param list<int> $missing 数据库已记录但代码包中缺失的迁移版本
     * @param int       $latest  代码包中的最新迁移版本
     */
    public function __construct(
        public array $applied,
        public array $pending,
        public array $missing,
        public int $latest,
    ) {
    }

    /**
     * 判断数据库迁移是否已经与代码包一致。
     * @return bool 没有待执行或缺失迁移时返回 true
     */
    public function isUpToDate(): bool
    {
        return $this->pending === [] && $this->missing === [];
    }
}
