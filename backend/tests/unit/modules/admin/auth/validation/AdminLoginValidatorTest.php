<?php

declare(strict_types=1);

namespace tests\unit\modules\admin\auth\validation;

use app\modules\admin\auth\exception\AdminAuthenticationErrorCode;
use app\modules\admin\auth\exception\AdminAuthenticationException;
use app\modules\admin\auth\validation\AdminLoginValidator;
use PHPUnit\Framework\TestCase;

/**
 * 验证运营后台登录输入的白名单、规范化和错误结构。
 */
final class AdminLoginValidatorTest extends TestCase
{
    /**
     * 验证合法输入会规范化账号并返回默认记住登录选项。
     * @return void
     */
    public function testValidInputIsNormalized(): void
    {
        $validated = AdminLoginValidator::make([
            'username' => '  admin_user  ',
            'password' => 'Secure123!',
            'remember' => false,
            'unexpected' => 'ignored',
        ])->validateCredentials();

        self::assertSame([
            'username' => 'admin_user',
            'password' => 'Secure123!',
            'remember' => false,
        ], $validated);
    }

    /**
     * 验证布尔真值允许启用记住登录。
     * @return void
     */
    public function testRememberCanBeEnabled(): void
    {
        $validated = AdminLoginValidator::make([
            'username' => 'admin_user',
            'password' => 'Secure123!',
            'remember' => true,
        ])->validateCredentials();

        self::assertTrue($validated['remember']);
    }

    /**
     * 验证未提交记住登录选项时使用布尔假值。
     * @return void
     */
    public function testRememberDefaultsToFalse(): void
    {
        $validated = AdminLoginValidator::make([
            'username' => 'admin_user',
            'password' => 'Secure123!',
        ])->validateCredentials();

        self::assertFalse($validated['remember']);
    }

    /**
     * 验证非法字段会转换为登录接口统一字段错误。
     * @return void
     */
    public function testInvalidInputReturnsStructuredErrors(): void
    {
        try {
            AdminLoginValidator::make([
                'username' => '   ',
                'password' => '',
                'remember' => 'true',
            ])->validateCredentials();
            self::fail('非法登录字段应被拒绝');
        } catch (AdminAuthenticationException $exception) {
            self::assertSame(AdminAuthenticationErrorCode::INVALID_INPUT, $exception->errorCode());
            self::assertSame(422, $exception->httpStatus());
            self::assertSame([
                'errors' => [
                    'username' => ['请输入管理员账号'],
                    'password' => ['请输入管理员密码'],
                    'remember' => ['记住我选项必须为布尔值'],
                ],
            ], $exception->data());
        }
    }
}
