<?php

declare(strict_types=1);

namespace app\modules\install\contract;

use app\modules\install\domain\DatabaseConfiguration;
use app\modules\install\exception\InstallationException;

/**
 * 定义安装期间数据库与缓存连接检测能力。
 */
interface ConnectionProbeInterface
{
    /**
     * 测试 MySQL 与 Redis 连接并读取版本。
     * @param DatabaseConfiguration $configuration 数据库与缓存配置
     * @return array{mysql: array{version: string}, redis: array{version: string}} 服务版本信息
     * @throws InstallationException 连接失败或服务版本不符合要求时抛出
     */
    public function test(DatabaseConfiguration $configuration): array;
}
