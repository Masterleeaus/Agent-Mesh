<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Presentation;

final readonly class AccessibilityAuditReport implements \JsonSerializable
{
    /** @param list<array{code:string,key:string,message:string}> $violations */
    public function __construct(public array $violations, public int $nodesAudited) {}

    public function passesWcag22AaTarget(): bool { return $this->violations === []; }

    public function jsonSerialize(): array
    {
        return ['target'=>'WCAG-2.2-AA','passes'=>$this->passesWcag22AaTarget(),'nodes_audited'=>$this->nodesAudited,'violations'=>$this->violations,
            'contrast'=>'delegated-to-accessible-component-vocabulary','keyboard_trap'=>'runtime-e2e-required'];
    }
}
