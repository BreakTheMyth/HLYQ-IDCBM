<?php

declare(strict_types=1);

namespace app\exception;

use app\shared\http\ApiErrorCode;
use InvalidArgumentException;
use RuntimeException;
use Throwable;

/**
 * 可安全展示给接口调用方的业务异常基类。
 *
 * 业务异常属于预期失败，默认不进入系统异常日志。需要安全审计的认证、权限、
 * 支付等事件，应由对应应用服务写入脱敏后的独立审计日志。
 */
class BusinessException extends RuntimeException
{
    /**
     * 创建可安全展示的业务异常。
     * @param string                    $message    可安全展示的错误信息
     * @param int                       $errorCode  稳定业务错误码
     * @param int                       $httpStatus HTTP 状态码
     * @param array<string, mixed>|null $data       可安全返回的结构化错误详情
     * @param Throwable|null            $previous   原始异常
     * @throws InvalidArgumentException 业务错误码或 HTTP 状态码不合法时抛出
     */
    public function __construct(
        string $message,
        private readonly int $errorCode = ApiErrorCode::VALIDATION_FAILED,
        private readonly int $httpStatus = 422,
        private readonly ?array $data = null,
        ?Throwable $previous = null,
    ) {
        if ($errorCode <= 0) {
            throw new InvalidArgumentException('业务错误码必须大于 0');
        }

        if ($httpStatus < 400 || $httpStatus > 599) {
            throw new InvalidArgumentException('业务异常的 HTTP 状态码必须在 400 至 599 之间');
        }

        parent::__construct($message, $errorCode, $previous);
    }

    /**
     * 获取稳定业务错误码。
     * @return int 业务错误码
     */
    public function errorCode(): int
    {
        return $this->errorCode;
    }

    /**
     * 获取对应 HTTP 状态码。
     * @return int HTTP 状态码
     */
    public function httpStatus(): int
    {
        return $this->httpStatus;
    }

    /**
     * 获取可安全返回的结构化错误详情。
     * @return array<string, mixed>|null 错误详情，无详情时返回 null
     */
    public function data(): ?array
    {
        return $this->data;
    }
}
