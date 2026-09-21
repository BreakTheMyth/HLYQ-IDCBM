<?php

declare(strict_types=1);

namespace app\modules\admin\auth\application;

use app\modules\admin\auth\contract\AdminAccessTokenServiceInterface;
use app\modules\admin\auth\contract\AdminAccountRepositoryInterface;
use app\modules\admin\auth\contract\AuthenticationAuditLoggerInterface;
use app\modules\admin\auth\domain\AdminLoginCredentials;
use app\modules\admin\auth\domain\AdminLoginResult;
use app\modules\admin\auth\exception\AdminAuthenticationException;

/**
 * 校验管理员账号密码并签发后台访问令牌。
 */
final readonly class LoginAdminService
{
    private const string DUMMY_PASSWORD_HASH = '$2y$10$W4JQHLPLRvGV8cYqHjrwROE/1bM2YOFKJnrrUp6TAiMYqgCTgWEjW';

    /**
     * 初始化管理员登录服务。
     * @param AdminAccountRepositoryInterface       $accounts    管理员账号仓储
     * @param AdminAccessTokenServiceInterface      $tokens      管理员令牌服务
     * @param AuthenticationAuditLoggerInterface    $auditLogger 认证审计记录器
     */
    public function __construct(
        private AdminAccountRepositoryInterface $accounts,
        private AdminAccessTokenServiceInterface $tokens,
        private AuthenticationAuditLoggerInterface $auditLogger,
    ) {
    }

    /**
     * 执行管理员账号密码登录。
     * 不存在的账号也会执行一次密码哈希校验，降低账号枚举的时序差异。
     * @param AdminLoginCredentials $credentials   已校验登录凭据
     * @param string                $clientAddress 客户端连接地址
     * @return AdminLoginResult 登录成功结果
     * @throws AdminAuthenticationException 账号密码错误或账号停用时抛出
     */
    public function execute(AdminLoginCredentials $credentials, string $clientAddress): AdminLoginResult
    {
        $account = $this->accounts->findByUsername($credentials->username);
        $passwordHash = $account?->passwordHash ?? self::DUMMY_PASSWORD_HASH;
        $passwordMatches = password_verify($credentials->password, $passwordHash);

        if ($account === null || !$passwordMatches) {
            $this->auditLogger->loginFailed($credentials->username, $clientAddress, 'invalid_credentials');
            throw AdminAuthenticationException::invalidCredentials();
        }

        if (!$account->isActive()) {
            $this->auditLogger->loginFailed($account->username, $clientAddress, 'account_disabled');
            throw AdminAuthenticationException::accountDisabled();
        }

        $token = $this->tokens->issue($account);
        $this->accounts->recordSuccessfulLogin($account->id, date('Y-m-d H:i:s'));
        $this->auditLogger->loginSucceeded($account, $clientAddress);

        return new AdminLoginResult($account, $token);
    }
}
