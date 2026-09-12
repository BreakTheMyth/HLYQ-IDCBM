<?php

declare(strict_types=1);

namespace tests\unit\exception;

use app\exception\BusinessException;
use app\exception\Handler;
use app\shared\http\ApiErrorCode;
use app\shared\http\ApiResponse;
use Monolog\Handler\TestHandler;
use Monolog\Logger;
use PHPUnit\Framework\TestCase;
use Psr\Log\NullLogger;
use RuntimeException;
use Webman\Http\Request;

/**
 * 验证全局异常处理器的响应和日志边界。
 */
final class HandlerTest extends TestCase
{
    /**
     * 验证业务异常保留业务状态和安全详情。
     * @return void
     */
    public function testBusinessExceptionIsRenderedWithItsStatusAndSafeData(): void
    {
        $handler = new Handler(new NullLogger(), false, new ApiResponse());
        $request = $this->apiRequest();
        $exception = new BusinessException(
            '订单状态不允许退款',
            ApiErrorCode::CONFLICT,
            409,
            ['order_id' => 1001],
        );

        $response = $handler->render($request, $exception);
        $payload = json_decode($response->rawBody(), true, 512, JSON_THROW_ON_ERROR);

        self::assertSame(409, $response->getStatusCode());
        self::assertSame(ApiErrorCode::CONFLICT, $payload['code']);
        self::assertSame('订单状态不允许退款', $payload['message']);
        self::assertSame(['order_id' => 1001], $payload['data']);
    }

    /**
     * 验证未预期异常不会向接口泄露内部信息。
     * @return void
     */
    public function testUnexpectedApiExceptionDoesNotLeakInternalDetails(): void
    {
        $handler = new Handler(new NullLogger(), true, new ApiResponse());
        $request = $this->apiRequest();

        $response = $handler->render($request, new RuntimeException('SQL password=secret'));
        $payload = json_decode($response->rawBody(), true, 512, JSON_THROW_ON_ERROR);

        self::assertSame(500, $response->getStatusCode());
        self::assertSame(ApiErrorCode::INTERNAL_ERROR, $payload['code']);
        self::assertSame('服务器内部错误，请稍后重试', $payload['message']);
        self::assertNull($payload['data']);
        self::assertStringNotContainsString('secret', $response->rawBody());
    }

    /**
     * 验证只有未预期异常进入系统错误日志。
     * @return void
     */
    public function testOnlyUnexpectedExceptionIsWrittenToSystemErrorLog(): void
    {
        $testHandler = new TestHandler();
        $logger = new Logger('exception-test', [$testHandler]);
        $handler = new Handler($logger, false, new ApiResponse());

        $handler->report(new BusinessException('可预期失败'));
        self::assertCount(0, $testHandler->getRecords());

        $handler->report(new RuntimeException('未预期失败'));
        self::assertTrue($testHandler->hasErrorRecords());
        self::assertCount(1, $testHandler->getRecords());
    }

    /**
     * 创建期望 JSON 响应的 API 测试请求。
     * @return Request API 测试请求
     */
    private function apiRequest(): Request
    {
        return new Request(
            "GET /api/example HTTP/1.1\r\n"
            . "Host: example.test\r\n"
            . "Accept: application/json\r\n\r\n",
        );
    }
}
