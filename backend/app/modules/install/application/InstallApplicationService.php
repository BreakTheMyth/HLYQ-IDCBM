<?php

declare(strict_types=1);

namespace app\modules\install\application;

use app\modules\install\contract\ConnectionProbeInterface;
use app\modules\install\contract\EnvironmentInspectorInterface;
use app\modules\install\contract\InstallationDatabaseInterface;
use app\modules\install\contract\InstallationStateRepositoryInterface;
use app\modules\install\contract\RuntimeReloaderInterface;
use app\modules\install\domain\DatabaseConfiguration;
use app\modules\install\domain\InstallationConfiguration;
use app\modules\install\exception\InstallationException;
use Random\RandomException;

/**
 * 编排在线安装流程的各个应用阶段。
 */
final readonly class InstallApplicationService
{
    private const PHASES = ['database', 'system', 'configuration', 'finalize'];

    /**
     * 初始化安装应用服务。
     * @param EnvironmentInspectorInterface         $environmentInspector 服务器环境检测器
     * @param ConnectionProbeInterface              $connectionProbe      数据库与缓存连接检测器
     * @param InstallationDatabaseInterface         $installationDatabase 安装数据持久化服务
     * @param InstallationStateRepositoryInterface  $stateRepository      安装状态仓储
     * @param RuntimeReloaderInterface               $runtimeReloader      Webman 运行时重载调度器
     */
    public function __construct(
        private EnvironmentInspectorInterface $environmentInspector,
        private ConnectionProbeInterface $connectionProbe,
        private InstallationDatabaseInterface $installationDatabase,
        private InstallationStateRepositoryInterface $stateRepository,
        private RuntimeReloaderInterface $runtimeReloader,
    ) {
    }

    /**
     * 检测服务器是否满足安装要求。
     * @return array{passed: bool, items: list<array<string, bool|string>>} 环境检测结果
     */
    public function environment(): array
    {
        return $this->environmentInspector->inspect();
    }

    /**
     * 测试 MySQL 与 Redis 连接。
     * @param array<string, mixed> $input 数据库与缓存配置
     * @return array{mysql: array{version: string}, redis: array{version: string}} 服务版本信息
     * @throws InstallationException 系统已安装、配置无效或连接测试失败时抛出
     */
    public function testConnections(array $input): array
    {
        $this->assertNotInstalled();

        return $this->connectionProbe->test(DatabaseConfiguration::fromArray($input));
    }

    /**
     * 生成安全的后台路径、管理员账号和管理员密码。
     * @return array{admin_path: string, admin_username: string, admin_password: string} 随机安装默认值
     * @throws RandomException 无法从系统安全随机源取得数据时抛出
     */
    public function randomDefaults(): array
    {
        return [
            'admin_path' => 'manage-' . strtolower(substr(bin2hex(random_bytes(8)), 0, 10)),
            'admin_username' => 'admin_' . strtolower(substr(bin2hex(random_bytes(5)), 0, 8)),
            'admin_password' => $this->randomPassword(),
        ];
    }

    /**
     * 执行指定安装阶段。
     * @param string               $phase 安装阶段标识
     * @param array<string, mixed> $input 完整安装配置
     * @param string               $token 安装会话令牌
     * @return array<string, bool|int|string|array<string, string>> 阶段执行结果
     * @throws InstallationException 安装状态、环境、配置或持久化操作不符合要求时抛出
     * @throws RandomException 无法生成应用密钥时抛出
     */
    public function execute(string $phase, array $input, string $token): array
    {
        $this->assertNotInstalled();
        if (!in_array($phase, self::PHASES, true)) {
            throw new InstallationException('未知的安装阶段');
        }

        $environment = $this->environmentInspector->inspect();
        if (!$environment['passed']) {
            throw new InstallationException('服务器环境检测未通过，请修复后重试', 409);
        }

        $configuration = InstallationConfiguration::fromArray($input);
        $this->stateRepository->claim(
            $token,
            $configuration->databaseFingerprint(),
            $configuration->fingerprint(),
            $phase,
        );

        $result = match ($phase) {
            'database' => $this->installDatabase($configuration),
            'system' => $this->installSystem($configuration),
            'configuration' => $this->writeConfiguration($configuration),
            'finalize' => $this->finalize($configuration, $token),
        };

        if ($phase !== 'finalize') {
            $this->stateRepository->complete($token, $phase);
        }

        return $result;
    }

    /**
     * 创建数据库表结构。
     * @param InstallationConfiguration $configuration 已校验的安装配置
     * @return array<string, int|string|array<string, string>> 数据库阶段执行结果
     * @throws InstallationException 数据库连接或建表失败时抛出
     */
    private function installDatabase(InstallationConfiguration $configuration): array
    {
        $versions = $this->connectionProbe->test($configuration->database);
        $this->installationDatabase->createSchema($configuration);

        return [
            'progress' => 35,
            'message' => '数据库连接与基础表结构创建完成',
            'versions' => [
                'mysql' => $versions['mysql']['version'],
                'redis' => $versions['redis']['version'],
            ],
        ];
    }

    /**
     * 写入网站和管理员初始数据。
     * @param InstallationConfiguration $configuration 已校验的安装配置
     * @return array<string, int|string> 系统数据阶段执行结果
     * @throws InstallationException 建表或初始化系统数据失败时抛出
     */
    private function installSystem(InstallationConfiguration $configuration): array
    {
        $this->installationDatabase->createSchema($configuration);
        $this->installationDatabase->seedSystem($configuration);

        return [
            'progress' => 68,
            'message' => '系统配置与管理员账号初始化完成',
        ];
    }

    /**
     * 将安装配置写入运行环境文件。
     * @param InstallationConfiguration $configuration 已校验的安装配置
     * @return array<string, int|string> 配置写入阶段执行结果
     * @throws InstallationException 写入运行配置失败时抛出
     * @throws RandomException 无法生成应用密钥时抛出
     */
    private function writeConfiguration(InstallationConfiguration $configuration): array
    {
        $this->stateRepository->writeConfiguration($configuration, bin2hex(random_bytes(32)));

        return [
            'progress' => 88,
            'message' => '运行配置已安全写入',
        ];
    }

    /**
     * 标记安装完成并调度运行时重载。
     * @param InstallationConfiguration $configuration 已校验的安装配置
     * @param string                    $token         安装会话令牌
     * @return array<string, bool|int|string|array<string, string>> 安装完成结果
     * @throws InstallationException 安装会话失效或完成状态写入失败时抛出
     */
    private function finalize(InstallationConfiguration $configuration, string $token): array
    {
        $this->stateRepository->finalize($configuration, $token);
        $reloadScheduled = $this->runtimeReloader->schedule();
        $adminUrl = $configuration->siteUrl . '/' . $configuration->adminPath;

        return [
            'progress' => 100,
            'message' => '安装完成',
            'reload_scheduled' => $reloadScheduled,
            'result' => [
                'home_url' => $configuration->siteUrl . '/',
                'admin_url' => $adminUrl,
                'admin_path' => $configuration->adminPath,
                'admin_username' => $configuration->adminUsername,
                'admin_nickname' => $configuration->adminNickname,
            ],
        ];
    }

    /**
     * 断言系统尚未完成安装。
     * @return void
     * @throws InstallationException 系统已经安装时抛出
     */
    private function assertNotInstalled(): void
    {
        if ($this->stateRepository->isInstalled()) {
            throw new InstallationException('系统已经安装，禁止重复执行安装', 409);
        }
    }

    /**
     * 生成满足复杂度要求的管理员密码。
     * @return string 随机管理员密码
     * @throws RandomException 无法从系统安全随机源取得数据时抛出
     */
    private function randomPassword(): string
    {
        $groups = [
            'ABCDEFGHJKLMNPQRSTUVWXYZ',
            'abcdefghijkmnopqrstuvwxyz',
            '23456789',
            '!@#$%^&*_-+=',
        ];
        $characters = [];
        foreach ($groups as $group) {
            $characters[] = $group[random_int(0, strlen($group) - 1)];
        }

        $all = implode('', $groups);
        while (count($characters) < 20) {
            $characters[] = $all[random_int(0, strlen($all) - 1)];
        }

        for ($index = count($characters) - 1; $index > 0; --$index) {
            $target = random_int(0, $index);
            [$characters[$index], $characters[$target]] = [$characters[$target], $characters[$index]];
        }

        return implode('', $characters);
    }
}
