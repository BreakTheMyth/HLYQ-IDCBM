<?php

declare(strict_types=1);

use app\modules\admin\auth\contract\AdminAccessTokenServiceInterface;
use app\modules\admin\auth\contract\AdminAccountRepositoryInterface;
use app\modules\admin\auth\contract\AuthenticationAuditLoggerInterface;
use app\modules\admin\auth\infrastructure\DatabaseAdminAccountRepository;
use app\modules\admin\auth\infrastructure\FirebaseAdminAccessTokenService;
use app\modules\admin\auth\infrastructure\MonologAuthenticationAuditLogger;
use app\modules\install\contract\ConnectionProbeInterface;
use app\modules\install\contract\EnvironmentInspectorInterface;
use app\modules\install\contract\InstallationDatabaseInterface;
use app\modules\install\contract\InstallationStateRepositoryInterface;
use app\modules\install\contract\RuntimeReloaderInterface;
use app\modules\install\infrastructure\ConnectionProbe;
use app\modules\install\infrastructure\EnvironmentInspector;
use app\modules\install\infrastructure\FileInstallationStateRepository;
use app\modules\install\infrastructure\PdoInstallationDatabase;
use app\modules\install\infrastructure\WorkermanRuntimeReloader;
use support\Log;

/**
 * This file is part of webman.
 *
 * Licensed under The MIT License
 * For full copyright and license information, please see the MIT-LICENSE.txt
 * Redistributions of files must retain the above copyright notice.
 *
 * @author    walkor<walkor@workerman.net>
 * @copyright walkor<walkor@workerman.net>
 * @link      http://www.workerman.net/
 * @license   http://www.opensource.org/licenses/mit-license.php MIT License
 */

return [
    AdminAccountRepositoryInterface::class => DI\autowire(DatabaseAdminAccountRepository::class),
    AdminAccessTokenServiceInterface::class => DI\factory(static function (): FirebaseAdminAccessTokenService {
        return new FirebaseAdminAccessTokenService(
            (string) config('authentication.admin.secret', ''),
            (string) config('authentication.admin.issuer', 'hlyq-idcbm'),
            (string) config('authentication.admin.audience', 'hlyq-admin'),
            (int) config('authentication.admin.ttl', 7200),
        );
    }),
    AuthenticationAuditLoggerInterface::class => DI\factory(static function (): MonologAuthenticationAuditLogger {
        return new MonologAuthenticationAuditLogger(Log::channel('audit'));
    }),
    EnvironmentInspectorInterface::class => DI\autowire(EnvironmentInspector::class),
    ConnectionProbeInterface::class => DI\autowire(ConnectionProbe::class),
    InstallationDatabaseInterface::class => DI\autowire(PdoInstallationDatabase::class),
    InstallationStateRepositoryInterface::class => DI\autowire(FileInstallationStateRepository::class),
    RuntimeReloaderInterface::class => DI\autowire(WorkermanRuntimeReloader::class),
];
