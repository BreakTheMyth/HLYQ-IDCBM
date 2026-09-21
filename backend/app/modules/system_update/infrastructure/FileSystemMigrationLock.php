<?php

declare(strict_types=1);

namespace app\modules\system_update\infrastructure;

use app\modules\system_update\contract\SystemMigrationLockInterface;
use app\modules\system_update\exception\SystemUpdateException;

/**
 * 使用文件锁防止同一部署节点并发执行核心数据库迁移。
 */
final readonly class FileSystemMigrationLock implements SystemMigrationLockInterface
{
    /**
     * 初始化系统数据库迁移锁。
     * @param string|null $lockPath 自定义锁文件路径，默认使用运行目录
     */
    public function __construct(private ?string $lockPath = null)
    {
    }

    /**
     * 在独占迁移锁中执行回调。
     * @template T
     * @param callable(): T $callback 需要串行执行的迁移操作
     * @return T 回调执行结果
     * @throws SystemUpdateException 迁移锁无法创建或已经被占用时抛出
     */
    public function synchronized(callable $callback): mixed
    {
        $path = $this->lockPath ?? runtime_path() . '/system-update/migration.lock';
        $directory = dirname($path);
        if (!is_dir($directory) && !mkdir($directory, 0750, true) && !is_dir($directory)) {
            throw new SystemUpdateException('无法创建系统数据库迁移锁目录', 500);
        }

        $handle = fopen($path, 'c+');
        if ($handle === false) {
            throw new SystemUpdateException('无法创建系统数据库迁移锁文件', 500);
        }

        try {
            if (!flock($handle, LOCK_EX | LOCK_NB)) {
                throw new SystemUpdateException('另一个系统数据库迁移正在执行，请稍后重试', 423);
            }

            return $callback();
        } finally {
            flock($handle, LOCK_UN);
            fclose($handle);
        }
    }
}
