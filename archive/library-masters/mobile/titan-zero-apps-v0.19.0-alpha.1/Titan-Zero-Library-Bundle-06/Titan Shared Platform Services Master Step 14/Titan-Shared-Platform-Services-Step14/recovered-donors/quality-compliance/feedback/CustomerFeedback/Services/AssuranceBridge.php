<?php
declare(strict_types=1);
namespace Modules\CustomerFeedback\Services;
use Modules\TitanZeroAssurance\Services\AssuranceSignals;
final class AssuranceBridge { public function __construct(private AssuranceSignals $signals){} public function emit(string $subjectType,string|int $subjectId,array $evidence=[],array $metadata=[],string $signal='feedback.complaint_received',array $capabilities=[]):array {return $this->signals->emit($signal,$subjectType,$subjectId,$evidence,$metadata,$capabilities);} }
