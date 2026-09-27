<?php

declare(strict_types=1);

namespace Modules\TitanZeroAssurance\Contracts;

use Modules\TitanZeroAssurance\ValueObjects\WorkItemRequest;

interface WorkItemDispatcher
{
    public function dispatch(WorkItemRequest $request): string;
}
