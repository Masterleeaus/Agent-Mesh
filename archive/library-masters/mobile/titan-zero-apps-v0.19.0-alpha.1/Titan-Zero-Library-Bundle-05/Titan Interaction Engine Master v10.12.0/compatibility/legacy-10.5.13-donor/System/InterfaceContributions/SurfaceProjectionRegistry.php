<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\InterfaceContributions;

/**
 * Registered, default-deny presentation projections for Titan Apps surfaces.
 *
 * Projection definitions contain presentation-safe semantic fields only. Raw
 * provider/runtime payloads are never passed through by default.
 */
final class SurfaceProjectionRegistry
{
    /** @var array<string,array<string,array{projection_id:string,fields:list<string>}>> */
    private const REGISTRY = [
        'workforce' => [
            'zero' => [
                'projection_id' => 'workforce.zero.v1',
                'fields' => ['summary','workforce_plan','proposal','missing_information','recommended_next_state','handoff','status','result'],
            ],
            'go' => [
                'projection_id' => 'workforce.go.v1',
                'fields' => ['summary','proposal','recommended_next_state','status','result'],
            ],
            'hub' => [
                'projection_id' => 'workforce.hub.v1',
                'fields' => ['summary','status','result'],
            ],
        ],
    ];

    /** @param array<string,mixed> $data @return array{projection_id:string,source:string,surface:string,data:array<string,mixed>,default_deny:bool} */
    public function project(string $source, string $surface, array $data): array
    {
        $source = strtolower(trim($source));
        $surface = strtolower(trim($surface));
        $definition = self::REGISTRY[$source][$surface] ?? null;
        if ($definition === null) {
            return [
                'projection_id' => 'unregistered.deny.v1',
                'source' => $source,
                'surface' => $surface,
                'data' => [],
                'default_deny' => true,
            ];
        }

        $projected = [];
        foreach ($definition['fields'] as $field) {
            if (array_key_exists($field, $data)) {
                $projected[$field] = $data[$field];
            }
        }

        return [
            'projection_id' => $definition['projection_id'],
            'source' => $source,
            'surface' => $surface,
            'data' => $projected,
            'default_deny' => false,
        ];
    }
}
