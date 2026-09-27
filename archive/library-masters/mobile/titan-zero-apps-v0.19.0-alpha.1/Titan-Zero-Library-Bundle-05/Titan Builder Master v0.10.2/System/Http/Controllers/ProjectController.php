<?php

declare(strict_types=1);

namespace App\Extensions\TitanBuilder\System\Http\Controllers;

use App\Extensions\TitanBuilder\System\Http\Requests\ProjectStoreRequest;
use App\Extensions\TitanBuilder\System\Models\BuilderProject;
use App\Extensions\TitanBuilder\System\Security\BuilderAuthorization;
use App\Extensions\TitanBuilder\System\Security\CompanyContext;
use Illuminate\Http\JsonResponse;

final class ProjectController
{
    public function __construct(
        private readonly CompanyContext $company,
        private readonly BuilderAuthorization $authorization,
    ) {}

    public function store(ProjectStoreRequest $request): JsonResponse
    {
        $this->authorization->require('builder.edit');
        $data = $request->validated();
        $project = BuilderProject::query()->create([
            'company_id' => $this->company->id(),
            'name' => $data['name'],
            'slug' => $data['slug'],
            'surface' => $data['surface'],
            'meta' => $data['meta'] ?? [],
        ]);
        return response()->json(['project' => $project], 201);
    }
}
