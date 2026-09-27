<?php

declare(strict_types=1);

namespace App\Extensions\TitanBuilder\System\Interaction;

/** Presentation adapter only. It never advances wizard state. */
final class InteractionUiContractNormalizer
{
    private const KEYS = ['interaction_id','wizard_id','step_id','prompt','input_type','options','validation','ui_hint','help_text','progress','actions'];

    public function normalise(array $input): array
    {
        $out = [];
        foreach (self::KEYS as $key) {
            if (array_key_exists($key, $input)) { $out[$key] = $input[$key]; }
        }
        $out['authority'] = 'interaction-engine';
        $out['presentation_owner'] = 'titan-builder';
        return $out;
    }
}
