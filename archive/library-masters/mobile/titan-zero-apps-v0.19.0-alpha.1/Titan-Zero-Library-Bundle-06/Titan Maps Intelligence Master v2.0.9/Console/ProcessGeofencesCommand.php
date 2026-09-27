<?php
declare(strict_types=1);
namespace App\Extensions\TitanMapsIntelligence\Console;
use App\Extensions\TitanMapsIntelligence\Models\MapLocationPing;
use App\Extensions\TitanMapsIntelligence\Services\GeofenceEvaluationService;
use Illuminate\Console\Command;
final class ProcessGeofencesCommand extends Command
{
    protected $signature='titan-maps:process-geofences {--minutes=5} {--limit=5000}';
    protected $description='Server-side reconciliation of raw worker GPS pings into authoritative geofence transitions.';
    public function handle(GeofenceEvaluationService $geofences):int
    {
        $minutes=max(1,min(60,(int)$this->option('minutes')));$limit=max(1,min(50000,(int)$this->option('limit')));$events=0;$pings=0;
        MapLocationPing::query()->where('geofence_eligible',true)->where('captured_at','>=',now()->subMinutes($minutes))->orderBy('captured_at')->limit($limit)->chunkById(500,function($rows)use($geofences,&$events,&$pings){foreach($rows as $ping){$pings++;$events+=count($geofences->evaluate($ping));}});
        $this->info("Processed {$pings} GPS ping(s), producing/reconciling {$events} geofence event(s)."); return self::SUCCESS;
    }
}
