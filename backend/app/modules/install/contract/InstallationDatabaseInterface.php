<?php

declare(strict_types=1);

namespace app\modules\install\contract;

use app\modules\install\domain\InstallationConfiguration;
use app\modules\install\exception\InstallationException;

/**
 * 定义在线安装器初始化数据库时使用的持久化能力。
 */
interface InstallationDatabaseInterface
{
    /**
     * 执行可重复调用的核心数据库迁移。
     * @param InstallationConfiguration $configuration 已校验的安装配置
     * @return void
     * @throws InstallationException 数据库连接或迁移执行失败时抛出
     */
    public function createSchema(InstallationConfiguration $configuration): void;

    /**
     * 写入网站、管理员以及已同意的软件协议版本等初始数据。
     * @param InstallationConfiguration $configuration 已校验的安装配置
     * @return void
     * @throws InstallationException 初始化数据写入失败时抛出
     */
    public function seedSystem(InstallationConfiguration $configuration): void;
}
