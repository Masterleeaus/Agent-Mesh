<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\PublicApi;

use App\Extensions\InteractionEngine\System\Journey\JourneyDefinition;
use App\Extensions\InteractionEngine\System\Journey\JourneyRegistry;
use App\Extensions\InteractionEngine\System\Surfaces\SurfaceWizardPolicy;
use App\Extensions\InteractionEngine\System\Wizard\WizardRegistry;

final class ProviderJourneyRegistryGateway
{
    public function __construct(
        private readonly JourneyRegistry $journeys,
        private readonly WizardRegistry $wizards,
        private readonly SurfaceWizardPolicy $surfaces,
    ) {}

    public function registerProviderJourney(string $provider, string $key, array $definition): bool
    {
        $provider=trim($provider); $key=trim($key); $wizard=trim((string)($definition['wizard']??''));
        if($provider===''||$key===''||$wizard==='') return false;
        if(!$this->wizards->has($wizard)) return false;
        $requested=(array)($definition['supported_surfaces']??['zero']);
        $appSurfaces=[]; foreach($requested as $surface){$canonical=$this->surfaces->canonicalSurface((string)$surface);if(in_array($canonical,['zero','go','hub'],true))$appSurfaces[$canonical]=true;}
        if($appSurfaces===[])$appSurfaces=['zero'=>true];
        $id=$provider.'_'.$key;
        if($this->journeys->has($id)) return true;
        $metadata=(array)($definition['metadata']??[]);
        $metadata=array_replace($metadata,[
            'provider'=>$provider,
            'provider_journey_key'=>$key,
            'provider_surface'=>$definition['surface']??null,
            'provider_capability'=>$definition['capability']??null,
        ]);
        $this->journeys->register(new JourneyDefinition(
            $id,
            (string)($definition['name']??$key),
            [$wizard],
            array_keys($appSurfaces),
            metadata:$metadata,
        ));
        return true;
    }
}
