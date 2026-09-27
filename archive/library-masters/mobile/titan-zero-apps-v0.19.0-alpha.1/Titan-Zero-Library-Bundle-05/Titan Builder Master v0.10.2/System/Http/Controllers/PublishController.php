<?php

declare(strict_types=1);

namespace App\Extensions\TitanBuilder\System\Http\Controllers;

use App\Extensions\TitanBuilder\System\Contracts\Publisher;
use App\Extensions\TitanBuilder\System\Security\BuilderAuthorization;
use App\Extensions\TitanBuilder\System\Security\CompanyContext;
use Illuminate\Http\JsonResponse;

final class PublishController
{
    public function __construct(
        private readonly CompanyContext $company,
        private readonly Publisher $publisher,
        private readonly BuilderAuthorization $authorization,
    ) {}

    public function publish(int $project): JsonResponse
    {
        $this->authorization->require('builder.publish');
        $snapshot = $this->publisher->publish($this->company->id(), $project, $this->company->actorId());
        return response()->json(['snapshot' => $snapshot], 201);
    }

    public function rollback(int $project, int $snapshot): JsonResponse
    {
        $this->authorization->require('builder.publish');
        $active = $this->publisher->rollback($this->company->id(), $project, $snapshot, $this->company->actorId());
        return response()->json(['snapshot' => $active]);
    }
}
