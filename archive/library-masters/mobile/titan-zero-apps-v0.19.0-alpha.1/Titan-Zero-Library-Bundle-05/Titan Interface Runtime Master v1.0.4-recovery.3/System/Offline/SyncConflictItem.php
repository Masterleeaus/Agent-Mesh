<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Offline;

final readonly class SyncConflictItem implements \JsonSerializable
{
    /** @param list<string> $resolutionActionRefs */
    public function __construct(
        public string $sourceReference,
        public string $kind,
        public string $summary,
        public ?string $objectRef,
        public array $resolutionActionRefs = [],
    ) {
        if ($kind === '' || strlen($kind) > 100 || $summary === '' || strlen($summary) > 1000) throw new \InvalidArgumentException('Conflict presentation metadata is invalid.');
        if (count(array_unique($resolutionActionRefs)) !== count($resolutionActionRefs) || count($resolutionActionRefs) > 10) throw new \InvalidArgumentException('Conflict resolution action refs are invalid.');
        foreach ($resolutionActionRefs as $ref) if (! is_string($ref) || preg_match('/^[a-z0-9]+(?:[._-][a-z0-9]+)*$/', $ref) !== 1) throw new \InvalidArgumentException('Conflict resolution action ref is invalid.');
    }

    public function jsonSerialize(): array
    {
        return ['source_reference'=>$this->sourceReference,'kind'=>$this->kind,'summary'=>$this->summary,'object_ref'=>$this->objectRef,'resolution_action_refs'=>$this->resolutionActionRefs,'executable'=>false];
    }
}
