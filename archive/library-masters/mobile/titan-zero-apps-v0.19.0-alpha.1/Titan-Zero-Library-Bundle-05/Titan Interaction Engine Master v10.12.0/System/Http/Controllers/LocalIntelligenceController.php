<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use App\Extensions\InteractionEngine\System\LocalIntelligence\LocalBrain;
use App\Extensions\InteractionEngine\System\Company\CompanyContextResolverContract;
use App\Extensions\InteractionEngine\System\Settings\SettingsResolver;

final class LocalIntelligenceController
{
    public function __construct(
        private readonly LocalBrain $brain,
        private readonly CompanyContextResolverContract $tenants,
        private readonly SettingsResolver $settings,
    ) {}

    public function process(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'message' => ['required', 'string', 'max:5000'],
            'context' => ['sometimes', 'array'],
        ]);
        $user = $request->user();
        $trustedTenant = $this->tenants->companyId($user);
        if (!$this->settings->companyBool($trustedTenant, 'local_intelligence_enabled', (bool) config('interaction-engine.local_intelligence.enabled', true))) {
            return response()->json(['message' => 'LocalBrain is disabled for this company.'], 409);
        }
        $context = array_replace((array) ($validated['context'] ?? []), [
            'user_id' => data_get($user, 'id'),
            'company_id' => $trustedTenant,
            'company_id' => $trustedTenant, // compatibility alias only
            'device_id' => $request->header('X-Device-ID'),
            'minimum_confidence' => $this->settings->platformFloat('local_minimum_confidence', (float) config('interaction-engine.local_intelligence.minimum_confidence', 0.65)),
        ]);

        return response()->json($this->brain->process((string) $validated['message'], $context));
    }
}
