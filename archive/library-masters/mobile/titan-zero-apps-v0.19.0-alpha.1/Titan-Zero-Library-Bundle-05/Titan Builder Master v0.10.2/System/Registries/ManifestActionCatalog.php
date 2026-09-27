<?php

declare(strict_types=1);

namespace App\Extensions\TitanBuilder\System\Registries;

use App\Extensions\TitanBuilder\System\Contracts\ActionCatalog;
use App\Extensions\TitanBuilder\System\GenerativeUI\BuilderRegistry;

/** Registry-backed intent catalog. It describes authority; it never executes business actions. */
final class ManifestActionCatalog implements ActionCatalog
{
    public function __construct(private readonly BuilderRegistry $registry) {}

    public function all(): array
    {
        $resources = $this->registry->all('actions');
        if ($resources !== []) {
            return array_values(array_filter($resources, static fn (array $item): bool => is_string($item['id'] ?? null)));
        }

        return array_map(static function (string $id): array {
            $local = str_starts_with($id, 'state.') || str_starts_with($id, 'ui.') || in_array($id, ['navigate','open-modal','open-drawer','filter','search','sort','export-preview','builder.edit','builder.preview','builder.theme.update','form.submit-preview'], true);
            return ['id' => $id, 'authority' => 'presentation-only', 'execution' => $local ? 'renderer-intent' : 'external-authorized-gateway'];
        }, $this->registry->actionIds());
    }

    public function find(string $id): ?array
    {
        foreach ($this->all() as $item) {
            if (($item['id'] ?? null) === $id) { return $item; }
        }
        return null;
    }

    public function has(string $id): bool { return $this->find($id) !== null; }
}
