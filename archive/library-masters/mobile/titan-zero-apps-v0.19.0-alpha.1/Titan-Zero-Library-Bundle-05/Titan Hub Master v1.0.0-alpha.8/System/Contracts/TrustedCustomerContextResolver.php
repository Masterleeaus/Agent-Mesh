<?php

declare(strict_types=1);
namespace App\Extensions\TitanHub\System\Contracts;

use Illuminate\Http\Request;

interface TrustedCustomerContextResolver
{
    /** Trusted server-side context only. Never treats browser company_id as authority. */
    public function resolve(Request $request, string $portal): array;
}
