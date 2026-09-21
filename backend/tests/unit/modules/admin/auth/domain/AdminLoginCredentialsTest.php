<?php

declare(strict_types=1);

namespace tests\unit\modules\admin\auth\domain;

use app\modules\admin\auth\domain\AdminLoginCredentials;
use PHPUnit\Framework\TestCase;

/**
 * 验证管理员登录凭据保存已通过边界验证的数据。
 */
final class AdminLoginCredentialsTest extends TestCase
{
    /**
     * 验证未提交记住登录选项时默认使用会话 Cookie。
     * @return void
     */
    public function testRememberDefaultsToFalse(): void
    {
        $credentials = AdminLoginCredentials::fromValidatedInput('admin_user', 'Secure123!');

        self::assertFalse($credentials->remember);
        self::assertSame('admin_user', $credentials->username);
        self::assertSame('Secure123!', $credentials->password);
    }

    /**
     * 验证布尔真值会保留记住登录选项。
     * @return void
     */
    public function testRememberCanBeEnabled(): void
    {
        $credentials = AdminLoginCredentials::fromValidatedInput('admin_user', 'Secure123!', true);

        self::assertTrue($credentials->remember);
    }
}
