<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Interaction;

final class InteractionRenderMode
{
    public const CHAT = 'chat';
    public const PANEL = 'panel';
    public const FULL_WORKSPACE = 'full-workspace';

    /** @return list<string> */
    public static function all(): array { return [self::CHAT, self::PANEL, self::FULL_WORKSPACE]; }

    public static function normalize(string $mode): string
    {
        $mode = strtolower(trim($mode));
        $mode = match ($mode) {
            'conversational' => self::CHAT,
            'hybrid', 'adaptive-panel' => self::PANEL,
            'structured', 'wizard', 'workspace' => self::FULL_WORKSPACE,
            default => $mode,
        };
        if (! in_array($mode, self::all(), true)) throw new \InvalidArgumentException("Unsupported interaction render mode '{$mode}'.");
        return $mode;
    }
}
