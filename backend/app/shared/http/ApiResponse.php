<?php

declare(strict_types=1);

namespace app\shared\http;

use JsonException;
use Random\RandomException;
use support\Response;
use Webman\Http\Request;

/**
 * 生成结构一致的 API JSON 响应。
 *
 * request_id 存放在 Request 的请求级 context 中，不会在 Webman 常驻进程的
 * 不同请求之间共享。
 */
final class ApiResponse
{
    private const string REQUEST_ID_CONTEXT_KEY = 'hlyq.api_request_id';
    private const string REQUEST_ID_HEADER = 'X-Request-Id';

    /**
     * 生成成功响应。
     * @param Request $request    当前 HTTP 请求
     * @param mixed   $data       响应数据
     * @param string  $message    响应信息
     * @param int     $httpStatus HTTP 状态码
     * @return Response 统一格式的成功响应
     * @throws JsonException 当响应数据无法序列化为 JSON 时抛出
     * @throws RandomException 请求未携带合法追踪标识且无法生成随机标识时抛出
     */
    public function success(
        Request $request,
        mixed $data = null,
        string $message = 'ok',
        int $httpStatus = 200,
    ): Response {
        return $this->respond($request, 0, $message, $data, $httpStatus);
    }

    /**
     * 生成失败响应。
     * @param Request $request    当前 HTTP 请求
     * @param int     $errorCode  稳定业务错误码
     * @param string  $message    可安全展示的错误信息
     * @param int     $httpStatus HTTP 状态码
     * @param mixed   $data       结构化错误详情
     * @return Response 统一格式的失败响应
     * @throws JsonException 当响应数据无法序列化为 JSON 时抛出
     * @throws RandomException 请求未携带合法追踪标识且无法生成随机标识时抛出
     */
    public function error(
        Request $request,
        int $errorCode,
        string $message,
        int $httpStatus,
        mixed $data = null,
    ): Response {
        return $this->respond($request, $errorCode, $message, $data, $httpStatus);
    }

    /**
     * 获取当前请求的追踪标识；合法的上游标识会被沿用。
     * @param Request $request 当前 HTTP 请求
     * @return string 当前请求的追踪标识
     * @throws RandomException 请求未携带合法追踪标识且无法生成随机标识时抛出
     */
    public function requestId(Request $request): string
    {
        $existing = $request->context[self::REQUEST_ID_CONTEXT_KEY] ?? null;
        if (is_string($existing) && $existing !== '') {
            return $existing;
        }

        $provided = $request->header(self::REQUEST_ID_HEADER);
        $requestId = is_string($provided)
            && preg_match('/^[A-Za-z0-9][A-Za-z0-9._:-]{7,63}$/', $provided) === 1
                ? $provided
                : bin2hex(random_bytes(16));

        $request->context[self::REQUEST_ID_CONTEXT_KEY] = $requestId;

        return $requestId;
    }

    /**
     * 序列化并构造统一 API 响应。
     * @param Request $request    当前 HTTP 请求
     * @param int     $code       业务错误码，成功时为 0
     * @param string  $message    响应信息
     * @param mixed   $data       响应数据
     * @param int     $httpStatus HTTP 状态码
     * @return Response 统一格式的 JSON 响应
     * @throws JsonException 当响应数据无法序列化为 JSON 时抛出
     * @throws RandomException 请求未携带合法追踪标识且无法生成随机标识时抛出
     */
    private function respond(
        Request $request,
        int $code,
        string $message,
        mixed $data,
        int $httpStatus,
    ): Response {
        $requestId = $this->requestId($request);
        $body = json_encode([
            'code' => $code,
            'message' => $message,
            'data' => $data,
            'request_id' => $requestId,
        ], JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

        return new Response($httpStatus, [
            'Content-Type' => 'application/json; charset=utf-8',
            self::REQUEST_ID_HEADER => $requestId,
            'X-Content-Type-Options' => 'nosniff',
        ], $body);
    }
}
