<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Collection;

use App\Extensions\TitanInterfaceRuntime\System\Authority\AuthorityReadResult;
use App\Extensions\TitanInterfaceRuntime\System\Authority\ReadQuery;
use App\Extensions\TitanInterfaceRuntime\System\Presentation\PresentationTree;
use JsonSerializable;

final readonly class CollectionViewSnapshot implements JsonSerializable
{
    /** @param list<CollectionViewOption> $views */
    public function __construct(
        public string $objectKey,
        public int $companyId,
        public int $userId,
        public string $productSurface,
        public string $domain,
        public string $selectedViewKey,
        public string $sourceAuthority,
        public string $sourceMode,
        public string $sourceReference,
        public ReadQuery $query,
        public AuthorityReadResult $source,
        public array $views,
        public PresentationTree $presentation,
    ) {}

    public function contextFingerprint(): string
    {
        return hash('sha256',json_encode([
            'tenant'=>$this->companyId,'user'=>$this->userId,'surface'=>$this->productSurface,'domain'=>$this->domain,
        ],JSON_UNESCAPED_SLASHES|JSON_THROW_ON_ERROR));
    }

    public function viewSetFingerprint(): string
    {
        return hash('sha256',json_encode([
            'object'=>$this->objectKey,'authority'=>$this->sourceAuthority,'mode'=>$this->sourceMode,'reference'=>$this->sourceReference,
            'views'=>array_map(static fn(CollectionViewOption $v):array=>$v->jsonSerialize(),$this->views),
        ],JSON_UNESCAPED_SLASHES|JSON_THROW_ON_ERROR));
    }

    public function jsonSerialize(): array
    {
        return [
            'authority'=>'presentation-only','object_key'=>$this->objectKey,'selected_view_key'=>$this->selectedViewKey,
            'source'=>['authority'=>$this->sourceAuthority,'mode'=>$this->sourceMode,'reference'=>$this->sourceReference,'result'=>$this->source->jsonSerialize()],
            'query'=>$this->query->jsonSerialize(),'query_fingerprint'=>$this->query->fingerprint(),
            'views'=>array_map(static fn(CollectionViewOption $v):array=>$v->jsonSerialize(),$this->views),
            'view_set_fingerprint'=>$this->viewSetFingerprint(),'presentation'=>$this->presentation->jsonSerialize(),
        ];
    }
}
