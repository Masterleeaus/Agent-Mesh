<?php

declare(strict_types=1);

namespace Modules\CustomerFeedback\AI\Tools;

use Modules\CustomerFeedback\Services\ComplaintAnalysisService;

final class DraftResolutionResponseTool
{
    public function __construct(private readonly ComplaintAnalysisService $analysisService) {}

    /** @param array{subject?:string,title?:string,resolution_suggestion?:string,tone?:string} $input */
    public function execute(array $input): array
    {
        return $this->analysisService->draftResponse(
            (string) ($input['title'] ?? $input['subject'] ?? ''),
            (string) ($input['resolution_suggestion'] ?? 'We will review the facts and follow up with the next authorised resolution step.'),
            (string) ($input['tone'] ?? 'empathetic'),
        );
    }
}
