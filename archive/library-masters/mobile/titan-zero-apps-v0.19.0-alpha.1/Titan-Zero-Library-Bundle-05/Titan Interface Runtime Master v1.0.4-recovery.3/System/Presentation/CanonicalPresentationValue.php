<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Presentation;

final class CanonicalPresentationValue
{
    public static function normalize(mixed $value): mixed
    {
        if (! is_array($value)) return $value;
        if (array_is_list($value)) return array_map([self::class, 'normalize'], $value);

        $out = [];
        foreach ($value as $key => $item) $out[(string) $key] = self::normalize($item);
        ksort($out, SORT_STRING);
        return $out;
    }

    public static function json(mixed $value): string
    {
        return (string) json_encode(self::normalize($value), JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
    }
}
