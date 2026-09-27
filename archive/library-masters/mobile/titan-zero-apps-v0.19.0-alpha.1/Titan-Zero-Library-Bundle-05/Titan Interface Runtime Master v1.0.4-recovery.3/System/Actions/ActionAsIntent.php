<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Actions;

use App\Extensions\TitanInterfaceRuntime\System\Contracts\ActionIntentDispatcher;

final class ActionAsIntent
{
    public function __construct(private ActionIntentDispatcher $dispatcher){}

    public function invoke(string $capability,array $payload,array $context=[]): array
    {
        $capability=trim($capability);
        if(!preg_match('/^[a-z0-9][a-z0-9._:-]{2,190}$/',$capability)) {
            throw new \InvalidArgumentException('Actions must resolve to registered capability intents.');
        }
        $this->assertNoClientAuthority($payload);
        return $this->dispatcher->dispatch(['type'=>'capability-intent','capability'=>$capability,'payload'=>$payload,'context'=>$context]);
    }

    private function assertNoClientAuthority(array $payload): void
    {
        $forbidden=['company_id','company_id','company_id','actor_id','permissions','roles','entitlements','autonomy','risk','cost_policy','privacy_policy','credentials'];
        foreach($payload as $key=>$value){
            if(in_array(strtolower((string)$key),$forbidden,true)) throw new \InvalidArgumentException('Generated action payload may not supply execution authority.');
            if(is_array($value)) $this->assertNoClientAuthority($value);
        }
    }
}
