<?php

declare(strict_types=1);
namespace App\Extensions\TitanInterfaceRuntime\System\Presentation;
final readonly class ResponsiveAuditReport implements \JsonSerializable
{
    /** @param list<string> $violations */ public function __construct(public array $violations){}
    public function passes():bool{return $this->violations===[];}
    public function jsonSerialize():array{return ['passes'=>$this->passes(),'violations'=>$this->violations,'mobile_surfaces'=>['go','hub','onboarding']];}
}
