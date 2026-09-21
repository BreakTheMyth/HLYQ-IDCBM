<?php

declare(strict_types=1);

namespace app\modules\admin\auth\contract;

use app\modules\admin\auth\domain\AccessTokenClaims;
use app\modules\admin\auth\domain\AdminAccount;
use app\modules\admin\auth\domain\IssuedAccessToken;

/**
 * 定义管理员 JWT 访问令牌能力。
 */
interface AdminAccessTokenServiceInterface
{
    /**
     * 为管理员签发访问令牌。
     * @param AdminAccount $account 管理员账号
     * @return IssuedAccessToken 已签发访问令牌
     */
    public function issue(AdminAccount $account): IssuedAccessToken;

    /**
     * 验证并解析访问令牌。
     * @param string $token JWT 原始值
     * @return AccessTokenClaims 已验证令牌声明
     */
    public function parse(string $token): AccessTokenClaims;
}
