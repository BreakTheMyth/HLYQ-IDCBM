<?php

declare(strict_types=1);

use Dotenv\Dotenv;

require_once __DIR__ . '/vendor/autoload.php';

if (is_file(__DIR__ . '/.env')) {
    Dotenv::createUnsafeImmutable(__DIR__)->safeLoad();
}

$tablePrefix = getenv('DB_PREFIX') ?: 'hlyq_';

return [
    'paths' => [
        'migrations' => __DIR__ . '/database/migrations',
    ],
    'environments' => [
        'default_migration_table' => $tablePrefix . 'migration_versions',
        'default_environment' => 'production',
        'production' => [
            'adapter' => 'mysql',
            'host' => getenv('DB_HOST') ?: '127.0.0.1',
            'port' => (int) (getenv('DB_PORT') ?: 3306),
            'name' => getenv('DB_NAME') ?: '',
            'user' => getenv('DB_USER') ?: '',
            'pass' => getenv('DB_PASSWORD') ?: '',
            'charset' => 'utf8mb4',
            'collation' => 'utf8mb4_unicode_ci',
            'table_prefix' => $tablePrefix,
        ],
    ],
    'version_order' => 'creation',
];
