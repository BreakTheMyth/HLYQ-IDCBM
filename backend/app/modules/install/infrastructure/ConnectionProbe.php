<?php

declare(strict_types=1);

namespace app\modules\install\infrastructure;

use app\modules\install\contract\ConnectionProbeInterface;
use app\modules\install\domain\DatabaseConfiguration;
use app\modules\install\exception\InstallationException;
use RedisException;

/**
 * 使用真实连接检测 MySQL 与 Redis 服务状态。
 */
final readonly class ConnectionProbe implements ConnectionProbeInterface
{
    /**
     * 初始化连接检测器。
     * @param PdoConnectionFactory $connections 数据库与缓存连接工厂
     */
    public function __construct(private PdoConnectionFactory $connections)
    {
    }

    /**
     * 测试 MySQL 与 Redis 连接并读取服务版本。
     * @param DatabaseConfiguration $configuration 数据库与缓存配置
     * @return array{mysql: array{version: string}, redis: array{version: string}} 服务版本信息
     * @throws InstallationException 连接失败或 MySQL 版本低于 8.0 时抛出
     * @throws \PDOException MySQL 版本查询失败时抛出
     */
    public function test(DatabaseConfiguration $configuration): array
    {
        $pdo = $this->connections->mysql($configuration);
        $version = (string) $pdo->query('SELECT VERSION()')->fetchColumn();
        $numericVersion = preg_replace('/[^0-9.].*$/', '', $version) ?: '0.0.0';
        if (version_compare($numericVersion, '8.0.0', '<')) {
            throw new InstallationException("MySQL 版本 {$version} 不符合要求，最低需要 MySQL 8.0");
        }

        $redisResult = $this->connections->redis($configuration);
        try {
            $redisResult['client']->close();
        } catch (RedisException) {
        }

        return [
            'mysql' => ['version' => $version],
            'redis' => ['version' => $redisResult['version']],
        ];
    }
}
