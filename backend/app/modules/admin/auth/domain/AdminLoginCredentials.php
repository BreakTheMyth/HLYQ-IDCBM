<?php

declare(strict_types=1);

namespace app\modules\admin\auth\domain;

/**
 * 表示已经完成格式校验的管理员登录凭据。
 */
final readonly class AdminLoginCredentials
{
    /**
     * 创建管理员登录凭据。
     * @param string $username 管理员账号
     * @param string $password 管理员密码
     * @param bool   $remember 是否在浏览器关闭后继续保留登录状态
     */
    private function __construct(
        public string $username,
        public string $password,
        public bool $remember,
    ) {
    }

    /**
     * 从已通过 HTTP 边界验证的数据创建管理员登录凭据。
     * @param string $username 管理员账号
     * @param string $password 管理员密码
     * @param bool   $remember 是否在浏览器关闭后继续保留登录状态
     * @return self 管理员登录凭据
     */
    public static function fromValidatedInput(
        string $username,
        string $password,
        bool $remember = false,
    ): self
    {
        return new self($username, $password, $remember);
    }
}
