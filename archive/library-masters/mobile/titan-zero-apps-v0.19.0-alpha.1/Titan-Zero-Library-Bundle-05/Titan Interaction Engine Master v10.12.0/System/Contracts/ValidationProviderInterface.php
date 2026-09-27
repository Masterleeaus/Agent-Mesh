<?php

namespace App\Extensions\InteractionEngine\System\Contracts;

interface ValidationProviderInterface
{
    public function validate(mixed $value, array $rules): array;
}
