<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Actions;

use App\Extensions\TitanInterfaceRuntime\System\Contracts\ActionIntentDispatcher;
final class UnavailableActionIntentDispatcher implements ActionIntentDispatcher
{
    public function dispatch(array $intent): array { return ['status'=>'unavailable','intent'=>$intent,'executed'=>false]; }
}
