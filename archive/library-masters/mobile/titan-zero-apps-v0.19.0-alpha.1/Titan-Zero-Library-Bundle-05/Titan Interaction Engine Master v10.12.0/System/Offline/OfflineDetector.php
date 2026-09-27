<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Offline;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

class OfflineDetector
{
    private bool $isOffline = false;
    private string $checkUrl;

    public function __construct(string $checkUrl = 'https://www.google.com')
    {
        $this->checkUrl = $checkUrl;
    }

    public function isOffline(): bool
    {
        // Cache the result for a short time to avoid too many checks
        return Cache::remember('interaction.offline', 60, function () {
            try {
                $response = Http::timeout(3)->get($this->checkUrl);
                return !$response->successful();
            } catch (\Throwable $e) {
                return true;
            }
        });
    }

    public function setOffline(bool $offline): void
    {
        Cache::put('interaction.offline', $offline, 60);
    }
}
