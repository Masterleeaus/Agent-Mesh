<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Engines\Memory\Implementations;

use App\Extensions\InteractionEngine\System\Engines\Memory\Contracts\ProceduralMemoryEngineInterface;
use App\Extensions\InteractionEngine\System\Company\CompanyExecutionContext;
use Illuminate\Support\Facades\Cache;

class ProceduralMemoryEngine implements ProceduralMemoryEngineInterface
{
    private array $skills = [];

    public function __construct(private readonly CompanyExecutionContext $tenantContext)
    {
        $this->loadSkills();
    }

    public function store(array $skill): void
    {
        $this->skills[$skill['name']] = $skill;
        $this->saveSkills();
    }

    public function recall(array $query): array
    {
        $results = [];
        foreach ($this->skills as $skill) {
            if (str_contains($skill['name'], $query['keyword'] ?? '')) {
                $results[] = $skill;
            }
        }
        return $results;
    }

    public function getSkill(string $name): ?array
    {
        return $this->skills[$name] ?? null;
    }

    public function listSkills(): array
    {
        return array_keys($this->skills);
    }

    public function consolidate(): void
    {
        $this->saveSkills();
    }

    private function loadSkills(): void
    {
        $this->skills = Cache::get($this->tenantContext->cacheKey('procedural_memory'), []);
    }

    private function saveSkills(): void
    {
        Cache::put($this->tenantContext->cacheKey('procedural_memory'), $this->skills, 86400 * 30);
    }
}
