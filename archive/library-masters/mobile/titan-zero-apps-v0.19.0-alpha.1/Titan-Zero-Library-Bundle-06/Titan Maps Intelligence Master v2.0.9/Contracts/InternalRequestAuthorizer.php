<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Contracts;

use Illuminate\Http\Request;

interface InternalRequestAuthorizer
{
    public function authorize(Request $request): void;
}
