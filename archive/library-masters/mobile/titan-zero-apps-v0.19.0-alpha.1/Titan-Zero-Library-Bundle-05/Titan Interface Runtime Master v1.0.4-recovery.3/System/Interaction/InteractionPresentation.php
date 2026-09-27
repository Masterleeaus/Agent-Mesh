<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Interaction;

use App\Extensions\TitanInterfaceRuntime\System\Presentation\CanonicalPresentationValue;
use App\Extensions\TitanInterfaceRuntime\System\Presentation\PresentationTree;

final readonly class InteractionPresentation implements \JsonSerializable
{
    public function __construct(
        public string $mode,
        public InteractionSnapshot $snapshot,
        public PresentationTree $tree,
        public string $snapshotFingerprint,
    ) {}

    /** @return array<string,mixed> */
    public function jsonSerialize(): array
    {
        return CanonicalPresentationValue::normalize([
            'mode'=>$this->mode,'session_id'=>$this->snapshot->sessionId,'resume_key'=>$this->snapshot->sessionId,
            'wizard_id'=>$this->snapshot->wizardId,'status'=>$this->snapshot->status,
            'snapshot_fingerprint'=>$this->snapshotFingerprint,'interaction'=>$this->snapshot->safeInteraction(),
            'journey'=>$this->snapshot->journey?->jsonSerialize(),'resumable'=>$this->snapshot->resumable(),
            'tree'=>$this->tree->jsonSerialize(),
        ]);
    }
}
