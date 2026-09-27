<?php

declare(strict_types=1);

use App\Extensions\TitanMcp\System\Mcp\Support\TitanMcpMenuSynchronizer;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        app(TitanMcpMenuSynchronizer::class)->sync();
    }

    public function down(): void
    {
        // Keep the safer literal labels on rollback; no data or capability state changes.
    }
};
