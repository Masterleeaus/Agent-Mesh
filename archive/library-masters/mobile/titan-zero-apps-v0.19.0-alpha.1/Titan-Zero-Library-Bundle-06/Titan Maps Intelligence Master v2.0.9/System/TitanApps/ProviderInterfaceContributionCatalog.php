<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\System\TitanApps;

use RuntimeException;

/**
 * Provider-owned semantic contribution catalogue for Titan Apps.
 * This is an integration adapter only: composition/rendering remains owned by Titan Apps Interface Runtime.
 */
final class ProviderInterfaceContributionCatalog
{
    private ?array $cache = null;

    /** @return array<string,mixed> */
    public function all(): array
    {
        if ($this->cache !== null) return $this->cache;
        $path = dirname(__DIR__, 2).'/resources/titan-apps/interface-contributions.json';
        $raw = @file_get_contents($path);
        if ($raw === false) throw new RuntimeException('Titan Apps contribution metadata is unavailable.');
        $data = json_decode($raw, true, 512, JSON_THROW_ON_ERROR);
        if (!is_array($data) || !isset($data['contributions']) || !is_array($data['contributions']))
            throw new RuntimeException('Titan Apps contribution metadata is invalid.');
        foreach ($data['contributions'] as $row) $this->assertSemanticOnly((array)$row);
        return $this->cache = $data;
    }

    /** @return array<int,array<string,mixed>> */
    public function forSurface(string $surface): array
    {
        if (!in_array($surface, ['zero','go','hub'], true)) return [];
        return array_values(array_filter($this->all()['contributions'], static fn(array $row): bool => in_array($surface, (array)($row['supported_surfaces'] ?? []), true)));
    }

    /** @param array<string,mixed> $row */
    private function assertSemanticOnly(array $row): void
    {
        foreach (['javascript','script','component_source','executable_ui','html'] as $forbidden)
            if (array_key_exists($forbidden, $row)) throw new RuntimeException('Executable presentation metadata is forbidden: '.$forbidden);
        foreach ((array)($row['supported_surfaces'] ?? []) as $surface)
            if (!in_array($surface, ['zero','go','hub'], true)) throw new RuntimeException('Non-canonical Titan Apps surface: '.(string)$surface);
    }
}
