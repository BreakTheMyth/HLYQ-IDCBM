<?php

declare(strict_types=1);

namespace app\modules\admin\auth\domain;

use app\modules\admin\auth\exception\AdminAuthenticationException;

/**
 * 表示已经完成格式校验的管理员登录凭据。
 */
final readonly class AdminLoginCredentials
{
    /**
     * 创建管理员登录凭据。
     * @param string $username 管理员账号
     * @param string $password 管理员密码
     */
    private function __construct(
        public string $username,
        public string $password,
    ) {
    }

    /**
     * 从请求数据创建并校验管理员登录凭据。
     * @param array<string, mixed> $input 登录请求数据
     * @return self 已校验的登录凭据
     * @throws AdminAuthenticationException 登录字段不符合要求时抛出
     */
    public static function fromArray(array $input): self
    {
        $username = trim((string) ($input['username'] ?? ''));
        $password = (string) ($input['password'] ?? '');
        $errors = [];

        if ($username === '') {
            $errors['username'][] = '请输入管理员账号';
        } elseif (strlen($username) > 32) {
            $errors['username'][] = '管理员账号不能超过 32 个字符';
        }

        if ($password === '') {
            $errors['password'][] = '请输入管理员密码';
        } elseif (strlen($password) > 128) {
            $errors['password'][] = '管理员密码不能超过 128 个字符';
        }

        if ($errors !== []) {
            throw AdminAuthenticationException::validationFailed($errors);
        }

        return new self($username, $password);
    }
}
