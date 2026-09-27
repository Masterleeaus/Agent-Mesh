<?php

declare(strict_types=1);
namespace App\Extensions\InteractionEngine\System\AI\Providers;
use App\Extensions\InteractionEngine\System\Contracts\InteractionContext;
interface InteractionAIProviderInterface{public function key():string;public function available(InteractionContext $context):bool;public function priority():int;public function complete(InteractionContext $context,array $request):array;}
