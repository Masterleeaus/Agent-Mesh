<?php
declare(strict_types=1);
namespace App\Extensions\TitanGo\System\Compatibility;
final class LegacyGoIdentityResolver{public function canonical(string $surface):string{return match(strtolower(trim($surface))){'go','field','worker','titan_go','titan-go'=>'go',default=>throw new \InvalidArgumentException('Unsupported Titan Go surface alias.')};}}
