<?php

declare(strict_types=1);

namespace App\Extensions\TitanBuilder\System\Assets;

use App\Extensions\TitanBuilder\System\Models\BuilderAsset;
use InvalidArgumentException;

/** Validates persisted asset:// references against company and project scope. */
final class AssetReferenceGuard
{
    public function assertSpecReferences(array $spec, int $companyId, int $projectId): void
    {
        $ids = [];
        $this->collect($spec, $ids);
        if ($ids === []) {
            return;
        }
        $ids = array_values(array_unique($ids));
        $found = BuilderAsset::query()
            ->forCompany($companyId)
            ->where('project_id', $projectId)
            ->whereIn('id', $ids)
            ->pluck('id')
            ->map(static fn ($id): int => (int) $id)
            ->all();
        $missing = array_values(array_diff($ids, $found));
        if ($missing !== []) {
            throw new InvalidArgumentException('Spec references assets outside the current company/project: '.implode(', ', $missing));
        }
    }

    private function collect(mixed $value, array &$ids): void
    {
        if (is_string($value) && str_starts_with($value, 'asset://')) {
            if (! preg_match('/^asset:\/\/(\d+)$/', $value, $match)) {
                throw new InvalidArgumentException('Malformed Titan Builder asset reference.');
            }
            $ids[] = (int) $match[1];
            return;
        }
        if (! is_array($value)) {
            return;
        }
        foreach ($value as $child) {
            $this->collect($child, $ids);
        }
    }
}
