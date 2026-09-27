<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Tools;

use App\Extensions\TitanMapsIntelligence\Contracts\AuthorisedCompanyContext;
use App\Extensions\TitanMapsIntelligence\Contracts\PermissionAuthorizer;
use App\Extensions\TitanMapsIntelligence\Services\CandidateMatchWorkflow;

final class MatchCandidateTool
{
    public function __construct(private readonly AuthorisedCompanyContext $context, private readonly PermissionAuthorizer $authorizer, private readonly CandidateMatchWorkflow $workflow) {}
    public function execute(array $input): array
    {
        $this->authorizer->authorize($this->context->userId(), $this->context->companyId(), 'titan-maps-intelligence.candidate.read');
        return ['ok' => true, 'data' => $this->workflow->match((string) ($input['candidate_id'] ?? ''), (string) ($input['workcore_entity_type'] ?? ''), (string) ($input['workcore_entity_id'] ?? ''), ['agent_id' => $input['agent_id'] ?? null, 'conversation_id' => $input['conversation_id'] ?? null])];
    }
}
