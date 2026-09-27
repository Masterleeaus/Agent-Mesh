<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence;

/**
 * Backward-compatible alias for pre-v2 host maps that referenced the root provider.
 * New installations must register System\TitanMapsIntelligenceServiceProvider.
 */
if (! class_exists(__NAMESPACE__.'\\TitanMapsIntelligenceServiceProvider', false)) {
    class_alias(
        \App\Extensions\TitanMapsIntelligence\System\TitanMapsIntelligenceServiceProvider::class,
        __NAMESPACE__.'\\TitanMapsIntelligenceServiceProvider',
    );
}
