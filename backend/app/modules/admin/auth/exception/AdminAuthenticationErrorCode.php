<?php

declare(strict_types=1);

namespace app\modules\admin\auth\exception;

/**
 * 定义运营后台认证接口的稳定业务错误码。
 */
final class AdminAuthenticationErrorCode
{
    public const int INVALID_CREDENTIALS = 40101;
    public const int INVALID_TOKEN = 40102;
    public const int ACCOUNT_DISABLED = 40301;
    public const int INVALID_INPUT = 42201;
}
