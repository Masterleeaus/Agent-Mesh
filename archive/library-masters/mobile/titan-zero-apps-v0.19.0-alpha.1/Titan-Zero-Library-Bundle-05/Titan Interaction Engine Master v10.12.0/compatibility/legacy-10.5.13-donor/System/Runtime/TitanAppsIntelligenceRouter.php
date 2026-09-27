<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Runtime;

use App\Extensions\InteractionEngine\System\Contracts\TitanAppsIntelligenceRoutingContract;
use InvalidArgumentException;

final class TitanAppsIntelligenceRouter implements TitanAppsIntelligenceRoutingContract
{
    /** @param array<string,mixed> $request @param array<string,bool> $available @return array<string,mixed> */
    public function select(array $request, array $available): array
    {
        $companyId = trim((string)($request['company_id'] ?? ''));
        if ($companyId === '') {
            throw new InvalidArgumentException('Intelligence routing requires canonical company_id.');
        }
        foreach (['tenant_id','tenant_company_id','tenantId'] as $legacy) {
            if (array_key_exists($legacy, $request) && trim((string)$request[$legacy]) !== '' && trim((string)$request[$legacy]) !== $companyId) {
                throw new InvalidArgumentException('Legacy tenant identifier conflicts with canonical company_id.');
            }
        }

        $privacy = (string)($request['privacy'] ?? 'private_preferred');
        $confidence = (float)($request['confidence'] ?? 0.0);
        $consequence = (string)($request['consequence'] ?? 'medium');
        $high = $consequence === 'high';
        $local = ['deterministic','browser_ai','device_ai','native_ai'];
        $external = ['customer_ai','byo_cloud','titan_private_ai','model_council'];
        $order = ['deterministic','browser_ai','device_ai','native_ai','customer_ai','byo_cloud','titan_private_ai','model_council'];
        $route = 'unavailable';
        $reason = 'no_eligible_runtime';

        if ($high && $confidence < 0.4 && ($available['model_council'] ?? false) && $privacy !== 'local_only') {
            $route = 'model_council';
            $reason = 'high_consequence_low_confidence';
        } else {
            foreach ($order as $candidate) {
                if (!($available[$candidate] ?? false)) continue;
                if ($privacy === 'local_only' && in_array($candidate, $external, true)) continue;
                $route = $candidate;
                $reason = 'lowest_cost_private_capable_route';
                break;
            }
        }

        return [
            'schema' => 'titan.apps.intelligence-route.v1',
            'company_id' => $companyId,
            'route' => $route,
            'reason' => $reason,
            'task' => (string)($request['task'] ?? 'unknown'),
            'confidence' => $confidence,
            'consequence' => $consequence,
            'privacy_policy' => $privacy,
            'execution_class' => in_array($route, $local, true) ? 'local' : (in_array($route, $external, true) ? 'external' : 'none'),
            'external_inference' => in_array($route, $external, true),
            'grants_authority' => false,
            'executes_mutations' => false,
            'model_council_is_escalation' => $route === 'model_council',
        ];
    }
}
