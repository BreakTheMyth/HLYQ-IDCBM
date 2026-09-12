<?php

declare(strict_types=1);

namespace app\modules\install\infrastructure;

use app\modules\install\domain\DatabaseConfiguration;
use app\modules\install\exception\InstallationException;
use PDO;
use PDOException;
use Redis;
use RedisException;

/**
 * 根据安装配置创建短生命周期的 MySQL 与 Redis 连接。
 */
final class PdoConnectionFactory
{
    /**
     * 创建启用异常模式的 MySQL PDO 连接。
     * @param DatabaseConfiguration $configuration 数据库配置
     * @return PDO 已连接的 PDO 实例
     * @throws InstallationException MySQL 连接失败时抛出
     */
    public function mysql(DatabaseConfiguration $configuration): PDO
    {
        $dsn = sprintf(
            'mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4',
            $configuration->mysqlHost,
            $configuration->mysqlPort,
            $configuration->mysqlDatabase,
        );

        try {
            return new PDO(
                $dsn,
                $configuration->mysqlUsername,
                $configuration->mysqlPassword,
                [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES => false,
                    PDO::ATTR_TIMEOUT => 5,
                ],
            );
        } catch (PDOException $exception) {
            throw new InstallationException('MySQL 连接失败，请检查地址、数据库名称和账号权限', 422, $exception);
        }
    }

    /**
     * 创建 Redis 连接并完成认证、数据库选择和 PING 检测。
     * @param DatabaseConfiguration $configuration Redis 配置
     * @return array{client: Redis, version: string} Redis 客户端和服务版本
     * @throws InstallationException Redis 扩展缺失、连接、认证或检测失败时抛出
     */
    public function redis(DatabaseConfiguration $configuration): array
    {
        if (!class_exists(Redis::class)) {
            throw new InstallationException('未安装 PHP Redis 扩展');
        }

        $redis = new Redis();
        try {
            if (!$redis->connect($configuration->redisHost, $configuration->redisPort, 5.0)) {
                throw new InstallationException('Redis 连接失败，请检查地址和端口');
            }

            if ($configuration->redisUsername !== '' || $configuration->redisPassword !== '') {
                $credentials = $configuration->redisUsername !== ''
                    ? [$configuration->redisUsername, $configuration->redisPassword]
                    : $configuration->redisPassword;
                if (!$redis->auth($credentials)) {
                    throw new InstallationException('Redis 认证失败，请检查用户名和密码');
                }
            }

            if (!$redis->select($configuration->redisDatabase)) {
                throw new InstallationException('Redis 数据库选择失败');
            }

            $pong = $redis->ping();
            if ($pong !== true && !in_array((string) $pong, ['PONG', '+PONG'], true)) {
                throw new InstallationException('Redis PING 检测失败');
            }

            $info = $redis->info('server');
            $version = is_array($info) ? (string) ($info['redis_version'] ?? '未知') : '未知';

            return ['client' => $redis, 'version' => $version];
        } catch (RedisException $exception) {
            try {
                $redis->close();
            } catch (RedisException) {
            }
            throw new InstallationException('Redis 连接失败，请检查连接和认证配置', 422, $exception);
        }
    }
}
