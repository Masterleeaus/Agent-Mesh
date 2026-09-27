<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Enums;

enum VerificationStatus: string
{
    case Unverified = 'unverified';
    case ProviderVerified = 'provider_verified';
    case HumanVerified = 'human_verified';
    case Failed = 'failed';
    case Expired = 'expired';
}
