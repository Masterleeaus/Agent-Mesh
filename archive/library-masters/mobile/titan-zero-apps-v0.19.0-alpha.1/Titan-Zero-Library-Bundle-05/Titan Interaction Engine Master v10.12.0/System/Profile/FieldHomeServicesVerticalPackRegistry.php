<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Profile;

final class FieldHomeServicesVerticalPackRegistry
{
    /** @var array<string,array<string,mixed>> */
    private array $packs = [];

    public function __construct(?string $path = null)
    {
        $path ??= dirname(__DIR__, 2) . '/resources/verticals/field-home-services';
        foreach (glob(rtrim($path, '/') . '/*.json') ?: [] as $file) {
            $data = json_decode((string) file_get_contents($file), true, 512, JSON_THROW_ON_ERROR);
            $slug = (string) ($data['slug'] ?? '');
            if ($slug === '' || !in_array($slug, FieldHomeServicesProfile::VERTICALS, true)) {
                throw new \RuntimeException('Invalid or noncanonical Field/Home Services vertical pack: ' . basename($file));
            }
            $this->packs[$slug] = $data;
        }
        foreach (FieldHomeServicesProfile::VERTICALS as $slug) {
            if (!isset($this->packs[$slug])) throw new \RuntimeException("Missing canonical vertical pack: {$slug}");
        }
        ksort($this->packs);
    }

    /** @return array<string,array<string,mixed>> */
    public function all(): array { return $this->packs; }

    /** @return array<string,mixed> */
    public function get(string $slug): array
    {
        if (!isset($this->packs[$slug])) throw new \RuntimeException("Unknown vertical pack: {$slug}");
        return $this->packs[$slug];
    }
}
