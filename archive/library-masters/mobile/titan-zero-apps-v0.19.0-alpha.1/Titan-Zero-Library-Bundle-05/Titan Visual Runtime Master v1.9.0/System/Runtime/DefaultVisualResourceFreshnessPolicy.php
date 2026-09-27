<?php
declare(strict_types=1);
namespace App\Extensions\TitanVisualRuntime\System\Runtime;
use App\Extensions\TitanVisualRuntime\System\Contracts\VisualResourceFreshnessPolicy;
final class DefaultVisualResourceFreshnessPolicy implements VisualResourceFreshnessPolicy
{
    public function evaluate(array $resource,int $now): array {
        $fetchedAt=(int)($resource['fetchedAt']??0);
        $maxAge=max(0,(int)($resource['maxAgeSeconds']??0));
        if($fetchedAt<=0 || $maxAge===0) return ['fresh'=>false,'reason'=>'unbounded-or-unknown','expiresAt'=>null];
        $expiresAt=$fetchedAt+$maxAge;
        return ['fresh'=>$now<=$expiresAt,'reason'=>$now<=$expiresAt?'fresh':'expired','expiresAt'=>$expiresAt];
    }
}
