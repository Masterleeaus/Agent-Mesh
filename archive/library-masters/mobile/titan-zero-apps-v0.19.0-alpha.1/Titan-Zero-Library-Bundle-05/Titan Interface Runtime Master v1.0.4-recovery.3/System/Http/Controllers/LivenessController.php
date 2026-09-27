<?php

declare(strict_types=1);
namespace App\Extensions\TitanInterfaceRuntime\System\Http\Controllers;
use App\Extensions\TitanInterfaceRuntime\System\Operations\RuntimeOperationalState; use App\Http\Controllers\Controller; use Illuminate\Http\JsonResponse;
final class LivenessController extends Controller { public function __invoke(RuntimeOperationalState $state): JsonResponse { return response()->json($state->liveness()); } }
