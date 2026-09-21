<?php

declare(strict_types=1);

namespace app\command;

use app\modules\system_update\application\SystemMigrationService;
use app\modules\system_update\domain\MigrationDatabaseConfiguration;
use app\modules\system_update\exception\SystemUpdateException;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Throwable;

/**
 * 输出当前系统版本与核心数据库迁移状态。
 */
#[AsCommand('system:migration-status', '查看系统版本和数据库迁移状态')]
final class SystemMigrationStatus extends Command
{
    /**
     * 初始化系统迁移状态命令。
     * @param SystemMigrationService $migrations 系统数据库迁移应用服务
     */
    public function __construct(private readonly SystemMigrationService $migrations)
    {
        parent::__construct();
    }

    /**
     * 查询并输出系统数据库迁移状态。
     * @param InputInterface  $input  命令输入
     * @param OutputInterface $output 命令输出
     * @return int 命令退出码
     */
    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        try {
            $status = $this->migrations->status($this->configuration(), $this->codeVersion());
        } catch (SystemUpdateException $exception) {
            $output->writeln('<error>' . $exception->getMessage() . '</error>');

            return self::FAILURE;
        } catch (Throwable) {
            $output->writeln('<error>系统数据库迁移配置无效，请检查运行配置</error>');

            return self::FAILURE;
        }

        $output->writeln('代码版本：<info>' . $status->codeVersion . '</info>');
        $output->writeln('数据库版本：<info>' . ($status->databaseVersion ?? '未安装') . '</info>');
        $output->writeln('最新迁移：<info>' . ($status->migrations->latest ?: '无') . '</info>');
        $output->writeln('已执行迁移：<info>' . count($status->migrations->applied) . '</info>');
        $output->writeln('待执行迁移：<comment>' . count($status->migrations->pending) . '</comment>');
        $output->writeln('缺失迁移：<comment>' . count($status->migrations->missing) . '</comment>');

        if ($status->migrations->pending !== []) {
            $output->writeln('待执行版本：' . implode(', ', $status->migrations->pending));
        }
        if ($status->migrations->missing !== []) {
            $output->writeln('<error>代码包缺失版本：' . implode(', ', $status->migrations->missing) . '</error>');
        }

        return $status->requiresUpdate() ? 2 : self::SUCCESS;
    }

    /**
     * 从 Webman 配置创建数据库迁移连接配置。
     * @return MigrationDatabaseConfiguration 数据库迁移连接配置
     */
    private function configuration(): MigrationDatabaseConfiguration
    {
        /** @var array<string, mixed> $configuration */
        $configuration = config('database.connections.mysql', []);

        return MigrationDatabaseConfiguration::fromArray($configuration);
    }

    /**
     * 获取当前代码包版本。
     * @return string 当前代码包版本
     */
    private function codeVersion(): string
    {
        return (string) config('version.current', '0.1.0');
    }
}
