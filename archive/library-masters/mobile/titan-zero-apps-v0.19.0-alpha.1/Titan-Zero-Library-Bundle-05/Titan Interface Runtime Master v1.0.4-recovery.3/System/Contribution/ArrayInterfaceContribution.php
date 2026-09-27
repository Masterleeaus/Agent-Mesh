<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Contribution;

use App\Extensions\TitanInterfaceRuntime\System\Contracts\InterfaceContribution;
final readonly class ArrayInterfaceContribution implements InterfaceContribution
{
    public function __construct(private string $id, private array $payload) {}
    public function key(): string { return $this->id; }
    public function definition(): array { return $this->payload; }
}
