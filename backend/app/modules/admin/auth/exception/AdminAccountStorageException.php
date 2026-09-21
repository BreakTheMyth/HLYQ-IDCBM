<?php

declare(strict_types=1);

namespace app\modules\admin\auth\exception;

use RuntimeException;
use Throwable;

/**
 * 表示管理员账号存储访问失败。
 */
final class AdminAccountStorageException extends RuntimeException
{
    /**
     * 创建管理员账号存储异常并保留原始异常链。
     * @param Throwable $previous 原始数据库异常
     */
    public function __construct(Throwable $previous)
    {
        parent::__construct('管理员账号存储访问失败', 0, $previous);
    }
}
