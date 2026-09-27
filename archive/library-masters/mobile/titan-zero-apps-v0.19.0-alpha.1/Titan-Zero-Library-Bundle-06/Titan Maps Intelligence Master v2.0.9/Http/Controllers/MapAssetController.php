<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Http\Controllers;

use Illuminate\Http\Response;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

final class MapAssetController
{
    /** @var array<string,array{path:string,content_type:string}> */
    private const ASSETS = [
        'titan-map-engine.js' => ['path' => 'resources/js/titan-map-engine.js', 'content_type' => 'application/javascript; charset=UTF-8'],
        'titan-map-engine.css' => ['path' => 'resources/css/titan-map-engine.css', 'content_type' => 'text/css; charset=UTF-8'],
        'titan-maps-intelligence.js' => ['path' => 'resources/js/titan-maps-intelligence.js', 'content_type' => 'application/javascript; charset=UTF-8'],
    ];

    public function __invoke(string $asset): Response
    {
        $definition = self::ASSETS[$asset] ?? null;
        if ($definition === null) {
            throw new NotFoundHttpException();
        }

        $path = dirname(__DIR__, 2).'/'.$definition['path'];
        if (! is_file($path)) {
            throw new NotFoundHttpException();
        }

        return response((string) file_get_contents($path), 200, [
            'Content-Type' => $definition['content_type'],
            'Cache-Control' => 'private, max-age=86400',
            'X-Content-Type-Options' => 'nosniff',
        ]);
    }
}
