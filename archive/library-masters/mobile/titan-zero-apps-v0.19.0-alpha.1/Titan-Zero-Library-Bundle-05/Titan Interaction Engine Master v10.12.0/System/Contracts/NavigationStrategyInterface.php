<?php

namespace App\Extensions\InteractionEngine\System\Contracts;

interface NavigationStrategyInterface
{
    public function next(array $state, array $sections): ?int;
}
