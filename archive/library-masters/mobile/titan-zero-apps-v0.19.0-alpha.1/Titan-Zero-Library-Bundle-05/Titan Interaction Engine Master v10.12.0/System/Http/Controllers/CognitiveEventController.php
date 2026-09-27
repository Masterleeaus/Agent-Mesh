<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use App\Extensions\InteractionEngine\System\Cognition\Decision\DecisionRecorder;
use App\Extensions\InteractionEngine\System\Cognition\Events\CognitiveEventStoreInterface;
use App\Extensions\InteractionEngine\System\Cognition\Outcome\OutcomeLinker;
use App\Extensions\InteractionEngine\System\Cognition\Outcome\OutcomeRecorder;
use App\Extensions\InteractionEngine\System\Company\CompanyContextResolverContract;

final class CognitiveEventController
{
    public function __construct(
        private readonly CognitiveEventStoreInterface $events,
        private readonly DecisionRecorder $decisions,
        private readonly OutcomeRecorder $outcomes,
        private readonly OutcomeLinker $linker,
        private readonly CompanyContextResolverContract $tenants,
    ) {}

    public function timeline(Request $request, string $correlationId): JsonResponse
    {
        $companyId = $this->companyId($request);
        return response()->json([
            'correlation_id' => $correlationId,
            'events' => array_map(static fn ($event): array => $event->toArray(), $this->events->forCorrelation($companyId, $correlationId)),
        ]);
    }

    public function correction(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'action' => ['required', 'string', 'max:190'],
            'correlation_id' => ['required', 'uuid'],
            'subject_type' => ['nullable', 'string', 'max:128'],
            'subject_id' => ['nullable', 'string', 'max:128'],
            'details' => ['sometimes', 'array'],
        ]);
        $user = $request->user();
        $event = $this->decisions->recordCorrection(
            companyId: $this->companyId($request),
            action: (string) $validated['action'],
            correction: (array) ($validated['details'] ?? []),
            scope: [
                'user_id' => data_get($user, 'id'),
                'device_id' => $request->header('X-Device-ID'),
                'team_id' => data_get($user, 'team_id'),
                'subject_type' => $validated['subject_type'] ?? null,
                'subject_id' => $validated['subject_id'] ?? null,
                'correlation_id' => $validated['correlation_id'],
                'privacy_class' => 'company_private',
            ],
        );
        return response()->json(['event' => $event->toArray()], 201);
    }

    public function outcome(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'correlation_id' => ['required', 'uuid'],
            'action' => ['required', 'string', 'max:190'],
            'success' => ['required', 'boolean'],
            'subject_type' => ['nullable', 'string', 'max:128'],
            'subject_id' => ['nullable', 'string', 'max:128'],
            'metrics' => ['sometimes', 'array'],
            'prediction_event_id' => ['nullable', 'uuid'],
        ]);
        $event = $this->outcomes->recordOutcome(
            companyId: $this->companyId($request),
            outcome: [
                'action' => $validated['action'],
                'success' => $validated['success'],
                'metrics' => $validated['metrics'] ?? [],
            ],
            correlationId: (string) $validated['correlation_id'],
            subjectType: $validated['subject_type'] ?? null,
            subjectId: $validated['subject_id'] ?? null,
            scope: [
                'user_id' => data_get($request->user(), 'id'),
                'device_id' => $request->header('X-Device-ID'),
                'team_id' => data_get($request->user(), 'team_id'),
            ],
        );
        $score = null;
        if (!empty($validated['prediction_event_id'])) {
            $score = $this->linker->linkAndScore($this->companyId($request), (string) $validated['prediction_event_id'], $event->eventId);
        }
        return response()->json([
            'event' => $event->toArray(),
            'score' => $score?->toArray(),
        ], 201);
    }

    private function companyId(Request $request): string
    {
        return $this->tenants->companyId($request->user());
    }
}
