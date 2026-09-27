<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Tools;

use App\Extensions\TitanMapsIntelligence\Contracts\AuthorisedCompanyContext;
use App\Extensions\TitanMapsIntelligence\Contracts\PermissionAuthorizer;
use App\Extensions\TitanMapsIntelligence\DTO\Coordinates;
use App\Extensions\TitanMapsIntelligence\DTO\RouteRequest;
use App\Extensions\TitanMapsIntelligence\Services\RouteCalculationService;
use App\Extensions\TitanMapsIntelligence\Services\RouteResultPresenter;

final class CalculateRouteTool
{
    public function __construct(
        private readonly AuthorisedCompanyContext $context,
        private readonly PermissionAuthorizer $authorizer,
        private readonly RouteCalculationService $routes,
        private readonly RouteResultPresenter $presenter,
    ) {}

    public function execute(array $input): array
    {
        $companyId = $this->context->companyId();
        $this->authorizer->authorize($this->context->userId(), $companyId, 'titan-maps-intelligence.route.calculate');
        $origin = new Coordinates((float) $input['origin_latitude'], (float) $input['origin_longitude']);
        $destination = new Coordinates((float) $input['destination_latitude'], (float) $input['destination_longitude']);
        $result = $this->routes->calculate(new RouteRequest(
            origin: $origin,
            destination: $destination,
            travelMode: (string) ($input['travel_mode'] ?? 'DRIVE'),
            routingPreference: (string) ($input['routing_preference'] ?? 'TRAFFIC_AWARE'),
            departureTime: isset($input['departure_time']) ? (string) $input['departure_time'] : null,
            workerPublicId: isset($input['worker_public_id'])?(string)$input['worker_public_id']:null,
            customerPublicId: isset($input['customer_public_id'])?(string)$input['customer_public_id']:null,
            originReferenceType: isset($input['origin_reference_type'])?(string)$input['origin_reference_type']:null,
            originPublicReferenceId: isset($input['origin_public_reference_id'])?(string)$input['origin_public_reference_id']:null,
            destinationReferenceType: isset($input['destination_reference_type'])?(string)$input['destination_reference_type']:null,
            destinationPublicReferenceId: isset($input['destination_public_reference_id'])?(string)$input['destination_public_reference_id']:null,
        ));
        return ['ok' => true, 'data' => $this->presenter->present($result, $origin, $destination)];
    }
}
