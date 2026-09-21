<?php

declare(strict_types=1);

namespace app\modules\admin\auth\domain;

/**
 * 表示管理员登录成功后的账号与令牌结果。
 */
final readonly class AdminLoginResult
{
    /**
     * 创建管理员登录结果。
     * @param AdminAccount      $account 管理员账号
     * @param IssuedAccessToken $token   已签发访问令牌
     */
    public function __construct(
        public AdminAccount $account,
        public IssuedAccessToken $token,
    ) {
    }
}
