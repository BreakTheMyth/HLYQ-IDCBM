<?php

declare(strict_types=1);

namespace tests\unit\shared\http;

use app\shared\http\ApiErrorCode;
use app\shared\http\ApiResponse;
use PHPUnit\Framework\TestCase;
use Webman\Http\Request;

/**
 * 验证统一 API 响应结构和请求追踪标识。
 */
final class ApiResponseTest extends TestCase
{
    private ApiResponse $apiResponse;

    /**
     * 为每个测试初始化统一响应生成器。
     * @return void
     */
    protected function setUp(): void
    {
        $this->apiResponse = new ApiResponse();
    }

    /**
     * 验证成功响应使用固定结构并沿用客户端请求标识。
     * @return void
     */
    public function testSuccessResponseUsesUnifiedEnvelopeAndKeepsRequestId(): void
    {
        $request = $this->request('/api/example', 'client-request-1234');

        $response = $this->apiResponse->success($request, ['id' => 1]);
        $payload = json_decode($response->rawBody(), true, 512, JSON_THROW_ON_ERROR);

        self::assertSame(200, $response->getStatusCode());
        self::assertSame('application/json; charset=utf-8', $response->getHeader('Content-Type'));
        self::assertSame('client-request-1234', $response->getHeader('X-Request-Id'));
        self::assertSame([
            'code' => 0,
            'message' => 'ok',
            'data' => ['id' => 1],
            'request_id' => 'client-request-1234',
        ], $payload);
    }

    /**
     * 验证失败响应区分业务错误码和 HTTP 状态码。
     * @return void
     */
    public function testErrorResponseSeparatesBusinessCodeFromHttpStatus(): void
    {
        $request = $this->request('/api/example');

        $response = $this->apiResponse->error(
            $request,
            ApiErrorCode::VALIDATION_FAILED,
            '参数校验失败',
            422,
            ['errors' => ['name' => ['名称不能为空']]],
        );
        $payload = json_decode($response->rawBody(), true, 512, JSON_THROW_ON_ERROR);

        self::assertSame(422, $response->getStatusCode());
        self::assertSame(ApiErrorCode::VALIDATION_FAILED, $payload['code']);
        self::assertSame('参数校验失败', $payload['message']);
        self::assertSame(['errors' => ['name' => ['名称不能为空']]], $payload['data']);
        self::assertMatchesRegularExpression('/^[a-f0-9]{32}$/', $payload['request_id']);
        self::assertSame($payload['request_id'], $response->getHeader('X-Request-Id'));
    }

    /**
     * 验证同一请求内生成的追踪标识保持一致。
     * @return void
     */
    public function testGeneratedRequestIdIsStableWithinOneRequest(): void
    {
        $request = $this->request('/api/example');

        $first = $this->apiResponse->requestId($request);
        $second = $this->apiResponse->requestId($request);

        self::assertSame($first, $second);
    }

    /**
     * 创建统一响应测试请求。
     * @param string      $path      请求路径
     * @param string|null $requestId 客户端请求标识
     * @return Request 测试请求
     */
    private function request(string $path, ?string $requestId = null): Request
    {
        $requestIdHeader = $requestId === null ? '' : "X-Request-Id: {$requestId}\r\n";

        return new Request(
            "GET {$path} HTTP/1.1\r\n"
            . "Host: example.test\r\n"
            . "Accept: application/json\r\n"
            . $requestIdHeader
            . "\r\n",
        );
    }
}
