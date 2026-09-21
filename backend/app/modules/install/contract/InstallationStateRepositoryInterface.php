<?php

declare(strict_types=1);

namespace app\modules\install\contract;

use app\modules\install\domain\InstallationConfiguration;
use app\modules\install\exception\InstallationException;

/**
 * 定义安装状态、锁和运行配置的持久化边界。
 */
interface InstallationStateRepositoryInterface
{
    /**
     * 判断系统是否已经安装。
     * @return bool 已安装时返回 true
     */
    public function isInstalled(): bool;

    /**
     * 获取已配置的后台访问路径。
     * @return string 合法后台路径，配置无效时返回安全默认值
     */
    public function adminPath(): string;

    /**
     * 申请执行一个安装阶段并校验阶段顺序。
     * @param string $token                    安装会话令牌
     * @param string $databaseFingerprint      数据库配置指纹
     * @param string $configurationFingerprint 完整配置指纹
     * @param string $phase                    安装阶段标识
     * @return void
     * @throws InstallationException 会话、指纹、锁或阶段顺序不合法时抛出
     */
    public function claim(
        string $token,
        string $databaseFingerprint,
        string $configurationFingerprint,
        string $phase,
    ): void;

    /**
     * 记录指定安装阶段已经完成。
     * @param string $token 安装会话令牌
     * @param string $phase 安装阶段标识
     * @return void
     * @throws InstallationException 会话失效或阶段不合法时抛出
     */
    public function complete(string $token, string $phase): void;

    /**
     * 写入尚未标记完成的运行配置。
     * @param InstallationConfiguration $configuration 已校验的安装配置
     * @param string                    $appKey        应用密钥
     * @param string                    $jwtSecret     JWT 签名密钥
     * @return void
     * @throws InstallationException 配置文件写入失败时抛出
     */
    public function writeConfiguration(
        InstallationConfiguration $configuration,
        string $appKey,
        string $jwtSecret,
    ): void;

    /**
     * 完成安装并清理活动安装状态。
     * @param InstallationConfiguration $configuration 已校验的安装配置
     * @param string                    $token         安装会话令牌
     * @return void
     * @throws InstallationException 会话失效或完成状态写入失败时抛出
     */
    public function finalize(InstallationConfiguration $configuration, string $token): void;
}
