<?php

declare(strict_types=1);

namespace App\Extensions\TitanAppsCore\System\Support;

use App\Extensions\TitanAppsCore\System\Contracts\AppRuntimeDependency;

final readonly class AppDependencyDescriptor implements AppRuntimeDependency
{
    /** @param list<string> $contracts */
    public function __construct(
        private string $dependencyId,
        private bool $isRequired,
        private array $contracts,
    ) {}

    public function id(): string { return $this->dependencyId; }
    public function required(): bool { return $this->isRequired; }

    /** @return list<string> */
    public function contractCandidates(): array { return $this->contracts; }

    /** @return array{id:string,required:bool,contracts:list<string>} */
    public function toArray(): array
    {
        return ['id'=>$this->id(),'required'=>$this->required(),'contracts'=>$this->contractCandidates()];
    }
}
