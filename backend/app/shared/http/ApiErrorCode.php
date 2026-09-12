<?php

declare(strict_types=1);

namespace app\shared\http;

/**
 * API 通用错误码。
 *
 * 通用错误码使用“HTTP 状态码 × 100”的五位编码。具体业务域可在自己的
 * 错误码类中分配更细的编码，但不得使用 0，且不能改变已有编码的语义。
 */
final class ApiErrorCode
{
    public const int BAD_REQUEST = 40000;
    public const int UNAUTHENTICATED = 40100;
    public const int FORBIDDEN = 40300;
    public const int NOT_FOUND = 40400;
    public const int CONFLICT = 40900;
    public const int VALIDATION_FAILED = 42200;
    public const int LOCKED = 42300;
    public const int TOO_MANY_REQUESTS = 42900;
    public const int INTERNAL_ERROR = 50000;
    public const int SERVICE_UNAVAILABLE = 50300;

    /**
     * 将 HTTP 状态码映射为通用错误码。
     * @param int $httpStatus HTTP 状态码
     * @return int 通用业务错误码
     */
    public static function fromHttpStatus(int $httpStatus): int
    {
        return match ($httpStatus) {
            400 => self::BAD_REQUEST,
            401 => self::UNAUTHENTICATED,
            403 => self::FORBIDDEN,
            404 => self::NOT_FOUND,
            409 => self::CONFLICT,
            422 => self::VALIDATION_FAILED,
            423 => self::LOCKED,
            429 => self::TOO_MANY_REQUESTS,
            503 => self::SERVICE_UNAVAILABLE,
            default => $httpStatus >= 400 && $httpStatus < 500
                ? self::BAD_REQUEST
                : self::INTERNAL_ERROR,
        };
    }
}
