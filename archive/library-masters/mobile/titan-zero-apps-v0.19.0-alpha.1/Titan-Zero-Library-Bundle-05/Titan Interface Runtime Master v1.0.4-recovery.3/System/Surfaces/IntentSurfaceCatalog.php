<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Surfaces;

final class IntentSurfaceCatalog
{
    /** @var list<string> */
    private const ORDER = ['home', 'ask', 'work', 'do', 'decide', 'explore', 'insights', 'data'];

    /** @var array<string,string> */
    private const LABELS = [
        'home' => 'Home',
        'ask' => 'Ask',
        'work' => 'Work',
        'do' => 'Do',
        'decide' => 'Decide',
        'explore' => 'Explore',
        'insights' => 'Insights',
        'data' => 'Data',
    ];

    /** @return list<string> */
    public static function keys(): array
    {
        return self::ORDER;
    }

    public static function contains(string $key): bool
    {
        return isset(self::LABELS[$key]);
    }

    public static function label(string $key): string
    {
        if (! isset(self::LABELS[$key])) {
            throw new \InvalidArgumentException("Unknown intent surface '{$key}'.");
        }

        return self::LABELS[$key];
    }

    /** @param list<string> $surfaces @return list<string> */
    public static function normalize(array $surfaces): array
    {
        $requested = [];
        foreach ($surfaces as $surface) {
            if (! is_string($surface) || ! self::contains($surface)) {
                $value = is_scalar($surface) ? (string) $surface : gettype($surface);
                throw new \InvalidArgumentException("Unsupported intent surface '{$value}'.");
            }
            $requested[$surface] = true;
        }

        return array_values(array_filter(self::ORDER, static fn (string $surface): bool => isset($requested[$surface])));
    }
}
