<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Http\Controllers;

use App\Extensions\InteractionEngine\System\Registry\InteractionRegistry;
use App\Extensions\InteractionEngine\System\Runtime\InteractionRuntime;
use App\Extensions\InteractionEngine\System\Company\CompanyContextResolverContract;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\View\View;

final class InteractionController
{
    public function __construct(
        private readonly InteractionRuntime $runtime,
        private readonly InteractionRegistry $registry,
        private readonly CompanyContextResolverContract $tenants,
    ) {}

    public function show(Request $request, string $interactionId): View
    {
        $definition = $this->registry->get($interactionId);
        if ($definition === null) {
            abort(404, "Interaction '{$interactionId}' not found.");
        }

        $user = $request->user();
        $userId = (int) data_get($user, 'id');
        if ($userId <= 0) {
            abort(401, 'An authenticated actor is required.');
        }
        $companyId = $this->tenants->companyId($user);

        $state = $this->runtime->start($interactionId, $userId, $companyId);
        $view = $this->runtime->getCurrentViewForActor((int) $state['id'], $companyId, $userId);

        return view('interaction-engine::wrapper', [
            'content' => $view,
            'runId' => $state['id'],
        ]);
    }

    public function process(Request $request, int $runId): JsonResponse
    {
        $user = $request->user();
        $userId = (int) data_get($user, 'id');
        if ($userId <= 0) {
            abort(401, 'An authenticated actor is required.');
        }
        $companyId = $this->tenants->companyId($user);

        try {
            $state = $this->runtime->loadForActor($runId, $companyId, $userId);
        } catch (\RuntimeException) {
            // Do not disclose whether a run exists for another tenant or actor.
            abort(404, 'Interaction run not found.');
        }

        $data = $request->validate([
            'answers' => 'array',
            'action' => 'string|in:next,back,submit',
        ]);

        $result = $this->runtime->process($state, $data);

        if (isset($result['errors'])) {
            return response()->json(['errors' => $result['errors']], 422);
        }

        if (($result['complete'] ?? false) === true) {
            return response()->json([
                'complete' => true,
                'message' => 'Interaction completed successfully.',
            ]);
        }

        return response()->json([
            'state' => $result['state'],
            'nextView' => $this->runtime->getCurrentViewForActor($runId, $companyId, $userId),
        ]);
    }
}
