<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Spatial;

use App\Extensions\TitanInterfaceRuntime\System\Presentation\PresentationTree;

final readonly class SpatialWorkspaceSnapshot implements \JsonSerializable
{
    /**
     * @param list<array<string,mixed>> $layers
     * @param list<array<string,mixed>> $pins
     * @param list<array<string,mixed>> $candidates
     * @param list<array<string,mixed>> $routes
     * @param list<array<string,mixed>> $territories
     * @param list<array<string,mixed>> $traffic
     * @param array<string,mixed> $provenance
     * @param array<string,mixed> $diagnostics
     */
    public function __construct(
        public string $objectKey,
        public string $viewKey,
        public string $companyId,
        public string $userId,
        public string $productSurface,
        public string $sourceAuthority,
        public string $sourceMode,
        public string $sourceReference,
        public string $queryFingerprint,
        public array $layers,
        public array $pins,
        public array $candidates,
        public array $routes,
        public array $territories,
        public array $traffic,
        public array $provenance,
        public array $diagnostics,
        public PresentationTree $presentation,
    ) {}

    public function jsonSerialize(): array
    {
        return [
            'version'=>'1.0','authority'=>'presentation-only','object_key'=>$this->objectKey,'view_key'=>$this->viewKey,
            'company_id'=>$this->companyId,'company_id'=>$this->companyId,'user_id'=>$this->userId,'product_surface'=>$this->productSurface,
            'source'=>['authority'=>$this->sourceAuthority,'mode'=>$this->sourceMode,'reference'=>$this->sourceReference,'query_fingerprint'=>$this->queryFingerprint,'provenance'=>$this->provenance],
            'spatial'=>['layers'=>$this->layers,'pins'=>$this->pins,'candidates'=>$this->candidates,'routes'=>$this->routes,'territories'=>$this->territories,'traffic'=>$this->traffic],
            'diagnostics'=>$this->diagnostics,'presentation'=>$this->presentation->jsonSerialize(),
        ];
    }
}
