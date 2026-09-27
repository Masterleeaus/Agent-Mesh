<?php

declare(strict_types=1);
use Illuminate\Database\Migrations\Migration;
use App\Extensions\TitanMapsIntelligence\System\Navigation\MapsMenuInstaller;
return new class extends Migration {
    public function up(): void { MapsMenuInstaller::sync(); }
    public function down(): void { /* Forward-safe navigation sync. */ }
};
