<?php

declare(strict_types=1);

namespace Modules\TitanZeroAssurance\Services;

use Modules\TitanZeroAssurance\Contracts\WorkItemDispatcher;
use Modules\TitanZeroAssurance\ValueObjects\AuthorityDecision;
use Modules\TitanZeroAssurance\ValueObjects\WorkItemRequest;

final class GovernedWorkItemRouter
{
    public function __construct(
        private readonly AuthorityPolicy $authority,
        private readonly WorkItemDispatcher $dispatcher,
    ) {
    }

    /**
     * @param list<string> $grantedCapabilities
     * @return array{decision: AuthorityDecision, work_item_id: ?string}
     */
    public function route(WorkItemRequest $request, array $grantedCapabilities): array
    {
        $decision = $this->authority->evaluate(
            $request->risk,
            $request->requiredCapabilities,
            $grantedCapabilities,
        );

        if (!$decision->mayExecute()) {
            return ['decision' => $decision, 'work_item_id' => null];
        }

        return [
            'decision' => $decision,
            'work_item_id' => $this->dispatcher->dispatch($request),
        ];
    }
}
