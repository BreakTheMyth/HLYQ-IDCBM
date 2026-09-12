<?php

declare(strict_types=1);

namespace app\modules\install\domain;

use app\modules\install\exception\InstallationException;

/**
 * 表示经过校验的 MySQL 与 Redis 安装配置。
 */
final readonly class DatabaseConfiguration
{
    /**
     * 在线安装器固定使用的数据表前缀。
     */
    public const TABLE_PREFIX = 'hlyq_';

    /**
     * 创建数据库与缓存配置值对象。
     * @param string $mysqlHost     MySQL 主机地址
     * @param int    $mysqlPort     MySQL 端口
     * @param string $mysqlDatabase MySQL 数据库名称
     * @param string $mysqlUsername MySQL 用户名
     * @param string $mysqlPassword MySQL 密码
     * @param string $tablePrefix   数据表前缀
     * @param string $redisHost     Redis 主机地址
     * @param int    $redisPort     Redis 端口
     * @param string $redisUsername Redis 用户名
     * @param string $redisPassword Redis 密码
     * @param int    $redisDatabase Redis 数据库编号
     */
    public function __construct(
        public string $mysqlHost,
        public int $mysqlPort,
        public string $mysqlDatabase,
        public string $mysqlUsername,
        public string $mysqlPassword,
        public string $tablePrefix,
        public string $redisHost,
        public int $redisPort,
        public string $redisUsername,
        public string $redisPassword,
        public int $redisDatabase,
    ) {
    }

    /**
     * 从安装表单数据创建并校验数据库配置。
     * @param array<string, mixed> $input 安装表单数据
     * @return self 已校验的数据库配置
     * @throws InstallationException 主机、端口、数据库、账号或密码不合法时抛出
     */
    public static function fromArray(array $input): self
    {
        $mysql = is_array($input['mysql'] ?? null) ? $input['mysql'] : [];
        $redis = is_array($input['redis'] ?? null) ? $input['redis'] : [];

        $mysqlHost = self::host($mysql['host'] ?? null, 'MySQL');
        $mysqlPort = self::port($mysql['port'] ?? 3306, 'MySQL');
        $mysqlDatabase = trim((string) ($mysql['database'] ?? ''));
        $mysqlUsername = trim((string) ($mysql['username'] ?? ''));
        $mysqlPassword = (string) ($mysql['password'] ?? '');
        $tablePrefix = self::TABLE_PREFIX;

        if (!preg_match('/^[a-zA-Z0-9_-]{1,64}$/', $mysqlDatabase)) {
            throw new InstallationException('数据库名称只能包含字母、数字、下划线和连字符');
        }
        if ($mysqlUsername === '' || mb_strlen($mysqlUsername) > 128) {
            throw new InstallationException('请输入有效的 MySQL 用户名');
        }
        if (strlen($mysqlPassword) > 512) {
            throw new InstallationException('MySQL 密码长度不能超过 512 个字符');
        }
        $redisHost = self::host($redis['host'] ?? null, 'Redis');
        $redisPort = self::port($redis['port'] ?? 6379, 'Redis');
        $redisUsername = '';
        $redisPassword = (string) ($redis['password'] ?? '');
        $redisDatabase = filter_var(
            $redis['database'] ?? 0,
            FILTER_VALIDATE_INT,
            ['options' => ['min_range' => 0, 'max_range' => 255]],
        );

        if ($redisDatabase === false) {
            throw new InstallationException('Redis 数据库编号必须在 0 至 255 之间');
        }
        if (strlen($redisPassword) > 512) {
            throw new InstallationException('Redis 密码长度超出限制');
        }

        return new self(
            $mysqlHost,
            $mysqlPort,
            $mysqlDatabase,
            $mysqlUsername,
            $mysqlPassword,
            $tablePrefix,
            $redisHost,
            $redisPort,
            $redisUsername,
            $redisPassword,
            $redisDatabase,
        );
    }

    /**
     * 校验并规范化服务主机地址。
     * @param mixed  $value   待校验主机地址
     * @param string $service 服务名称
     * @return string 规范化后的主机地址
     * @throws InstallationException 主机地址为空、过长或格式不合法时抛出
     */
    private static function host(mixed $value, string $service): string
    {
        $host = trim((string) $value);
        if ($host === '' || strlen($host) > 253 || !preg_match('/^[a-zA-Z0-9._:-]+$/', $host)) {
            throw new InstallationException("请输入有效的 {$service} 主机地址");
        }

        return $host;
    }

    /**
     * 校验并规范化服务端口。
     * @param mixed  $value   待校验端口
     * @param string $service 服务名称
     * @return int 合法端口
     * @throws InstallationException 端口不在有效范围内时抛出
     */
    private static function port(mixed $value, string $service): int
    {
        $port = filter_var(
            $value,
            FILTER_VALIDATE_INT,
            ['options' => ['min_range' => 1, 'max_range' => 65535]],
        );
        if ($port === false) {
            throw new InstallationException("{$service} 端口必须在 1 至 65535 之间");
        }

        return $port;
    }
}
