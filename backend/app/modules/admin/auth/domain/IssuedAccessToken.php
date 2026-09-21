<?php

declare(strict_types=1);

namespace app\modules\admin\auth\domain;

/**
 * 表示已经签发的管理员访问令牌。
 */
final readonly class IssuedAccessToken
{
    /**
     * 创建已签发访问令牌。
     * @param string $value     JWT 原始值
     * @param int    $expiresAt 过期时间戳
     */
    public function __construct(
        public string $value,
        public int $expiresAt,
    ) {
    }
}
