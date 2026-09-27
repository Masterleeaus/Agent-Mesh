<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Extensions\InteractionEngine\System\Offline\SyncEngine;
use App\Extensions\InteractionEngine\System\Offline\OfflineDetector;
use App\Extensions\InteractionEngine\System\Company\CompanyExecutionContext;

final class SyncController
{
    public function __construct(
        private readonly SyncEngine $syncEngine,
        private readonly OfflineDetector $offlineDetector,
        private readonly CompanyExecutionContext $tenantContext,
    ) {}

    public function status(): JsonResponse
    {
        $companyId = $this->tenantContext->companyId();
        return response()->json([
            'status' => $this->offlineDetector->isOffline() ? 'offline' : 'online',
            'company_id' => $companyId,
            'queue' => $this->syncEngine->getStatus($companyId),
        ]);
    }

    public function sync(Request $request): JsonResponse
    {
        if ($this->offlineDetector->isOffline() && !$request->boolean('force')) {
            return response()->json(['error' => 'Device is offline. Use force=true to override.'], 400);
        }

        return response()->json($this->syncEngine->sync($this->tenantContext->companyId()));
    }
}
