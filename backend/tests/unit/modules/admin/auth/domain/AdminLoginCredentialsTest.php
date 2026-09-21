<?php

declare(strict_types=1);

namespace tests\unit\modules\admin\auth\domain;

use app\modules\admin\auth\domain\AdminLoginCredentials;
use app\modules\admin\auth\exception\AdminAuthenticationException;
use PHPUnit\Framework\TestCase;

/**
 * 验证管理员登录凭据的格式校验与记住登录选项。
 */
final class AdminLoginCredentialsTest extends TestCase
{
    /**
     * 验证未提交记住登录选项时默认使用会话 Cookie。
     * @return void
     */
    public function testRememberDefaultsToFalse(): void
    {
        $credentials = AdminLoginCredentials::fromArray([
            'username' => 'admin_user',
            'password' => 'Secure123!',
        ]);

        self::assertFalse($credentials->remember);
    }

    /**
     * 验证布尔真值会保留记住登录选项。
     * @return void
     */
    public function testRememberCanBeEnabled(): void
    {
        $credentials = AdminLoginCredentials::fromArray([
            'username' => 'admin_user',
            'password' => 'Secure123!',
            'remember' => true,
        ]);

        self::assertTrue($credentials->remember);
    }

    /**
     * 验证非布尔记住登录选项会被拒绝。
     * @return void
     */
    public function testRememberMustBeBoolean(): void
    {
        try {
            AdminLoginCredentials::fromArray([
                'username' => 'admin_user',
                'password' => 'Secure123!',
                'remember' => 'true',
            ]);
            self::fail('非布尔记住登录选项应被拒绝');
        } catch (AdminAuthenticationException $exception) {
            self::assertSame(
                ['errors' => ['remember' => ['记住我选项必须为布尔值']]],
                $exception->data(),
            );
        }
    }
}
