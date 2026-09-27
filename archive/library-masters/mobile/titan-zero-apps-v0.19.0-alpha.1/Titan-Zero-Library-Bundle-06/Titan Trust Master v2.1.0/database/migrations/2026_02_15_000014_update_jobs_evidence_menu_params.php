<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::transaction(function () {
            $now = now();

            // Tools/Media -> Work Gallery should open the same page but in "work-gallery" context
            DB::table('menus')
                ->where('key', 'tools_work_gallery')
                ->update([
                    'params' => json_encode(['context' => 'work-gallery']),
                    'updated_at' => $now,
                ]);

            // Jobs -> Evidence should default to job context (no special params needed)
        });
    }

    public function down(): void
    {
        DB::transaction(function () {
            $now = now();

            DB::table('menus')
                ->where('key', 'tools_work_gallery')
                ->update([
                    'params' => '[]',
                    'updated_at' => $now,
                ]);
        });
    }
};
