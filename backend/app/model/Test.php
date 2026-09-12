<?php

namespace app\model;

use support\Model;

/**
 * Webman 初始化阶段保留的测试数据模型。
 */
class Test extends Model
{
    /**
     * The table associated with the model.
     * @var string
     */
    protected $table = 'test';

    /**
     * The primary key associated with the table.
     * @var string
     */
    protected $primaryKey = 'id';

    /**
     * Indicates if the model should be timestamped.
     * @var bool
     */
    public $timestamps = false;
}
