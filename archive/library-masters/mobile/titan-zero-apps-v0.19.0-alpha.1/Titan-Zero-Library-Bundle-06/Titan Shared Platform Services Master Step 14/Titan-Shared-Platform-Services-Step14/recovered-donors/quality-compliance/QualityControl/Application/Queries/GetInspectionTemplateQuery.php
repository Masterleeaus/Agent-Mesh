<?php

namespace Modules\QualityControl\Application\Queries;

use Modules\QualityControl\Entities\InspectionTemplate;

final class GetInspectionTemplateQuery
{
    public function handle(int $templateId): InspectionTemplate
    {
        return InspectionTemplate::with('items')->findOrFail($templateId);
    }
}
