<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Registry;

final readonly class DecisionProviderDescriptor implements \JsonSerializable
{
    /** @param list<string> $objectRefs @param list<string> $actionRefs */
    public function __construct(
        public string $contributorKey,
        public string $key,
        public array $objectRefs,
        public string $sourceRef,
        public array $actionRefs,
    ) {
        self::assertKey($contributorKey, true);
        self::assertKey($key);
        if ($objectRefs === [] || count(array_unique($objectRefs)) !== count($objectRefs)) throw new \InvalidArgumentException("decision provider '{$key}' object_refs must be a non-empty unique list.");
        foreach ($objectRefs as $ref) self::assertKey($ref);
        if ($sourceRef === '' || strlen($sourceRef) > 200 || preg_match('/[\x00-\x1F\x7F]/', $sourceRef)) throw new \InvalidArgumentException("decision provider '{$key}' source_ref is invalid.");
        if (count(array_unique($actionRefs)) !== count($actionRefs)) throw new \InvalidArgumentException("decision provider '{$key}' action_refs must be unique.");
        foreach ($actionRefs as $ref) self::assertKey($ref);
    }

    /** @param array<string,mixed> $raw */
    public static function fromArray(string $contributorKey, array $raw): self
    {
        foreach (['key','object_refs','source_ref','action_refs'] as $required) if (! array_key_exists($required,$raw)) throw new \InvalidArgumentException("decision provider is missing {$required}.");
        foreach (['object_refs','action_refs'] as $field) {
            if (! is_array($raw[$field]) || ! array_is_list($raw[$field])) throw new \InvalidArgumentException("decision provider {$field} must be a list.");
            foreach ($raw[$field] as $value) if (! is_string($value)) throw new \InvalidArgumentException("decision provider {$field} must contain strings.");
        }
        return new self($contributorKey,(string)$raw['key'],array_values($raw['object_refs']),(string)$raw['source_ref'],array_values($raw['action_refs']));
    }

    public function providerKey(): string { return $this->contributorKey . ':' . $this->key; }
    public function binding(): string { return 'titan.interface.decision.' . $this->contributorKey . '.' . $this->key; }
    public function appliesTo(string $objectKey): bool { return in_array($objectKey,$this->objectRefs,true); }

    public function jsonSerialize(): array
    {
        return ['contributor_key'=>$this->contributorKey,'key'=>$this->key,'provider_key'=>$this->providerKey(),'binding'=>$this->binding(),'object_refs'=>$this->objectRefs,'source_ref'=>$this->sourceRef,'action_refs'=>$this->actionRefs];
    }

    private static function assertKey(string $value, bool $hyphenOnly = false): void
    {
        $pattern=$hyphenOnly?'/^[a-z0-9]+(?:-[a-z0-9]+)*$/':'/^[a-z0-9]+(?:[._-][a-z0-9]+)*$/';
        if (preg_match($pattern,$value)!==1) throw new \InvalidArgumentException('decision provider key is invalid.');
    }
}
