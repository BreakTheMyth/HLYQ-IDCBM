<?php

declare(strict_types=1);

namespace app\modules\install\exception;

use app\exception\BusinessException;
use app\shared\http\ApiErrorCode;
use Throwable;

/**
 * 安装流程中可安全反馈给操作人的预期异常。
 */
final class InstallationException extends BusinessException
{
    /**
     * 创建安装流程业务异常。
     * @param string                    $message    可安全展示的错误信息
     * @param int                       $httpStatus HTTP 状态码
     * @param Throwable|null            $previous   原始异常
     * @param array<string, mixed>|null $data       结构化错误详情
     * @throws \InvalidArgumentException HTTP 状态码无法映射为合法业务异常时抛出
     */
    public function __construct(
        string $message,
        int $httpStatus = 422,
        ?Throwable $previous = null,
        ?array $data = null,
    ) {
        parent::__construct(
            $message,
            ApiErrorCode::fromHttpStatus($httpStatus),
            $httpStatus,
            $data,
            previous: $previous,
        );
    }

    /**
     * 创建安装请求字段校验异常。
     * @param array<string, list<string>> $errors 字段错误集合
     * @return self 安装请求字段校验异常
     */
    public static function validationFailed(array $errors): self
    {
        return new self(
            '安装信息填写不完整或格式不正确',
            422,
            data: ['errors' => $errors],
        );
    }
}
