<?php

declare(strict_types=1);

namespace app\modules\admin\auth\infrastructure;

use app\modules\admin\auth\contract\AuthenticationAuditLoggerInterface;
use app\modules\admin\auth\domain\AdminAccount;
use Psr\Log\LoggerInterface;

/**
 * 将管理员认证安全事件写入独立审计日志。
 */
final readonly class MonologAuthenticationAuditLogger implements AuthenticationAuditLoggerInterface
{
    /**
     * 初始化认证审计记录器。
     * @param LoggerInterface $logger 审计日志通道
     */
    public function __construct(private LoggerInterface $logger)
    {
    }

    /**
     * 记录登录成功事件。
     * @param AdminAccount $account       管理员账号
     * @param string       $clientAddress 客户端连接地址
     * @return void
     */
    public function loginSucceeded(AdminAccount $account, string $clientAddress): void
    {
        $this->logger->notice('管理员登录成功', [
            'event' => 'admin_login_succeeded',
            'admin_id' => $account->id,
            'username' => $account->username,
            'client_address' => $clientAddress,
        ]);
    }

    /**
     * 记录登录失败事件。
     * @param string $username      管理员账号输入
     * @param string $clientAddress 客户端连接地址
     * @param string $reason        固定失败原因标识
     * @return void
     */
    public function loginFailed(string $username, string $clientAddress, string $reason): void
    {
        $this->logger->warning('管理员登录失败', [
            'event' => 'admin_login_failed',
            'username' => mb_substr($username, 0, 32),
            'client_address' => $clientAddress,
            'reason' => $reason,
        ]);
    }
}
