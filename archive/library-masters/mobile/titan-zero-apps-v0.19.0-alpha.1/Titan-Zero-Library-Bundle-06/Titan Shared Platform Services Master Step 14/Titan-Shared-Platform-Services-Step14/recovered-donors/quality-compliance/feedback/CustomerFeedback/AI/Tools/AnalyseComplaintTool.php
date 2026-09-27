<?php

declare(strict_types=1);

namespace Modules\CustomerFeedback\AI\Tools;

use Modules\CustomerFeedback\Services\ComplaintAnalysisService;

final class AnalyseComplaintTool
{
    public function __construct(private readonly ComplaintAnalysisService $analysisService) {}

    /** @param array{subject?:string,title?:string,description?:string} $input */
    public function execute(array $input): array
    {
        return $this->analysisService->analyse(
            (string) ($input['title'] ?? $input['subject'] ?? ''),
            (string) ($input['description'] ?? '')
        );
    }
}
