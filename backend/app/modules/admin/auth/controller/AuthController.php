<?php

declare(strict_types=1);

namespace app\modules\admin\auth\controller;

use app\modules\admin\auth\application\AdminAuthenticationContext;
use app\modules\admin\auth\application\LoginAdminService;
use app\modules\admin\auth\domain\AdminLoginCredentials;
use app\modules\admin\auth\middleware\AdminAuthMiddleware;
use app\shared\http\ApiResponse;
use JsonException;
use Random\RandomException;
use support\annotation\Middleware;
use support\annotation\route\DisableDefaultRoute;
use support\annotation\route\Get;
use support\annotation\route\Post;
use support\annotation\route\RouteGroup;
use support\limiter\annotation\Limit;
use support\Request;
use support\Response;

/**
 * 提供运营后台登录、身份查询和退出接口。
 */
#[DisableDefaultRoute]
#[RouteGroup('/api/admin/v1/auth')]
final readonly class AuthController
{
    /**
     * 初始化运营后台认证控制器。
     * @param LoginAdminService          $login       管理员登录服务
     * @param ApiResponse                $apiResponse 统一 API 响应生成器
     * @param AdminAuthenticationContext $context     请求级管理员上下文
     */
    public function __construct(
        private LoginAdminService $login,
        private ApiResponse $apiResponse,
        private AdminAuthenticationContext $context,
    ) {
    }

    /**
     * 使用管理员账号和密码登录。
     * @param Request $request 当前 HTTP 请求
     * @return Response 包含管理员资料并写入 HttpOnly JWT Cookie 的响应
     * @throws JsonException 响应数据无法序列化时抛出
     * @throws RandomException 请求追踪标识或 JWT 标识无法生成时抛出
     */
    #[Post(path: '/login', name: 'admin.auth.login')]
    #[Limit(limit: 10, ttl: 60, key: Limit::IP, message: '登录尝试过于频繁，请稍后重试')]
    public function login(Request $request): Response
    {
        $credentials = AdminLoginCredentials::fromArray((array) $request->post());
        $result = $this->login->execute($credentials, $request->getRemoteIp());
        $response = $this->apiResponse->success($request, [
            'user' => $result->account->profile(),
            'expires_at' => $result->token->expiresAt,
        ], '登录成功');

        return $this->withNoStore($response)->cookie(
            $this->cookieName(),
            $result->token->value,
            null,
            '/',
            '',
            $this->secureCookie(),
            true,
            'Strict',
        );
    }

    /**
     * 查询当前已登录管理员资料。
     * @param Request $request 当前 HTTP 请求
     * @return Response 当前管理员资料响应
     * @throws JsonException 响应数据无法序列化时抛出
     * @throws RandomException 请求追踪标识无法生成时抛出
     */
    #[Get(path: '/me', name: 'admin.auth.me')]
    #[Middleware(AdminAuthMiddleware::class)]
    public function me(Request $request): Response
    {
        return $this->withNoStore($this->apiResponse->success($request, [
            'user' => $this->context->account($request)->profile(),
        ]));
    }

    /**
     * 清除当前浏览器的管理员登录 Cookie。
     * @param Request $request 当前 HTTP 请求
     * @return Response 退出成功响应
     * @throws JsonException 响应数据无法序列化时抛出
     * @throws RandomException 请求追踪标识无法生成时抛出
     */
    #[Post(path: '/logout', name: 'admin.auth.logout')]
    public function logout(Request $request): Response
    {
        $response = $this->apiResponse->success($request, null, '已退出登录');

        return $this->withNoStore($response)->cookie(
            $this->cookieName(),
            '',
            0,
            '/',
            '',
            $this->secureCookie(),
            true,
            'Strict',
        );
    }

    /**
     * 获取管理员认证 Cookie 名称。
     * @return string Cookie 名称
     */
    private function cookieName(): string
    {
        return (string) config('authentication.admin.cookie_name', 'hlyq_admin_token');
    }

    /**
     * 判断认证 Cookie 是否仅允许通过 HTTPS 发送。
     * @return bool 仅允许 HTTPS 时返回 true
     */
    private function secureCookie(): bool
    {
        return (bool) config('authentication.admin.secure_cookie', false);
    }

    /**
     * 为认证响应添加禁止缓存响应头。
     * @param Response $response 原始响应
     * @return Response 已添加禁止缓存响应头的响应
     */
    private function withNoStore(Response $response): Response
    {
        return $response->withHeaders([
            'Cache-Control' => 'no-store',
            'Pragma' => 'no-cache',
        ]);
    }
}
