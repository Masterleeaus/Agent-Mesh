<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Enums;

enum CandidateType: string
{
    case SalesLead = 'sales_lead';
    case CustomerCandidate = 'customer_candidate';
    case ProviderCandidate = 'provider_candidate';
    case ContractorCandidate = 'contractor_candidate';
    case SupplierCandidate = 'supplier_candidate';
    case PropertyOperator = 'property_operator';
    case AccommodationProvider = 'accommodation_provider';
    case PropertyManager = 'property_manager';
    case FacilitiesManager = 'facilities_manager';
    case Competitor = 'competitor';
    case EmergencyProvider = 'emergency_provider';
    case Irrelevant = 'irrelevant';
    case Unclassified = 'unclassified';
}
