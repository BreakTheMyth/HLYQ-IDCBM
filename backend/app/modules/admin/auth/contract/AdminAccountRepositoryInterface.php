<?php

declare(strict_types=1);

namespace app\modules\admin\auth\contract;

use app\modules\admin\auth\domain\AdminAccount;

/**
 * 定义管理员认证所需的账号持久化能力。
 */
interface AdminAccountRepositoryInterface
{
    /**
     * 按账号查询管理员。
     * @param string $username 管理员账号
     * @return AdminAccount|null 管理员账号，不存在时返回 null
     */
    public function findByUsername(string $username): ?AdminAccount;

    /**
     * 按标识查询管理员。
     * @param int $adminId 管理员标识
     * @return AdminAccount|null 管理员账号，不存在时返回 null
     */
    public function findById(int $adminId): ?AdminAccount;

    /**
     * 记录管理员最近登录时间。
     * @param int    $adminId  管理员标识
     * @param string $loggedAt 登录时间
     * @return void
     */
    public function recordSuccessfulLogin(int $adminId, string $loggedAt): void;
}
