<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Interaction;

use App\Extensions\TitanInterfaceRuntime\System\Presentation\CanonicalPresentationValue;

final readonly class JourneySnapshot implements \JsonSerializable
{
    /**
     * @param array<string,mixed> $progress
     * @param list<array<string,mixed>> $checkpoints
     */
    public function __construct(
        public string $runId,
        public string $journeyId,
        public string $status,
        public ?string $currentWizardId,
        public ?string $wizardSessionId,
        public array $progress = [],
        public array $checkpoints = [],
        public ?string $sagaId = null,
    ) {
        foreach ([$runId, $journeyId, $status] as $value) if (trim($value) === '') throw new \InvalidArgumentException('Journey snapshot identifiers/status must be explicit.');
    }

    /** @return array<string,mixed> */
    public function jsonSerialize(): array
    {
        return CanonicalPresentationValue::normalize([
            'run_id'=>$this->runId,'journey_id'=>$this->journeyId,'status'=>$this->status,
            'current_wizard_id'=>$this->currentWizardId,'wizard_session_id'=>$this->wizardSessionId,
            'progress'=>$this->progress,'checkpoints'=>$this->checkpoints,'saga_id'=>$this->sagaId,
        ]);
    }
}
