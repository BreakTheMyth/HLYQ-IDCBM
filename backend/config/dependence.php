<?php

declare(strict_types=1);

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
    EnvironmentInspectorInterface::class => DI\autowire(EnvironmentInspector::class),
    ConnectionProbeInterface::class => DI\autowire(ConnectionProbe::class),
    InstallationDatabaseInterface::class => DI\autowire(PdoInstallationDatabase::class),
    InstallationStateRepositoryInterface::class => DI\autowire(FileInstallationStateRepository::class),
    RuntimeReloaderInterface::class => DI\autowire(WorkermanRuntimeReloader::class),
];
