<?php

declare(strict_types=1);

namespace app\command;

use app\modules\system_update\application\SystemMigrationService;
use app\modules\system_update\domain\MigrationDatabaseConfiguration;
use app\modules\system_update\exception\SystemUpdateException;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Question\ConfirmationQuestion;
use Throwable;

/**
 * 执行经过版本约束和记录保护的核心数据库迁移。
 */
#[AsCommand('system:migrate', '执行系统数据库迁移并更新版本记录')]
final class SystemMigrate extends Command
{
    /**
     * 初始化系统数据库迁移命令。
     * @param SystemMigrationService $migrations 系统数据库迁移应用服务
     */
    public function __construct(private readonly SystemMigrationService $migrations)
    {
        parent::__construct();
    }

    /**
     * 配置系统数据库迁移命令参数。
     * @return void
     */
    protected function configure(): void
    {
        $this->addOption(
            'force',
            'f',
            InputOption::VALUE_NONE,
            '确认已完成数据库备份并直接执行迁移',
        );
    }

    /**
     * 确认备份后执行系统数据库迁移。
     * @param InputInterface  $input  命令输入
     * @param OutputInterface $output 命令输出
     * @return int 命令退出码
     */
    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        if (!(bool) $input->getOption('force')) {
            if (!$input->isInteractive()) {
                $output->writeln('<error>非交互模式必须使用 --force，并在执行前完成数据库备份</error>');

                return self::FAILURE;
            }

            $confirmed = $this->getHelper('question')->ask(
                $input,
                $output,
                new ConfirmationQuestion('请确认已经完成数据库备份，是否继续？[y/N] ', false),
            );
            if ($confirmed !== true) {
                $output->writeln('<comment>已取消数据库迁移</comment>');

                return self::SUCCESS;
            }
        }

        try {
            $result = $this->migrations->migrate(
                $this->configuration(),
                (string) config('version.current', '0.1.0'),
                (string) config('version.minimum_upgrade_version', '0.1.0'),
            );
        } catch (SystemUpdateException $exception) {
            $output->writeln('<error>' . $exception->getMessage() . '</error>');

            return self::FAILURE;
        } catch (Throwable) {
            $output->writeln('<error>系统数据库迁移配置无效，请检查运行配置</error>');

            return self::FAILURE;
        }

        if ($result->executed === []) {
            $output->writeln('<info>数据库结构和系统版本已经是最新状态</info>');
        } else {
            $output->writeln('<info>数据库迁移执行完成</info>');
            $output->writeln('本次执行版本：' . implode(', ', $result->executed));
        }
        if ($result->output !== '') {
            $output->writeln($result->output, OutputInterface::VERBOSITY_VERBOSE);
        }

        return self::SUCCESS;
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
}
