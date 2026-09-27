<?php

namespace Modules\QualityControl\Services;

use Modules\QualityControl\Entities\InspectionTemplate;

class TemplateService
{
    public function paginate(int $perPage = 20)
    {
        return InspectionTemplate::query()
            ->orderByDesc('id')
            ->paginate($perPage);
    }

    public function create(array $payload): InspectionTemplate
    {
        return InspectionTemplate::create($payload);
    }

    public function findWithItems(int $id): InspectionTemplate
    {
        return InspectionTemplate::with('items')->findOrFail($id);
    }

    public function update(int $id, array $payload): InspectionTemplate
    {
        $template = InspectionTemplate::findOrFail($id);
        $template->update($payload);

        return $template;
    }

    public function delete(int $id): void
    {
        $template = InspectionTemplate::findOrFail($id);
        $template->delete();
    }
}

