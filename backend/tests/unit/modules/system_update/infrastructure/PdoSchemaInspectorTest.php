<?php

declare(strict_types=1);

namespace tests\unit\modules\system_update\infrastructure;

use app\modules\system_update\infrastructure\PdoSchemaInspector;
use InvalidArgumentException;
use PDO;
use PHPUnit\Framework\TestCase;

/**
 * 验证数据库结构检查和标识符引用能力。
 */
final class PdoSchemaInspectorTest extends TestCase
{
    /**
     * 验证 SQLite 数据表存在性检查和标识符引用。
     * @return void
     */
    public function testInspectsTableAndQuotesSafeIdentifier(): void
    {
        $pdo = new PDO('sqlite::memory:');
        $pdo->exec('CREATE TABLE hlyq_example (id INTEGER PRIMARY KEY)');
        $inspector = new PdoSchemaInspector();

        self::assertTrue($inspector->hasTable($pdo, 'hlyq_example'));
        self::assertFalse($inspector->hasTable($pdo, 'hlyq_missing'));
        self::assertSame('"hlyq_example"', $inspector->quoteIdentifier($pdo, 'hlyq_example'));
    }

    /**
     * 验证不安全的数据表标识符会被拒绝。
     * @return void
     */
    public function testRejectsUnsafeIdentifier(): void
    {
        $this->expectException(InvalidArgumentException::class);

        (new PdoSchemaInspector())->quoteIdentifier(new PDO('sqlite::memory:'), 'users; DROP TABLE users');
    }
}
