<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Registry;

use App\Extensions\TitanInterfaceRuntime\System\Contracts\InterfaceContribution;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\InterfaceContributionRegistry;

final class SemanticInterfaceContributionRegistry implements InterfaceContributionRegistry
{
    /** @var array<string,InterfaceContribution> */ private array $items=[];

    public function register(InterfaceContribution $contribution): void
    {
        $key=trim($contribution->key());
        if($key==='' || !preg_match('/^[a-z0-9][a-z0-9._:-]{1,190}$/', $key)) {
            throw new \InvalidArgumentException('Invalid interface contribution key.');
        }
        if(isset($this->items[$key])) {
            if($this->items[$key] === $contribution) return;
            throw new \DomainException("Duplicate interface contribution key: {$key}");
        }
        $this->items[$key]=$contribution;
    }
    public function all(): array { return array_values($this->items); }
    public function find(string $key): ?InterfaceContribution { return $this->items[$key]??null; }
}
