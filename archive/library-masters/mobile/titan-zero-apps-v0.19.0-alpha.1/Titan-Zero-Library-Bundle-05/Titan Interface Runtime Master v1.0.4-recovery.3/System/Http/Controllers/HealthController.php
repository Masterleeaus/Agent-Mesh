<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Http\Controllers;

use App\Extensions\TitanInterfaceRuntime\System\Contracts\TitanInterfaceRuntimeManagerContract;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;

final class HealthController extends Controller
{
    public function __invoke(TitanInterfaceRuntimeManagerContract $runtime): JsonResponse
    {
        return response()->json([
            'health' => $runtime->health(),
            'boundaries' => $runtime->boundaries(),
        ]);
    }
}
