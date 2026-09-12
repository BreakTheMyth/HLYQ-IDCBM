<?php

declare(strict_types=1);

namespace app\modules\install\middleware;

use app\modules\install\contract\InstallationStateRepositoryInterface;
use app\shared\http\ApiErrorCode;
use app\shared\http\ApiResponse;
use Webman\Http\Request;
use Webman\Http\Response;
use Webman\MiddlewareInterface;

/**
 * 根据安装状态限制业务入口并引导访问在线安装器。
 */
final readonly class InstallGuardMiddleware implements MiddlewareInterface
{
    /**
     * 初始化安装状态守卫中间件。
     * @param InstallationStateRepositoryInterface $stateRepository 安装状态仓储
     * @param ApiResponse                           $apiResponse     统一 API 响应生成器
     */
    public function __construct(
        private InstallationStateRepositoryInterface $stateRepository,
        private ApiResponse $apiResponse,
    ) {
    }

    /**
     * 按安装状态放行、重定向或拒绝当前请求。
     * @param Request  $request 当前 HTTP 请求
     * @param callable $handler 后续请求处理器
     * @return Response 后续处理结果、安装跳转或服务不可用响应
     * @throws \JsonException 服务不可用响应无法序列化时抛出
     * @throws \Random\RandomException 无法生成请求追踪标识时抛出
     */
    public function process(Request $request, callable $handler): Response
    {
        $path = $request->path();
        $isInstallPage = $path === '/install';
        $isInstallApi = str_starts_with($path, '/api/install/');

        if ($this->stateRepository->isInstalled()) {
            if ($isInstallPage) {
                return redirect('/' . $this->stateRepository->adminPath());
            }

            return $handler($request);
        }

        if ($isInstallPage || $isInstallApi || str_starts_with($path, '/install-assets/')) {
            return $handler($request);
        }

        if (str_starts_with($path, '/api/')) {
            return $this->apiResponse->error(
                $request,
                ApiErrorCode::SERVICE_UNAVAILABLE,
                '系统尚未安装',
                503,
                ['install_url' => '/install'],
            );
        }

        return redirect('/install');
    }
}
