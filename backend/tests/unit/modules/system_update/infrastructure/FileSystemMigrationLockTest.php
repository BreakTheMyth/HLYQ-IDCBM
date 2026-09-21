<?php

declare(strict_types=1);

namespace tests\unit\modules\system_update\infrastructure;

use app\modules\system_update\exception\SystemUpdateException;
use app\modules\system_update\infrastructure\FileSystemMigrationLock;
use PHPUnit\Framework\TestCase;

/**
 * 验证系统数据库迁移文件锁的互斥和释放行为。
 */
final class FileSystemMigrationLockTest extends TestCase
{
    /**
     * 验证同一锁被占用时拒绝并发迁移，回调完成后可以再次获取。
     * @return void
     */
    public function testRejectsConcurrentAcquisitionAndReleasesLock(): void
    {
        $directory = sys_get_temp_dir() . '/hlyq-migration-lock-' . bin2hex(random_bytes(8));
        $path = $directory . '/migration.lock';
        $lock = new FileSystemMigrationLock($path);

        try {
            $lock->synchronized(function () use ($lock): void {
                try {
                    $lock->synchronized(static fn (): bool => true);
                    self::fail('已经占用的迁移锁不应允许再次获取');
                } catch (SystemUpdateException $exception) {
                    self::assertSame(423, $exception->httpStatus());
                }
            });

            self::assertSame('released', $lock->synchronized(static fn (): string => 'released'));
        } finally {
            if (is_file($path)) {
                unlink($path);
            }
            if (is_dir($directory)) {
                rmdir($directory);
            }
        }
    }
}
