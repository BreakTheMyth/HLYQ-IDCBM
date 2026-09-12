<?php

declare(strict_types=1);

namespace app\controller;

use app\modules\install\contract\InstallationStateRepositoryInterface;
use support\Response;

/**
 * 提供会员控制台和运营后台单页应用入口。
 */
final readonly class FrontendController
{
    /**
     * 初始化前端应用入口控制器。
     * @param InstallationStateRepositoryInterface $stateRepository 安装状态仓储
     */
    public function __construct(private InstallationStateRepositoryInterface $stateRepository)
    {
    }

    /**
     * 返回会员控制台入口页面。
     * @return Response 会员控制台 HTML 响应
     */
    public function console(): Response
    {
        return $this->serve('console');
    }

    /**
     * 校验动态后台路径并返回运营后台入口页面。
     * @param string $path 当前请求路径
     * @return Response 运营后台 HTML 响应或 404 响应
     */
    public function admin(string $path): Response
    {
        $firstSegment = explode('/', trim($path, '/'))[0] ?? '';
        if (!hash_equals($this->stateRepository->adminPath(), $firstSegment)) {
            return response('Not Found', 404);
        }

        return $this->serve('admin');
    }

    /**
     * 读取指定前端应用的构建入口。
     * @param string $application 前端应用目录标识
     * @return Response 前端 HTML 响应或资源不可用响应
     */
    private function serve(string $application): Response
    {
        $path = public_path() . "/app/{$application}/index.html";
        if (!is_file($path)) {
            return response('Frontend application is not built', 503);
        }

        $html = file_get_contents($path);
        if ($html === false) {
            return response('Frontend application is unavailable', 503);
        }

        return response($html, 200, [
            'Content-Type' => 'text/html; charset=utf-8',
            'Cache-Control' => 'no-cache',
            'X-Content-Type-Options' => 'nosniff',
        ]);
    }
}
