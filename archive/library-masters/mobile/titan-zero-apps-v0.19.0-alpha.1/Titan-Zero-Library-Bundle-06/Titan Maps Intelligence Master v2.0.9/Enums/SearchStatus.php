<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Enums;

enum SearchStatus: string
{
    case Draft = 'draft';
    case Queued = 'queued';
    case Running = 'running';
    case Paused = 'paused';
    case Completed = 'completed';
    case PartiallyCompleted = 'partially_completed';
    case Failed = 'failed';
    case Cancelled = 'cancelled';
}
