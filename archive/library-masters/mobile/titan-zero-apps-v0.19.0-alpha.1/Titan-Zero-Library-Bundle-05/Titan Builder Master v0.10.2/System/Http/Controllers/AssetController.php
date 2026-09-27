<?php

declare(strict_types=1);

namespace App\Extensions\TitanBuilder\System\Http\Controllers;

use App\Extensions\TitanBuilder\System\Assets\AssetUploadService;
use App\Extensions\TitanBuilder\System\Http\Requests\AssetUploadRequest;
use App\Extensions\TitanBuilder\System\Security\BuilderAuthorization;
use App\Extensions\TitanBuilder\System\Security\CompanyContext;
use Illuminate\Http\JsonResponse;

final class AssetController
{
    public function __construct(
        private readonly CompanyContext $company,
        private readonly AssetUploadService $assets,
        private readonly BuilderAuthorization $authorization,
    ) {}

    public function store(AssetUploadRequest $request, int $project): JsonResponse
    {
        $this->authorization->require('builder.assets.manage');
        $asset = $this->assets->store($this->company->id(), $project, $request->file('file'));
        return response()->json(['asset' => $asset, 'reference' => 'asset://'.$asset->getKey()], 201);
    }
}
