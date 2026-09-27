<?php

declare(strict_types=1);

namespace App\Extensions\TitanBuilder\System\Support;

use JsonException;

final class CanonicalJson
{
    /** @throws JsonException */
    public static function encode(array $value): string
    {
        $normalised = self::normalise($value);
        return json_encode($normalised, JSON_THROW_ON_ERROR | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    }

    public static function checksum(array $value): string
    {
        return hash('sha256', self::encode($value));
    }

    private static function normalise(mixed $value): mixed
    {
        if (! is_array($value)) {
            return $value;
        }
        if (array_is_list($value)) {
            return array_map([self::class, 'normalise'], $value);
        }
        ksort($value);
        foreach ($value as $key => $child) {
            $value[$key] = self::normalise($child);
        }
        return $value;
    }
}
