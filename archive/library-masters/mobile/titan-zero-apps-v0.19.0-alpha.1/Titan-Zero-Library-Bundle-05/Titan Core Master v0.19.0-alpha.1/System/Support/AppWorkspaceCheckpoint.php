<?php
declare(strict_types=1);

namespace App\Extensions\TitanAppsCore\System\Support;

final readonly class AppWorkspaceCheckpoint
{
    /** @param array<string,mixed> $payload */
    public function __construct(
        public string $section,
        public string $state,
        public int $revision,
        public array $payload=[],
    ) {
        if(trim($section)==='') throw new \InvalidArgumentException('app_workspace_section_required');
        if(trim($state)==='') throw new \InvalidArgumentException('app_workspace_state_required');
        if($revision<0) throw new \InvalidArgumentException('app_workspace_revision_invalid');
    }

    /** @return array<string,mixed> */
    public function toArray(): array
    {
        return ['section'=>$this->section,'state'=>$this->state,'revision'=>$this->revision,'payload'=>$this->payload];
    }
}
