<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\System\Navigation;

final class MapsMenuDefinition
{
    /**
     * Company navigation is intentionally split into several operational parents.
     * Every route is a Laravel named route; never persist literal dashboard URLs.
     *
     * @return array<int,array<string,mixed>>
     */
    public static function user(): array
    {
        return [
            [
                'key' => 'titan_maps_field_operations',
                'label' => 'Field Operations',
                'route' => 'dashboard.user.titan-maps-intelligence.field.index',
                'order' => 31,
                'icon' => 'tabler-briefcase',
                'children' => [
                    ['key'=>'titan_maps_field_overview','label'=>'Live Map','route'=>'dashboard.user.titan-maps-intelligence.field.index','icon'=>'tabler-layout-dashboard'],
                    ['key'=>'titan_maps_field_locations','label'=>'Locations','route'=>'dashboard.user.titan-maps-intelligence.field.locations','icon'=>'tabler-world'],
                    ['key'=>'titan_maps_field_team','label'=>'Team Map','route'=>'dashboard.user.titan-maps-intelligence.field.team','icon'=>'tabler-users'],
                    ['key'=>'titan_maps_field_dispatch','label'=>'Dispatch Intelligence','route'=>'dashboard.user.titan-maps-intelligence.field.dispatch','icon'=>'tabler-directions'],
                    ['key'=>'titan_maps_field_resource_fallback','label'=>'Resource Fallback','route'=>'dashboard.user.titan-maps-intelligence.field.resource-fallback','icon'=>'tabler-building'],
                    ['key'=>'titan_maps_field_geofences','label'=>'Geofences','route'=>'dashboard.user.titan-maps-intelligence.field.geofences','icon'=>'tabler-world'],
                    ['key'=>'titan_maps_field_checkins','label'=>'Check-ins','route'=>'dashboard.user.titan-maps-intelligence.field.checkins','icon'=>'tabler-checklist'],
                ],
            ],
            [
                'key' => 'titan_maps_location_intelligence',
                'label' => 'Location Intelligence',
                'route' => 'dashboard.user.titan-maps-intelligence.location.index',
                'order' => 32,
                'icon' => 'tabler-world',
                'children' => [
                    ['key'=>'titan_maps_location_overview','label'=>'Overview','route'=>'dashboard.user.titan-maps-intelligence.location.index','icon'=>'tabler-layout-dashboard'],
                    ['key'=>'titan_maps_discovery','label'=>'Business Discovery','route'=>'dashboard.user.titan-maps-intelligence.location.discovery','icon'=>'tabler-world'],
                    ['key'=>'titan_maps_candidates','label'=>'Candidates','route'=>'dashboard.user.titan-maps-intelligence.location.candidates','icon'=>'tabler-checklist'],
                    ['key'=>'titan_maps_suppliers','label'=>'Suppliers','route'=>'dashboard.user.titan-maps-intelligence.location.suppliers','icon'=>'tabler-building'],
                    ['key'=>'titan_maps_contractors','label'=>'Contractors','route'=>'dashboard.user.titan-maps-intelligence.location.contractors','icon'=>'tabler-tool'],
                    ['key'=>'titan_maps_competitors','label'=>'Competitors','route'=>'dashboard.user.titan-maps-intelligence.location.competitors','icon'=>'tabler-building'],
                    ['key'=>'titan_maps_nearby','label'=>'Nearby Services','route'=>'dashboard.user.titan-maps-intelligence.location.nearby','icon'=>'tabler-directions'],
                ],
            ],
            [
                'key' => 'titan_maps_territories',
                'label' => 'Territories and Coverage',
                'route' => 'dashboard.user.titan-maps-intelligence.territories.index',
                'order' => 33,
                'icon' => 'tabler-chart-bar',
                'children' => [
                    ['key'=>'titan_maps_territory_overview','label'=>'Overview','route'=>'dashboard.user.titan-maps-intelligence.territories.index','icon'=>'tabler-layout-dashboard'],
                    ['key'=>'titan_maps_service_areas','label'=>'Service Areas','route'=>'dashboard.user.titan-maps-intelligence.territories.service-areas','icon'=>'tabler-world'],
                    ['key'=>'titan_maps_travel_zones','label'=>'Travel Zones','route'=>'dashboard.user.titan-maps-intelligence.territories.travel-zones','icon'=>'tabler-directions'],
                    ['key'=>'titan_maps_geographic_pricing','label'=>'Geographic Pricing','route'=>'dashboard.user.titan-maps-intelligence.territories.geographic-pricing','icon'=>'tabler-chart-bar'],
                    ['key'=>'titan_maps_territory_analysis','label'=>'Territory Analysis','route'=>'dashboard.user.titan-maps-intelligence.territories.analysis','icon'=>'tabler-chart-bar'],
                    ['key'=>'titan_maps_provider_coverage','label'=>'Provider Coverage','route'=>'dashboard.user.titan-maps-intelligence.territories.providers','icon'=>'tabler-building'],
                    ['key'=>'titan_maps_competitor_density','label'=>'Competitor Density','route'=>'dashboard.user.titan-maps-intelligence.territories.competitors','icon'=>'tabler-chart-bar'],
                    ['key'=>'titan_maps_supplier_coverage','label'=>'Supplier Coverage','route'=>'dashboard.user.titan-maps-intelligence.territories.suppliers','icon'=>'tabler-building'],
                    ['key'=>'titan_maps_service_gaps','label'=>'Service Gaps','route'=>'dashboard.user.titan-maps-intelligence.territories.gaps','icon'=>'tabler-checklist'],
                    ['key'=>'titan_maps_branch_coverage','label'=>'Branch Coverage','route'=>'dashboard.user.titan-maps-intelligence.territories.branch-coverage','icon'=>'tabler-building'],
                    ['key'=>'titan_maps_expansion_opportunities','label'=>'Expansion Opportunities','route'=>'dashboard.user.titan-maps-intelligence.territories.expansion-opportunities','icon'=>'tabler-chart-bar'],
                ],
            ],
            [
                'key' => 'titan_maps_travel_routing',
                'label' => 'Travel and Routing',
                'route' => 'dashboard.user.titan-maps-intelligence.travel.index',
                'order' => 34,
                'icon' => 'tabler-directions',
                'children' => [
                    ['key'=>'titan_maps_travel_overview','label'=>'Overview','route'=>'dashboard.user.titan-maps-intelligence.travel.index','icon'=>'tabler-layout-dashboard'],
                    ['key'=>'titan_maps_route_calculator','label'=>'Route Calculator','route'=>'dashboard.user.titan-maps-intelligence.travel.route','icon'=>'tabler-directions'],
                    ['key'=>'titan_maps_travel_matrix','label'=>'Travel Matrix','route'=>'dashboard.user.titan-maps-intelligence.travel.matrix','icon'=>'tabler-category'],
                    ['key'=>'titan_maps_route_planner','label'=>'Route Planner','route'=>'dashboard.user.titan-maps-intelligence.travel.planner','icon'=>'tabler-directions'],
                    ['key'=>'titan_maps_traffic_eta','label'=>'Traffic and ETA','route'=>'dashboard.user.titan-maps-intelligence.travel.traffic','icon'=>'tabler-calendar'],
                ],
            ],
            [
                'key' => 'titan_maps_settings',
                'label' => 'Maps and Location',
                'route' => 'dashboard.user.titan-maps-intelligence.settings.index',
                'order' => 35,
                'icon' => 'tabler-settings',
                'children' => [
                    ['key'=>'titan_maps_settings_overview','label'=>'Overview','route'=>'dashboard.user.titan-maps-intelligence.settings.index','icon'=>'tabler-layout-dashboard'],
                    ['key'=>'titan_maps_settings_providers','label'=>'Providers','route'=>'dashboard.user.titan-maps-intelligence.settings.providers','icon'=>'tabler-plug-connected'],
                    ['key'=>'titan_maps_settings_routing','label'=>'Routing','route'=>'dashboard.user.titan-maps-intelligence.settings.routing','icon'=>'tabler-directions'],
                    ['key'=>'titan_maps_settings_tracking','label'=>'Location Tracking','route'=>'dashboard.user.titan-maps-intelligence.settings.tracking','icon'=>'tabler-world'],
                    ['key'=>'titan_maps_settings_privacy','label'=>'Privacy and Retention','route'=>'dashboard.user.titan-maps-intelligence.settings.privacy','icon'=>'tabler-shield-lock'],
                    ['key'=>'titan_maps_settings_usage','label'=>'Usage and Limits','route'=>'dashboard.user.titan-maps-intelligence.settings.usage','icon'=>'tabler-chart-bar'],
                ],
            ],
        ];
    }

    /** @return array<int,array<string,mixed>> */
    public static function admin(): array
    {
        return [[
            'key' => 'titan_maps_admin',
            'label' => 'Titan Maps Intelligence',
            'route' => 'dashboard.admin.titan-maps-intelligence.navigation.index',
            'order' => 70,
            'icon' => 'tabler-world',
            'children' => [
                ['key'=>'titan_maps_admin_overview','label'=>'Dashboard','route'=>'dashboard.admin.titan-maps-intelligence.navigation.index','icon'=>'tabler-layout-dashboard'],
                ['key'=>'titan_maps_admin_providers','label'=>'Provider Health','route'=>'dashboard.admin.titan-maps-intelligence.navigation.providers','icon'=>'tabler-plug-connected'],
                ['key'=>'titan_maps_admin_usage','label'=>'API Usage','route'=>'dashboard.admin.titan-maps-intelligence.navigation.usage','icon'=>'tabler-chart-bar'],
                ['key'=>'titan_maps_admin_diagnostics','label'=>'Diagnostics','route'=>'dashboard.admin.titan-maps-intelligence.navigation.diagnostics','icon'=>'tabler-tool'],
            ],
        ]];
    }

    /** @return array<int,string> */
    public static function userKeys(): array
    {
        return self::keys(self::user());
    }

    /** @return array<int,string> */
    public static function adminKeys(): array
    {
        return self::keys(self::admin());
    }

    /** @param array<int,array<string,mixed>> $definition @return array<int,string> */
    private static function keys(array $definition): array
    {
        $keys = [];
        foreach ($definition as $root) {
            $keys[] = (string) $root['key'];
            foreach ($root['children'] ?? [] as $child) {
                $keys[] = (string) $child['key'];
            }
        }
        return array_values(array_unique($keys));
    }
}
