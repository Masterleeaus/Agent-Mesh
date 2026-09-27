<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Governance;

use App\Extensions\TitanInterfaceRuntime\System\Presentation\PresentationTree;
use App\Extensions\TitanInterfaceRuntime\System\Receipts\InterfaceReceipt;

final readonly class GovernanceWorkspaceSnapshot implements \JsonSerializable
{
    /**
     * @param array<string,mixed> $proposal @param array<string,mixed> $risk @param array<string,mixed> $assurance
     * @param array<string,mixed> $autonomy @param array<string,mixed> $approval @param array<string,mixed> $execution
     * @param array<string,mixed> $rollback @param list<array<string,mixed>> $actionIntents
     * @param array<string,mixed> $provenance @param array<string,mixed> $policy @param array<string,mixed> $diagnostics
     */
    public function __construct(
        public string $objectReference,
        public string $actionKey,
        public string $status,
        public string $providerStatus,
        public array $proposal,
        public array $risk,
        public array $assurance,
        public array $autonomy,
        public array $approval,
        public array $execution,
        public ?InterfaceReceipt $receipt,
        public array $rollback,
        public array $actionIntents,
        public array $provenance,
        public array $policy,
        public array $diagnostics,
        public PresentationTree $presentation,
    ) {}

    public function jsonSerialize(): array
    {
        return [
            'object_reference'=>$this->objectReference,'action_key'=>$this->actionKey,'status'=>$this->status,'provider_status'=>$this->providerStatus,
            'proposal'=>$this->proposal,'risk'=>$this->risk,'assurance'=>$this->assurance,'autonomy'=>$this->autonomy,'approval'=>$this->approval,
            'execution'=>$this->execution,'receipt'=>$this->receipt?->jsonSerialize(),'rollback'=>$this->rollback,'action_intents'=>$this->actionIntents,
            'provenance'=>$this->provenance,'policy'=>$this->policy,'diagnostics'=>$this->diagnostics,'presentation'=>$this->presentation->jsonSerialize(),
        ];
    }
}
