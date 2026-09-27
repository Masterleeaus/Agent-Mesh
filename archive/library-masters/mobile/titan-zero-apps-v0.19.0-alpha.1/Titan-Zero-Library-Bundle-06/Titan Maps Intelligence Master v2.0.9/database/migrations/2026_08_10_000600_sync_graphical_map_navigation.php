<?php

declare(strict_types=1);

use App\Extensions\TitanMapsIntelligence\System\Navigation\MapsMenuInstaller;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        MapsMenuInstaller::sync();
    }

    public function down(): void
    {
        // Forward-only menu synchronization. Uninstall deactivates extension-owned rows.
    }
};
