<?php

declare(strict_types=1);

namespace App\Extensions\TitanMcp\System\Integration\TitanApps;

/**
 * Provider-owned semantic contributions for the public Titan Apps boundary.
 *
 * This adapter intentionally contains no Interface Runtime, Interaction Engine or Builder
 * implementation and grants no execution authority. Actions remain capability intents.
 */
final class TitanAppsContributionProvider
{
    public const OWNER_EXTENSION = 'titan-mcp';
    public const REGISTRY_KEY = 'titan-apps.interface-contributions.' . self::OWNER_EXTENSION;

    /** @return array<int,array<string,mixed>> */
    public function contributions(): array
    {
        return [];
    }

    /** @return array<string,mixed> */
    public function contractDescriptor(): array
    {
        return [
            'owner_extension' => self::OWNER_EXTENSION,
            'supported_surfaces' => $this->supportedSurfaces(),
            'canonical_app_boundary' => ['zero', 'go', 'hub'],
            'canonical_surfaces_only' => true,
            'interface_runtime' => 'public_contract_only',
            'interaction_engine' => 'public_contract_only',
            'builder' => 'contribution_registration_only',
            'package_location_independent' => true,
            'authority' => 'none',
        ];
    }
    /** @return array<int,string> */
    private function supportedSurfaces(): array
    {
        $surfaces = [];
        foreach ($this->contributions() as $contribution) {
            foreach (($contribution['supported_surfaces'] ?? []) as $surface) {
                if (is_string($surface) && ! in_array($surface, $surfaces, true)) {
                    $surfaces[] = $surface;
                }
            }
        }

        return $surfaces;
    }

}
