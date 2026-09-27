<?php

declare(strict_types=1);

namespace App\Extensions\TitanBuilder\System\Verticals;

use App\Extensions\TitanBuilder\System\Contracts\VerticalContextProvider;

final class NullVerticalContextProvider implements VerticalContextProvider
{
    public function current(int $companyId): array
    {
        return [
            'vertical_slug' => null,
            'company_id' => $companyId,
            'capabilities' => [],
            'services' => [],
            'feature_flags' => [],
            'authority' => 'unavailable',
        ];
    }
}
