<?php

declare(strict_types=1);

namespace App\Extensions\TitanBuilder\System\Http\Controllers;

use App\Extensions\TitanBuilder\System\Contracts\PreviewRenderer;
use App\Extensions\TitanBuilder\System\Http\Requests\PreviewRequest;
use App\Extensions\TitanBuilder\System\Security\BuilderAuthorization;
use App\Extensions\TitanBuilder\System\Security\CompanyContext;
use Illuminate\Http\JsonResponse;

final class PreviewController
{
    public function __construct(
        private readonly CompanyContext $company,
        private readonly PreviewRenderer $preview,
        private readonly BuilderAuthorization $authorization,
    ) {}

    public function __invoke(PreviewRequest $request): JsonResponse
    {
        $this->authorization->require('builder.read');
        $this->company->id();
        $data = $request->validated();
        $spec = (array) $data['spec'];
        unset($data['spec']);
        return response()->json($this->preview->render($spec, $data));
    }
}
