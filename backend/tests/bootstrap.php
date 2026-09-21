<?php

declare(strict_types=1);

require dirname(__DIR__) . '/vendor/autoload.php';

\Webman\Config::clear();
\support\App::loadAllConfig(['route']);
