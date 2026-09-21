<?php

declare(strict_types=1);

namespace app\modules\admin\auth\validation;

use app\modules\admin\auth\exception\AdminAuthenticationException;
use support\validation\Validator;

/**
 * 验证运营后台账号密码登录输入。
 */
final class AdminLoginValidator extends Validator
{
    /**
     * @var array<string, string> 登录字段验证规则
     */
    protected array $rules = [
        'username' => 'required|string|max:32',
        'password' => 'required|string|max:128',
        'remember' => 'sometimes|boolean:strict',
    ];

    /**
     * @var array<string, string> 登录字段验证提示
     */
    protected array $messages = [
        'username.required' => '请输入管理员账号',
        'username.string' => '管理员账号格式不正确',
        'username.max' => '管理员账号不能超过 32 个字符',
        'password.required' => '请输入管理员密码',
        'password.string' => '管理员密码格式不正确',
        'password.max' => '管理员密码不能超过 128 个字符',
        'remember.boolean' => '记住我选项必须为布尔值',
    ];

    /**
     * 验证登录输入并返回规范化白名单数据。
     * @return array{username: string, password: string, remember: bool} 已验证登录数据
     * @throws AdminAuthenticationException 登录字段不符合要求时抛出
     */
    public function validateCredentials(): array
    {
        $validator = $this->toIlluminate();
        if ($validator->fails()) {
            /** @var array<string, list<string>> $errors */
            $errors = $validator->errors()->toArray();

            throw AdminAuthenticationException::validationFailed($errors);
        }

        /** @var array{username: string, password: string, remember: bool} $validated */
        $validated = $validator->validated();

        return $validated;
    }

    /**
     * 规范化登录账号并保留其他原始字段供规则判断。
     * @return array<string, mixed> 规范化后的验证数据
     */
    public function data(): array
    {
        $data = parent::data();
        if (!array_key_exists('remember', $data)) {
            $data['remember'] = false;
        }

        if (isset($data['username']) && is_string($data['username'])) {
            $data['username'] = trim($data['username']);
        }

        return $data;
    }
}
