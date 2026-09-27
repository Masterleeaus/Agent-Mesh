<?php

declare(strict_types=1);

namespace App\Extensions\TitanGo\System\Http\Controllers;

use App\Extensions\TitanGo\System\Health\GoHealthCheck;
use App\Extensions\TitanGo\System\Runtime\GoBootstrap;
use Illuminate\Contracts\View\View;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;

final class GoShellController
{
    public function __construct(
        private GoBootstrap $bootstrap,
        private GoHealthCheck $health,
    ) {}

    public function workspace(string $workspace = 'today'): View
    {
        $allowed = ['today', 'jobs', 'schedule', 'inbox', 'more'];
        if (!in_array($workspace, $allowed, true)) {
            abort(404);
        }

        return view('titan-go::go.shell', [
            'workspace' => $workspace,
            'goBootstrap' => $this->bootstrap->describe(),
        ]);
    }

    public function bootstrap(): JsonResponse
    {
        return response()->json($this->bootstrap->describe());
    }

    public function health(): JsonResponse
    {
        return response()->json($this->health->report());
    }

    public function client(): Response
    {
        $path = dirname(__DIR__, 3).'/resources/js/go-shell.js';
        if (!is_file($path)) {
            abort(404);
        }

        return response((string) file_get_contents($path), 200, [
            'Content-Type' => 'application/javascript; charset=UTF-8',
            'Cache-Control' => 'public, max-age=300, must-revalidate',
            'X-Content-Type-Options' => 'nosniff',
        ]);
    }
}
