<?php

declare(strict_types=1);

namespace app\modules\install\infrastructure;

use app\modules\install\contract\RuntimeReloaderInterface;
use Workerman\Timer;
use Workerman\Worker;

/**
 * 通过 Workerman 主进程信号调度非阻塞重载。
 */
final class WorkermanRuntimeReloader implements RuntimeReloaderInterface
{
    /**
     * 在安装响应返回后调度一次 Webman 重载。
     * @return bool 成功注册重载定时器时返回 true，不支持时返回 false
     */
    public function schedule(): bool
    {
        if (DIRECTORY_SEPARATOR !== '/'
            || !function_exists('posix_kill')
            || !defined('SIGUSR2')
            || Worker::$pidFile === ''
            || !is_file(Worker::$pidFile)) {
            return false;
        }

        $masterPid = (int) file_get_contents(Worker::$pidFile);
        if ($masterPid <= 1) {
            return false;
        }

        Timer::add(1.0, static function () use ($masterPid): void {
            posix_kill($masterPid, SIGUSR2);
        }, [], false);

        return true;
    }
}
