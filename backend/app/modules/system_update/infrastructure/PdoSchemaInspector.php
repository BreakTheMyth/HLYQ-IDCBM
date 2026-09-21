<?php

declare(strict_types=1);

namespace app\modules\system_update\infrastructure;

use InvalidArgumentException;
use PDO;

/**
 * 提供系统更新流程需要的 PDO 数据库结构检查能力。
 */
final readonly class PdoSchemaInspector
{
    /**
     * 判断指定数据表是否存在。
     * @param PDO    $pdo       数据库连接
     * @param string $tableName 完整数据表名称
     * @return bool 数据表存在时返回 true
     */
    public function hasTable(PDO $pdo, string $tableName): bool
    {
        if ($pdo->getAttribute(PDO::ATTR_DRIVER_NAME) === 'sqlite') {
            $statement = $pdo->prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = :name");
            $statement->execute(['name' => $tableName]);

            return $statement->fetchColumn() !== false;
        }

        $statement = $pdo->prepare(
            'SELECT 1 FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = :name',
        );
        $statement->execute(['name' => $tableName]);

        return $statement->fetchColumn() !== false;
    }

    /**
     * 引用经过白名单校验的数据表标识符。
     * @param PDO    $pdo        数据库连接
     * @param string $identifier 数据表标识符
     * @return string 已引用的数据表标识符
     * @throws InvalidArgumentException 数据表标识符不安全时抛出
     */
    public function quoteIdentifier(PDO $pdo, string $identifier): string
    {
        if (preg_match('/^[A-Za-z][A-Za-z0-9_]{0,63}$/', $identifier) !== 1) {
            throw new InvalidArgumentException('数据表标识符格式不正确');
        }

        return $pdo->getAttribute(PDO::ATTR_DRIVER_NAME) === 'sqlite'
            ? '"' . $identifier . '"'
            : '`' . $identifier . '`';
    }
}
