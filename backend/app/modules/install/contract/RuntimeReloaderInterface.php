<?php

declare(strict_types=1);

namespace app\modules\install\contract;

/**
 * 定义安装完成后的 Webman 运行时重载能力。
 */
interface RuntimeReloaderInterface
{
    /**
     * 调度一次非阻塞的运行时重载。
     * @return bool 成功调度时返回 true，不支持重载时返回 false
     */
    public function schedule(): bool;
}
