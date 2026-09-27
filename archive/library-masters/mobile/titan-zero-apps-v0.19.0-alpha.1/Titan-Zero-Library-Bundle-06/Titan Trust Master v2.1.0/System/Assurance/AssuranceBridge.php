<?php
declare(strict_types=1);
namespace App\Extensions\TitanTrust\System\Assurance;
use Modules\TitanZeroAssurance\Services\AssuranceSignals;
final class AssuranceBridge { public function __construct(private AssuranceSignals $signals){} public function emit(string $subjectType,string|int $subjectId,array $evidence=[],array $metadata=[],string $signal='trust.incident_reported',array $capabilities=[]):array {return $this->signals->emit($signal,$subjectType,$subjectId,$evidence,$metadata,$capabilities);} }
