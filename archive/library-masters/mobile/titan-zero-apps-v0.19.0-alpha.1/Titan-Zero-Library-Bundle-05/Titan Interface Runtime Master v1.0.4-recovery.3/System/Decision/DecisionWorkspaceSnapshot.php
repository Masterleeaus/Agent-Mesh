<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Decision;

use App\Extensions\TitanInterfaceRuntime\System\Presentation\PresentationTree;

final readonly class DecisionWorkspaceSnapshot implements \JsonSerializable
{
    /** @param list<array<string,mixed>> $observations @param list<array<string,mixed>> $recommendations @param list<array<string,mixed>> $scenarios @param list<array<string,mixed>> $assumptions @param list<array<string,mixed>> $decisionIntents @param list<array<string,mixed>> $sources @param array<string,mixed> $policy @param array<string,mixed> $diagnostics */
    public function __construct(
        public string $objectKey,public ?string $viewKey,public string $companyId,public string $userId,public string $productSurface,
        public string $queryFingerprint,public string $providerStatus,public array $observations,public array $recommendations,public array $scenarios,
        public array $assumptions,public array $decisionIntents,public array $sources,public array $policy,public array $diagnostics,public PresentationTree $presentation,
    ){}
    public function jsonSerialize():array{return ['version'=>'1.0','authority'=>'presentation-only','object_key'=>$this->objectKey,'view_key'=>$this->viewKey,'company_id'=>$this->companyId,'company_id'=>$this->companyId,'user_id'=>$this->userId,'product_surface'=>$this->productSurface,'query_fingerprint'=>$this->queryFingerprint,'provider_status'=>$this->providerStatus,'observations'=>$this->observations,'recommendations'=>$this->recommendations,'scenarios'=>$this->scenarios,'assumptions'=>$this->assumptions,'decision_intents'=>$this->decisionIntents,'sources'=>$this->sources,'decision_policy'=>$this->policy,'diagnostics'=>$this->diagnostics,'presentation'=>$this->presentation->jsonSerialize()];}
}
