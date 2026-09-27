<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Presentation;

final readonly class ResponsiveHints implements \JsonSerializable
{
    private const MODES = ['auto', 'required', 'fixed'];

    /** @param array<string,int> $breakpoints */
    public function __construct(public string $mode = 'auto', public array $breakpoints = [])
    {
        if (! in_array($mode, self::MODES, true)) throw new \InvalidArgumentException('responsive mode is unsupported.');
        foreach ($breakpoints as $name => $pixels) {
            if (preg_match('/^[a-z][a-z0-9_-]*$/', (string) $name) !== 1 || ! is_int($pixels) || $pixels < 240 || $pixels > 4096) {
                throw new \InvalidArgumentException('responsive breakpoint is invalid.');
            }
        }
    }

    public static function auto(): self { return new self('auto'); }
    public static function required(): self { return new self('required'); }

    public function requiresResponsiveComponent(): bool { return $this->mode === 'required'; }

    public function jsonSerialize(): array
    {
        return CanonicalPresentationValue::normalize(['mode' => $this->mode, 'breakpoints' => $this->breakpoints]);
    }
}
