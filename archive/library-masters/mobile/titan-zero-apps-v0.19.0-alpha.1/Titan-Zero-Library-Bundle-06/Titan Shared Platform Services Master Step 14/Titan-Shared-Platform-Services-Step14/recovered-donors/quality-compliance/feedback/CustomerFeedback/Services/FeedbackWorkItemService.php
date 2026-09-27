<?php

declare(strict_types=1);

namespace Modules\CustomerFeedback\Services;

use Modules\CustomerFeedback\Entities\FeedbackTicket;
use Modules\TitanZeroAssurance\Contracts\WorkItemDispatcher;
use Modules\TitanZeroAssurance\Services\AuthorityPolicy;
use Modules\TitanZeroAssurance\Services\GovernedWorkItemRouter;
use Modules\TitanZeroAssurance\Support\Identifier;
use Modules\TitanZeroAssurance\ValueObjects\WorkItemRequest;

final class FeedbackWorkItemService
{
    /**
     * @param list<string> $grantedCapabilities
     * @param array<string,mixed> $payload
     * @return array<string,mixed>
     */
    public function requestCorrectiveWork(
        FeedbackTicket $ticket,
        array $grantedCapabilities = [],
        array $payload = [],
        string $action = 'corrective_action',
        string $risk = 'medium',
    ): array {
        if ((int) $ticket->company_id <= 0 || !$ticket->id) {
            throw new \InvalidArgumentException('A persisted, company-scoped feedback ticket is required.');
        }

        $required = ['edit_feedback'];
        $request = new WorkItemRequest(
            requestId: Identifier::uuidV4(),
            companyId: (int) $ticket->company_id,
            workType: 'customer_resolution',
            action: $action,
            risk: $risk,
            requiredCapabilities: $required,
            payload: array_merge([
                'feedback_ticket_id' => (int) $ticket->id,
                'feedback_type' => (string) $ticket->feedback_type,
                'priority' => (string) $ticket->priority,
                'quality_control_id' => $ticket->quality_control_id ?? null,
                'job_id' => $ticket->job_id ?? null,
            ], $payload),
            correlationId: null,
            idempotencyKey: 'feedback:' . $ticket->company_id . ':' . $ticket->id . ':' . $action,
        );

        if (!function_exists('app') || !class_exists(AuthorityPolicy::class)) {
            return ['status' => 'assurance_unavailable', 'request' => $request->toArray(), 'work_item_id' => null];
        }

        $authority = app(AuthorityPolicy::class);
        $decision = $authority->evaluate($risk, $required, $grantedCapabilities);
        if (!$decision->mayExecute()) {
            return ['status' => $decision->status, 'decision' => $decision->toArray(), 'request' => $request->toArray(), 'work_item_id' => null];
        }

        if (!app()->bound(WorkItemDispatcher::class)) {
            return ['status' => 'dispatcher_unavailable', 'decision' => $decision->toArray(), 'request' => $request->toArray(), 'work_item_id' => null];
        }

        $router = new GovernedWorkItemRouter($authority, app(WorkItemDispatcher::class));
        $result = $router->route($request, $grantedCapabilities);

        return [
            'status' => $result['decision']->status,
            'decision' => $result['decision']->toArray(),
            'request' => $request->toArray(),
            'work_item_id' => $result['work_item_id'],
        ];
    }
}
