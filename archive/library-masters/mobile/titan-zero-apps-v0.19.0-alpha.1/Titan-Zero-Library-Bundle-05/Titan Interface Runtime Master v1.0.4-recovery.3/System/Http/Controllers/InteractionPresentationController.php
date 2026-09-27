<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Http\Controllers;

use App\Extensions\TitanInterfaceRuntime\System\Contracts\Context\InterfaceContextStoreContract;
use App\Extensions\TitanInterfaceRuntime\System\Interaction\InteractionAdapterException;
use App\Extensions\TitanInterfaceRuntime\System\Interaction\InteractionPresentationAdapter;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;

final class InteractionPresentationController extends Controller
{
    public function __invoke(
        string $session,
        string $mode,
        InterfaceContextStoreContract $contexts,
        InteractionPresentationAdapter $presenter,
    ): JsonResponse {
        try {
            return response()->json($presenter->render($contexts->requireCurrent(), $session, $mode)->jsonSerialize());
        } catch (InteractionAdapterException|\InvalidArgumentException) {
            // Fail closed without leaking whether a foreign/unknown session exists.
            return response()->json(['message' => 'Interaction presentation is unavailable.'], 404);
        }
    }
}
