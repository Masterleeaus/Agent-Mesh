<?php

namespace Modules\QualityControl\Domain\Quality\Actions;

use Modules\QualityControl\Domain\Quality\DTOs\InspectionTemplateData;
use Modules\QualityControl\Entities\InspectionTemplate;
use Modules\QualityControl\Services\TemplateService;

final class UpdateInspectionTemplateAction
{
    public function __construct(private readonly TemplateService $templates)
    {
    }

    public function handle(int $templateId, InspectionTemplateData $data): InspectionTemplate
    {
        return $this->templates->update($templateId, $data->toArray());
    }
}
