<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Http\Controllers;

use App\Extensions\TitanMapsIntelligence\Models\MapProviderConnection;
use App\Extensions\TitanMapsIntelligence\Models\MapsUsageRecord;
use Illuminate\Contracts\View\View;
use Illuminate\Http\Request;

final class AdminNavigationController
{
    public function __invoke(Request $request): View
    {
        $page = (string) $request->route('maps_admin_page', 'overview');
        $title = match ($page) {
            'providers' => 'Provider Health',
            'usage' => 'API Usage',
            'diagnostics' => 'Diagnostics',
            default => 'Titan Maps Intelligence',
        };

        return view('titan-maps-intelligence::admin.navigation', [
            'page' => $page,
            'title' => $title,
            'providerCount' => MapProviderConnection::query()->count(),
            'enabledProviderCount' => MapProviderConnection::query()->where('enabled', true)->count(),
            'usageCount' => MapsUsageRecord::query()->count(),
            'providers' => $page === 'providers' ? MapProviderConnection::query()->latest('updated_at')->limit(50)->get() : collect(),
            'usage' => $page === 'usage' ? MapsUsageRecord::query()->latest('recorded_at')->limit(50)->get() : collect(),
        ]);
    }
}
