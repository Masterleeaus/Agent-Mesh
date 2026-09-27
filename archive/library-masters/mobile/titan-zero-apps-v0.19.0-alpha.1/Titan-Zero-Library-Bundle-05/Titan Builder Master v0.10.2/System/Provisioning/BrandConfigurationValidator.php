<?php

declare(strict_types=1);

namespace App\Extensions\TitanBuilder\System\Provisioning;

use App\Extensions\TitanBuilder\System\Assets\AssetReferenceGuard;
use InvalidArgumentException;

final class BrandConfigurationValidator
{
    private const ALLOWED_KEYS = ['logo','icon','primary_colour','secondary_colour','accent_colour','background_preference','light_dark_preference','typography_token','radius_style','brand_imagery'];

    public function __construct(private readonly AssetReferenceGuard $assets) {}

    public function validate(array $brand, int $companyId, int $projectId): array
    {
        $safe = [];
        foreach ($brand as $key => $value) {
            if (! in_array($key, self::ALLOWED_KEYS, true)) {
                throw new InvalidArgumentException('Unsupported Builder brand field: '.$key);
            }
            if (str_ends_with($key, '_colour') && (! is_string($value) || ! preg_match('/^(#[0-9a-fA-F]{3,8}|var\(--[a-z0-9-]+\))$/', $value))) {
                throw new InvalidArgumentException('Brand colours must be validated hex values or Builder theme tokens.');
            }
            if (is_string($value) && preg_match('/javascript:|<script|expression\s*\(/i', $value)) {
                throw new InvalidArgumentException('Executable brand values are not permitted.');
            }
            $safe[$key] = $value;
        }
        $this->assets->assertSpecReferences($safe, $companyId, $projectId);
        return $safe;
    }
}
