<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Engines\BusinessIntelligence\Implementations;

use App\Extensions\InteractionEngine\System\Engines\BusinessIntelligence\Contracts\BusinessBuilderEngineInterface;

final class BusinessBuilderEngine implements BusinessBuilderEngineInterface
{
    /** @var array<string,array<string,mixed>> */
    private array $launched = [];

    /** @var array<string,array<int,string>> */
    private const SERVICES = [
        'cleaning' => ['standard_clean', 'deep_clean', 'end_of_lease_clean'],
        'plumbing' => ['general_plumbing', 'blocked_drain', 'emergency_plumbing'],
        'electrical' => ['electrical_service', 'fault_callout', 'safety_inspection'],
        'hvac' => ['hvac_service', 'hvac_repair', 'hvac_maintenance'],
        'landscaping' => ['garden_maintenance', 'lawn_service', 'landscape_project'],
        'pest_control' => ['pest_inspection', 'pest_treatment', 'pest_follow_up'],
        'roofing' => ['roof_inspection', 'roof_repair', 'gutter_service'],
        'handyman' => ['general_maintenance', 'minor_repair', 'property_make_good'],
        'locksmith' => ['lock_service', 'lockout_callout', 'security_rekey'],
        'appliance_repair' => ['appliance_diagnosis', 'appliance_repair', 'appliance_maintenance'],
        'solar' => ['solar_inspection', 'solar_maintenance', 'solar_repair'],
        'pool_spa' => ['pool_service', 'water_test', 'equipment_repair'],
        'pressure_washing' => ['pressure_wash', 'surface_treatment', 'exterior_clean'],
        'field_technician' => ['field_inspection', 'field_repair', 'preventive_maintenance'],
        'builder' => ['site_visit', 'renovation_work', 'defect_rectification'],
    ];

    public function generate(string $vertical): array
    {
        $key = strtolower(trim($vertical));
        $key = str_replace([' ', '-', '&'], ['_', '_', 'and'], $key);
        if (!isset(self::SERVICES[$key])) {
            throw new \InvalidArgumentException("Unsupported field/home-services business type: {$vertical}");
        }

        return [
            'profile' => 'field_home_services',
            'business_type' => $key,
            'name' => ucwords(str_replace('_', ' ', $key)),
            'services' => self::SERVICES[$key],
            'pricing' => [
                'supported_models' => ['fixed', 'hourly', 'unit', 'quote'],
                'requires_business_confirmation' => true,
            ],
            'workflow' => ['enquiry', 'quote_or_booking', 'schedule', 'dispatch', 'perform', 'evidence', 'complete', 'invoice'],
            'generated_at' => gmdate(DATE_ATOM),
        ];
    }

    public function customize(array $parameters): array
    {
        $vertical = (string) ($parameters['business_type'] ?? $parameters['vertical'] ?? '');
        if ($vertical === '') {
            throw new \InvalidArgumentException('Business builder customization requires business_type.');
        }
        $base = $this->generate($vertical);
        unset($parameters['vertical']);
        return array_replace_recursive($base, $parameters);
    }

    public function launch(string $vertical): void
    {
        $blueprint = $this->generate($vertical);
        $blueprint['launch_state'] = 'prepared';
        $blueprint['launched_at'] = gmdate(DATE_ATOM);
        $this->launched[$blueprint['business_type']] = $blueprint;
    }
}
