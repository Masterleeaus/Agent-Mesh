<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Http\Controllers;

use App\Extensions\TitanMapsIntelligence\Contracts\AuthorisedCompanyContext;
use Illuminate\Contracts\View\View;

final class UserDashboardController
{
    public function __invoke(AuthorisedCompanyContext $context): View
    {
        return view('titan-maps-intelligence::user.index', [
            'companyId' => $context->companyId(),
        ]);
    }
}
