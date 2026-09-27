<?php

declare(strict_types=1);
namespace App\Extensions\TitanHub\System\Contracts;

interface HubPresentationBridge
{
    public function surface(): string;
    public function compose(string $workspace, array $context, array $projection): array;
    public function interaction(array $context, array $input): array;
}
