<?php

declare(strict_types=1);

namespace app\modules\install\contract;

/**
 * 定义安装服务器环境检测能力。
 */
interface EnvironmentInspectorInterface
{
    /**
     * 检测服务器环境和安装资源。
     * @return array{passed: bool, items: list<array<string, bool|string>>} 环境检测结果
     */
    public function inspect(): array;
}
