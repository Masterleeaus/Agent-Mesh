<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Facades;

use Illuminate\Support\Facades\Facade;

class Interaction extends Facade
{
    protected static function getFacadeAccessor(): string
    {
        return 'interaction';
    }
}
