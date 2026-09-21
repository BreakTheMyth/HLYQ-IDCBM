<?php

declare(strict_types=1);

namespace app\modules\admin\auth\application;

use app\modules\admin\auth\domain\AdminAccount;
use app\modules\admin\auth\exception\AdminAuthenticationException;
use Webman\Http\Request;

/**
 * 在 Webman 请求级上下文中读写当前管理员身份。
 */
final class AdminAuthenticationContext
{
    private const string CONTEXT_KEY = 'hlyq.admin.account';

    /**
     * 将当前管理员写入请求级上下文。
     * @param Request      $request 当前 HTTP 请求
     * @param AdminAccount $account 已认证管理员账号
     * @return void
     */
    public function set(Request $request, AdminAccount $account): void
    {
        $request->context[self::CONTEXT_KEY] = $account;
    }

    /**
     * 读取当前请求已经认证的管理员。
     * @param Request $request 当前 HTTP 请求
     * @return AdminAccount 已认证管理员账号
     * @throws AdminAuthenticationException 请求未完成管理员认证时抛出
     */
    public function account(Request $request): AdminAccount
    {
        $account = $request->context[self::CONTEXT_KEY] ?? null;
        if (!$account instanceof AdminAccount) {
            throw AdminAuthenticationException::invalidToken();
        }

        return $account;
    }
}
