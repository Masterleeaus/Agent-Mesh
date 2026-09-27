<?php
declare(strict_types=1);

namespace App\Extensions\TitanAppsCore\System\Services;

use App\Extensions\TitanAppsCore\System\Support\AppContext;

final class AppTrustedContextNormalizer
{
    /**
     * @param list<int|string|null> $legacyCompanyIds
     * @param array<string,mixed> $attributes
     */
    public function normalize(
        string $surface,
        int|string|null $companyId,
        array $legacyCompanyIds,
        int|string|null $actorId,
        ?string $sessionId=null,
        array $attributes=[],
    ): AppContext {
        $canonical=$this->positiveInt($companyId,'company_id');
        $actor=$this->positiveInt($actorId,'actor_id');

        foreach($legacyCompanyIds as $legacy){
            if($legacy===null||$legacy==='') continue;
            $value=$this->positiveInt($legacy,'legacy_company_id');
            if($value!==$canonical) throw new \InvalidArgumentException('app_context_company_conflict');
        }

        return new AppContext(
            \App\Extensions\TitanAppsCore\System\Contracts\AppSurface::resolve($surface),
            $canonical,
            $actor,
            $sessionId,
            $attributes,
        );
    }

    private function positiveInt(int|string|null $value,string $field): int
    {
        if(is_int($value)&&$value>0) return $value;
        if(is_string($value)&&ctype_digit($value)&&(int)$value>0) return (int)$value;
        throw new \InvalidArgumentException('app_context_'.$field.'_required');
    }
}
