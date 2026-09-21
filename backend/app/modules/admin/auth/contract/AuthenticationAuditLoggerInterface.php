<?php

declare(strict_types=1);

namespace app\modules\admin\auth\contract;

use app\modules\admin\auth\domain\AdminAccount;

/**
 * 定义管理员认证安全事件的审计记录能力。
 */
interface AuthenticationAuditLoggerInterface
{
    /**
     * 记录登录成功事件。
     * @param AdminAccount $account       管理员账号
     * @param string       $clientAddress 客户端连接地址
     * @return void
     */
    public function loginSucceeded(AdminAccount $account, string $clientAddress): void;

    /**
     * 记录登录失败事件。
     * @param string $username      管理员账号输入
     * @param string $clientAddress 客户端连接地址
     * @param string $reason        固定失败原因标识
     * @return void
     */
    public function loginFailed(string $username, string $clientAddress, string $reason): void;
}
