<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Enums;

enum CandidateStatus: string
{
    case New = 'new';
    case Classified = 'classified';
    case ReviewRequired = 'review_required';
    case Approved = 'approved';
    case Rejected = 'rejected';
    case Promoted = 'promoted';
    case Expired = 'expired';
}
