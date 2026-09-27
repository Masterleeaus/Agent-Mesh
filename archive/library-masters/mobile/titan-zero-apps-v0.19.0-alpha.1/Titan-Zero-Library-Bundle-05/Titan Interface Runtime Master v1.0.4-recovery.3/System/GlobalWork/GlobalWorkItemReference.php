<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\GlobalWork;

use App\Extensions\TitanInterfaceRuntime\System\Surfaces\GlobalWorkTrayCatalog;

final readonly class GlobalWorkItemReference implements \JsonSerializable
{
    /**
     * @param list<string> $requiredCapabilities
     * @param array<string,mixed> $metadata Bounded presentation metadata supplied by the authoritative provider.
     */
    public function __construct(
        public string $tray,
        public string $itemKey,
        public string $sourceAuthority,
        public string $sourceReference,
        public string $label,
        public int $priority,
        public int $occurredAt,
        public int|string $companyId,
        public ?string $objectRef = null,
        public ?string $interactionRef = null,
        public ?string $actionRef = null,
        public array $requiredCapabilities = [],
        public ?string $summary = null,
        public array $metadata = [],
    ) {
        if (! GlobalWorkTrayCatalog::accepts($tray)) throw new \InvalidArgumentException("Unsupported global work tray '{$tray}'.");
        foreach (['item key'=>$itemKey,'source authority'=>$sourceAuthority] as $field=>$value) {
            if (preg_match('/^[a-z0-9]+(?:[._-][a-z0-9]+)*$/', $value) !== 1) throw new \InvalidArgumentException("Global work {$field} is invalid.");
        }
        if ($sourceReference === '' || strlen($sourceReference) > 320 || preg_match('/[\x00-\x1F\x7F]/', $sourceReference)) throw new \InvalidArgumentException('Global work source reference is invalid.');
        if (trim($label) === '' || strlen($label) > 240) throw new \InvalidArgumentException('Global work label is invalid.');
        if ($summary !== null && strlen($summary) > 1000) throw new \InvalidArgumentException('Global work summary is too long.');
        if ($priority < 0 || $priority > 1000) throw new \InvalidArgumentException('Global work priority must be between 0 and 1000.');
        if ($occurredAt < 0) throw new \InvalidArgumentException('Global work occurred_at must be non-negative.');
        if ((is_int($companyId) && $companyId <= 0) || (is_string($companyId) && trim($companyId) === '')) throw new \InvalidArgumentException('Global work company_id is invalid.');
        foreach (['object_ref'=>$objectRef,'interaction_ref'=>$interactionRef,'action_ref'=>$actionRef] as $field=>$value) {
            if ($value !== null && ($value === '' || strlen($value) > 320 || preg_match('/[\x00-\x1F\x7F]/', $value))) throw new \InvalidArgumentException("Global work {$field} is invalid.");
        }
        if (count(array_unique($requiredCapabilities)) !== count($requiredCapabilities)) throw new \InvalidArgumentException('Global work required capabilities must be unique.');
        foreach ($requiredCapabilities as $capability) {
            if (! is_string($capability) || $capability === '' || strlen($capability) > 160) throw new \InvalidArgumentException('Global work required capabilities contain an invalid value.');
        }
        self::assertMetadata($metadata);
    }

    public function dedupeKey(): string
    {
        return hash('sha256', $this->tray . "\0" . $this->sourceAuthority . "\0" . $this->sourceReference);
    }

    /** @param list<string> $capabilities */
    public function authorizedBy(array $capabilities): bool
    {
        foreach ($this->requiredCapabilities as $required) if (! in_array('*', $capabilities, true) && ! in_array($required, $capabilities, true)) return false;
        return true;
    }

    public function tenantMatches(int|string $companyId): bool
    {
        return (string) $this->companyId === (string) $companyId;
    }

    /** @return array<string,mixed> */
    public function jsonSerialize(): array
    {
        return [
            'tray'=>$this->tray,'item_key'=>$this->itemKey,'source_authority'=>$this->sourceAuthority,
            'source_reference'=>$this->sourceReference,'label'=>$this->label,'summary'=>$this->summary,
            'priority'=>$this->priority,'occurred_at'=>$this->occurredAt,'company_id'=>$this->companyId,'company_id'=>$this->companyId,
            'object_ref'=>$this->objectRef,'interaction_ref'=>$this->interactionRef,'action_ref'=>$this->actionRef,
            'required_capabilities'=>$this->requiredCapabilities,'metadata'=>$this->metadata,
            'dedupe_key'=>$this->dedupeKey(),'executable'=>false,
        ];
    }

    /** @param array<string,mixed> $metadata */
    private static function assertMetadata(array $metadata): void
    {
        if (count($metadata) > 32) throw new \InvalidArgumentException('Global work metadata has too many keys.');
        $encoded = json_encode($metadata, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        if ($encoded === false || strlen($encoded) > 16384) throw new \InvalidArgumentException('Global work metadata exceeds the presentation budget.');
        self::assertSafeMetadataValue($metadata, 0);
    }

    private static function assertSafeMetadataValue(mixed $value, int $depth): void
    {
        if ($depth > 4) throw new \InvalidArgumentException('Global work metadata nesting is too deep.');
        if (is_null($value) || is_bool($value) || is_int($value) || is_float($value)) return;
        if (is_string($value)) {
            if (strlen($value) > 2000 || preg_match('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/', $value)) throw new \InvalidArgumentException('Global work metadata contains an unsafe string.');
            return;
        }
        if (! is_array($value)) throw new \InvalidArgumentException('Global work metadata contains an unsupported value.');
        if (count($value) > 100) throw new \InvalidArgumentException('Global work metadata collection is too large.');
        foreach ($value as $key => $child) {
            if (! is_int($key) && (! is_string($key) || $key === '' || strlen($key) > 100 || preg_match('/[^A-Za-z0-9._-]/', $key))) {
                throw new \InvalidArgumentException('Global work metadata key is invalid.');
            }
            if (is_string($key) && preg_match('/(?:secret|token|password|cipher|payload|raw|content|body|html|authorization|cookie)/i', $key)) {
                throw new \InvalidArgumentException('Global work metadata may not carry opaque or secret payload fields.');
            }
            self::assertSafeMetadataValue($child, $depth + 1);
        }
    }
}
