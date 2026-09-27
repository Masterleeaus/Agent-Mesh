<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Configuration;

use App\Extensions\TitanInterfaceRuntime\System\Presentation\PresentationTree;

final readonly class ConfigurationLifecycleWorkspaceSnapshot implements \JsonSerializable
{
    /** @param array<string,mixed>|null $currentVersion @param array<string,mixed>|null $publishedVersion @param array<string,mixed> $preview @param array<string,mixed> $validation @param list<array<string,mixed>> $history @param array<string,mixed> $rollback @param list<array<string,mixed>> $actionIntents @param array<string,mixed> $provenance @param array<string,mixed> $policy */
    public function __construct(
        public string $objectReference, public string $objectKey, public string $viewKey, public string $status,
        public ?array $currentVersion, public ?array $publishedVersion, public array $preview, public array $validation,
        public array $history, public array $rollback, public array $actionIntents, public array $provenance,
        public array $policy, public string $queryFingerprint, public PresentationTree $presentation,
    ) {}

    public function jsonSerialize(): array
    {
        return ['version'=>'1.0','authority'=>'presentation-only','object_reference'=>$this->objectReference,'object_key'=>$this->objectKey,'view_key'=>$this->viewKey,'status'=>$this->status,
            'current_version'=>$this->currentVersion,'published_version'=>$this->publishedVersion,'preview'=>$this->preview,'validation'=>$this->validation,'history'=>$this->history,'rollback'=>$this->rollback,
            'action_intents'=>$this->actionIntents,'provenance'=>$this->provenance,'configuration_policy'=>$this->policy,'query_fingerprint'=>$this->queryFingerprint,'presentation'=>$this->presentation->jsonSerialize()];
    }
}
