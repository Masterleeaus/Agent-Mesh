<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Authority;

enum AuthorityLevel: string
{
    case ObserveOnly = 'observe_only';
    case RecommendOnly = 'recommend_only';
    case PrepareOnly = 'prepare_only';
    case ApprovalRequired = 'approval_required';
    case DelegatedAutonomous = 'delegated_autonomous';
    case UserOnly = 'user_only';
}
