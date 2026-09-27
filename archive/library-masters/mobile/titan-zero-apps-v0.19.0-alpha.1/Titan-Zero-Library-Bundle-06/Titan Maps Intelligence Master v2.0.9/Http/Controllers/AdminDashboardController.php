<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Http\Controllers;

use Illuminate\Contracts\View\View;

final class AdminDashboardController
{
    public function __invoke(): View
    {
        return view('titan-maps-intelligence::admin.index');
    }
}
