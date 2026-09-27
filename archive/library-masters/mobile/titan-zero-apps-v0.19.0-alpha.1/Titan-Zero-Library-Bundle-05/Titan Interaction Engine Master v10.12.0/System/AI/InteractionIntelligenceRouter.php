<?php

declare(strict_types=1);
namespace App\Extensions\InteractionEngine\System\AI;
use App\Extensions\InteractionEngine\System\AI\Providers\AIProviderRegistry;
use App\Extensions\InteractionEngine\System\Contracts\InteractionContext;
final class InteractionIntelligenceRouter{public function __construct(private AIProviderRegistry $providers){}public function route(InteractionContext $context,array $request,array $preferred=[]):array{$provider=$this->providers->select($context,$preferred);if(!$provider)return ['status'=>'unavailable','provider'=>null,'authority'=>'none','reason'=>'No approved interaction intelligence provider is available.'];$result=$provider->complete($context,$request);return ['status'=>'completed','provider'=>$provider->key(),'authority'=>'interaction_guidance_only','result'=>$result];}}
