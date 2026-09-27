<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Data;

use JsonSerializable;

final readonly class DataModeSurface implements JsonSerializable
{
    public function __construct(public string $key,public string $routeName,public string $url,public string $embedPolicy='deep-link',public string $source='legacy-route'){}
    public function jsonSerialize(): array{return ['key'=>$this->key,'route_name'=>$this->routeName,'url'=>$this->url,'embed_policy'=>$this->embedPolicy,'source'=>$this->source];}
}
