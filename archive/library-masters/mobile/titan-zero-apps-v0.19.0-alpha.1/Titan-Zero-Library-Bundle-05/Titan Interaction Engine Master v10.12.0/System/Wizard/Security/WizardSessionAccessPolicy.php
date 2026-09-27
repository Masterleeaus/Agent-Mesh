<?php

declare(strict_types=1);
namespace App\Extensions\InteractionEngine\System\Wizard\Security;
use App\Extensions\InteractionEngine\System\Wizard\WizardSession;
final class WizardSessionAccessPolicy
{
    public function mayAccess(WizardSession$session,array$actorContext):bool
    {
        $sessionCompany=(string)($session->context['company_id']??'');$actorCompany=(string)($actorContext['company_id']??'');$actorUser=(string)($actorContext['user_id']??'');
        if($sessionCompany===''||$actorCompany===''||$actorUser===''||!hash_equals($sessionCompany,$actorCompany))return false;
        if(isset($session->context['company_id'])&&(string)$session->context['company_id']!==$sessionCompany)return false;
        if(isset($actorContext['company_id'])&&(string)$actorContext['company_id']!==$actorCompany)return false;
        $sessionUser=(string)($session->context['user_id']??'');if($sessionUser!==''&&hash_equals($sessionUser,$actorUser))return true;
        $delegated=array_values(array_map('strval',(array)($session->context['delegated_actor_ids']??[])));if(in_array($actorUser,$delegated,true))return true;
        if(!(bool)($session->definition->metadata['multi_actor']??false))return false;
        $allowed=array_values(array_map('strval',(array)($session->definition->metadata['collaboration_roles']??[])));$roles=array_values(array_map('strval',(array)($actorContext['roles']??[])));
        return $allowed!==[]&&array_intersect($allowed,$roles)!==[];
    }
}
