<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Registry;

use JsonSerializable;

final readonly class LegacyDataSurfaceDescriptor implements JsonSerializable
{
    /** @param list<string> $objectRefs @param list<string> $permissions */
    public function __construct(
        public string $contributorKey,
        public string $key,
        public string $routeName,
        public array $objectRefs,
        public array $permissions,
    ) {}

    /** @param list<string> $capabilities */
    public function authorizedBy(array $capabilities): bool
    {
        foreach ($this->permissions as $permission) if (! in_array('*',$capabilities,true) && ! in_array($permission,$capabilities,true)) return false;
        return true;
    }

    public function jsonSerialize(): array
    {
        return ['contributor_key'=>$this->contributorKey,'key'=>$this->key,'route_name'=>$this->routeName,'object_refs'=>$this->objectRefs,'permissions'=>$this->permissions];
    }
}
