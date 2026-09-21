<?php

declare(strict_types=1);

namespace app\modules\system_update\contract;

use app\modules\system_update\exception\SystemUpdateException;

/**
 * 定义系统数据库迁移的进程间互斥能力。
 */
interface SystemMigrationLockInterface
{
    /**
     * 在独占迁移锁中执行回调。
     * @template T
     * @param callable(): T $callback 需要串行执行的迁移操作
     * @return T 回调执行结果
     * @throws SystemUpdateException 迁移锁无法创建或已经被占用时抛出
     */
    public function synchronized(callable $callback): mixed;
}
