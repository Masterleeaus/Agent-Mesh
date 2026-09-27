<?php

namespace Modules\QualityControl\Domain\Quality\Actions;

use Modules\QualityControl\Domain\Quality\DTOs\InspectionTemplateData;
use Modules\QualityControl\Entities\InspectionTemplate;
use Modules\QualityControl\Services\TemplateService;

final class CreateInspectionTemplateAction
{
    public function __construct(private readonly TemplateService $templates)
    {
    }

    public function handle(InspectionTemplateData $data): InspectionTemplate
    {
        return $this->templates->create($data->toArray());
    }
}
