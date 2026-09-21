<?php

declare(strict_types=1);

namespace app\modules\admin\auth\exception;

use app\exception\BusinessException;

/**
 * 表示可安全返回给运营后台的认证失败。
 */
final class AdminAuthenticationException extends BusinessException
{
    /**
     * 创建账号或密码错误异常。
     * @return self 账号或密码错误异常
     */
    public static function invalidCredentials(): self
    {
        return new self('账号或密码错误', AdminAuthenticationErrorCode::INVALID_CREDENTIALS, 401);
    }

    /**
     * 创建管理员账号停用异常。
     * @return self 管理员账号停用异常
     */
    public static function accountDisabled(): self
    {
        return new self('管理员账号已停用，请联系其他管理员', AdminAuthenticationErrorCode::ACCOUNT_DISABLED, 403);
    }

    /**
     * 创建登录状态失效异常。
     * @return self 登录状态失效异常
     */
    public static function invalidToken(): self
    {
        return new self('登录状态已失效，请重新登录', AdminAuthenticationErrorCode::INVALID_TOKEN, 401);
    }

    /**
     * 创建登录字段校验异常。
     * @param array<string, list<string>> $errors 字段错误集合
     * @return self 登录字段校验异常
     */
    public static function validationFailed(array $errors): self
    {
        return new self(
            '登录信息填写不完整',
            AdminAuthenticationErrorCode::INVALID_INPUT,
            422,
            ['errors' => $errors],
        );
    }
}
