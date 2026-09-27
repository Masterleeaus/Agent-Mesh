<?php

declare(strict_types=1);

namespace App\Extensions\TitanBuilder\System\Preview;

use App\Extensions\TitanBuilder\System\Contracts\PreviewRenderer;
use App\Extensions\TitanBuilder\System\Contracts\SurfaceRegistry;
use App\Extensions\TitanBuilder\System\Contracts\ThemeRegistry;
use App\Extensions\TitanBuilder\System\GenerativeUI\BuilderRegistry;
use App\Extensions\TitanBuilder\System\GenerativeUI\GenerativeUiSpecValidator;
use InvalidArgumentException;

final class ValidatedPreviewRenderer implements PreviewRenderer
{
    private const DEVICES = ['mobile', 'tablet', 'desktop'];
    private const NETWORK = ['online', 'offline', 'syncing', 'conflict', 'empty', 'populated', 'loading', 'error', 'permission-denied'];

    public function __construct(
        private readonly GenerativeUiSpecValidator $validator,
        private readonly SurfaceRegistry $surfaces,
        private readonly ThemeRegistry $themes,
        private readonly BuilderRegistry $resources,
    ) {}

    public function render(array $spec, array $context = []): array
    {
        $validation = $this->validator->validate($spec);
        if (! $validation['valid']) {
            throw new InvalidArgumentException('Preview spec failed validation: '.json_encode($validation['issues'], JSON_UNESCAPED_SLASHES));
        }

        $surfaceId = is_string($context['product_surface'] ?? null) ? $context['product_surface'] : 'owner';
        $surface = $this->surfaces->find($surfaceId);
        if ($surface === null) {
            throw new InvalidArgumentException('Unknown Titan Builder product surface.');
        }
        $device = is_string($context['device'] ?? null) && in_array($context['device'], self::DEVICES, true) ? $context['device'] : 'mobile';
        $network = is_string($context['network'] ?? null) && in_array($context['network'], self::NETWORK, true) ? $context['network'] : 'online';
        $themeId = is_string($context['theme'] ?? null) ? $context['theme'] : 'titan-light';
        $theme = $this->themes->find($themeId) ?? $this->themes->find('titan-light');
        $mockData = [];
        if (is_string($context['mock_data'] ?? null)) {
            $mockData = $this->resources->mockData($context['mock_data']);
        }

        return [
            'type' => 'titan-builder-preview',
            'authority' => 'presentation-only',
            'validated' => true,
            'device' => $device,
            'network' => $network,
            'surface' => $surface,
            'theme' => $theme,
            'mock_data' => $mockData,
            'spec' => $validation['spec'],
            'issues' => array_values(array_filter($validation['issues'], static fn (array $issue): bool => $issue['severity'] === 'warning')),
        ];
    }
}
