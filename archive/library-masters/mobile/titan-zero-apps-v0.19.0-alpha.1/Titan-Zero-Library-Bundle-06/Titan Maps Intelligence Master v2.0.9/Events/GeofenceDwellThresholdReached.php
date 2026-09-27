<?php
declare(strict_types=1);
namespace App\Extensions\TitanMapsIntelligence\Events;
use App\Extensions\TitanMapsIntelligence\Models\MapGeofenceEvent;
final readonly class GeofenceDwellThresholdReached { public function __construct(public MapGeofenceEvent $event) {} }
