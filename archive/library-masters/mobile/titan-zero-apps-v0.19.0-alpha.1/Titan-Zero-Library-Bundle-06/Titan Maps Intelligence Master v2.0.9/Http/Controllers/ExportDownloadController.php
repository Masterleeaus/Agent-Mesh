<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Http\Controllers;

use App\Extensions\TitanMapsIntelligence\Contracts\AuthorisedCompanyContext;
use App\Extensions\TitanMapsIntelligence\Services\LocalPrivateExportStore;
use Symfony\Component\HttpFoundation\Response;

final class ExportDownloadController
{
    public function __invoke(string $reference, AuthorisedCompanyContext $context, LocalPrivateExportStore $store): Response
    {
        $payload = $store->read($context->companyId(), $reference);

        return response($payload['contents'], 200, [
            'Content-Type' => $payload['mime_type'],
            'Content-Disposition' => 'attachment; filename="'.addcslashes($payload['filename'], '"\\').'"',
            'X-Content-Type-Options' => 'nosniff',
            'Cache-Control' => 'private, no-store, max-age=0',
        ]);
    }
}
