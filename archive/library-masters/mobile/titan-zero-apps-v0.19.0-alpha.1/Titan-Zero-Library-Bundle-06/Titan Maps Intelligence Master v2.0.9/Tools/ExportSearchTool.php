<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Tools;

use App\Extensions\TitanMapsIntelligence\Contracts\AuthorisedCompanyContext;
use App\Extensions\TitanMapsIntelligence\Contracts\PermissionAuthorizer;
use App\Extensions\TitanMapsIntelligence\Services\CandidateExportService;

final class ExportSearchTool
{
    public function __construct(
        private readonly AuthorisedCompanyContext $context,
        private readonly PermissionAuthorizer $authorizer,
        private readonly CandidateExportService $exports,
    ) {}

    public function execute(array $input): array
    {
        $companyId = $this->context->companyId();
        $this->authorizer->authorize($this->context->userId(), $companyId, 'titan-maps-intelligence.search.export', [
            'search_id' => $input['search_id'] ?? null,
            'format' => $input['format'] ?? null,
        ]);

        return ['ok' => true, 'data' => $this->exports->export(
            (string) ($input['search_id'] ?? ''),
            (string) ($input['format'] ?? ''),
            [
                'candidate_status' => $input['candidate_status'] ?? null,
                'conversation_id' => $input['conversation_id'] ?? null,
                'agent_id' => $input['agent_id'] ?? null,
            ],
        )];
    }
}
