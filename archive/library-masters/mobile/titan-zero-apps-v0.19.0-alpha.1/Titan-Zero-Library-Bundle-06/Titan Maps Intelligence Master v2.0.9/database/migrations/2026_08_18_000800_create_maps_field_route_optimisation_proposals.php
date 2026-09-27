<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    private const TABLE = 'maps_field_route_optimisation_proposals';

    public function up(): void
    {
        if (! Schema::hasTable(self::TABLE)) {
            Schema::create('maps_field_route_optimisation_proposals', function (Blueprint $t): void {
                $t->uuid('id')->primary();
                $t->string('company_id',64);
                $t->char('field_route_public_id',26);
                $t->char('input_hash',64);
                $t->char('proposal_hash',64);
                $t->json('baseline_stop_public_ids');
                $t->json('proposed_stop_public_ids');
                $t->string('algorithm',80);
                $t->unsignedBigInteger('baseline_distance_metres')->default(0);
                $t->unsignedBigInteger('optimised_distance_metres')->default(0);
                $t->unsignedBigInteger('distance_savings_metres')->default(0);
                $t->unsignedBigInteger('baseline_duration_seconds')->nullable();
                $t->unsignedBigInteger('optimised_duration_seconds')->nullable();
                $t->unsignedBigInteger('duration_savings_seconds')->nullable();
                $t->json('schedule')->nullable();
                $t->json('window_violations')->nullable();
                $t->json('constraints')->nullable();
                $t->json('provenance')->nullable();
                $t->json('warnings')->nullable();
                $t->timestamp('expires_at')->nullable();
                $t->string('created_by_user_id',191)->nullable();
                $t->timestamps();
            });
        }

        // MySQL applies Schema::create() indexes as later ALTER statements. A failed
        // long identifier can therefore leave the table and earlier indexes behind.
        // Repair by indexed column set so retries are safe regardless of old names.
        $this->ensureIndex(['company_id'], 'mfr_op_company_idx');
        $this->ensureIndex(['field_route_public_id'], 'mfr_op_route_idx');
        $this->ensureIndex(['input_hash'], 'mfr_op_input_idx');
        $this->ensureIndex(['proposal_hash'], 'mfr_op_proposal_idx');
        $this->ensureIndex(['expires_at'], 'mfr_op_expires_idx');
        $this->ensureIndex(['company_id','input_hash','proposal_hash'], 'mfr_op_company_input_proposal_uq', true);
        $this->ensureIndex(['company_id','field_route_public_id','created_at'], 'mfr_op_route_created_idx');
    }

    public function down(): void
    {
        // Retained spatial decision evidence. Forward-only for safe extension rollback/reinstall.
    }

    /** @param list<string> $columns */
    private function ensureIndex(array $columns, string $name, bool $unique = false): void
    {
        if ($this->hasIndexForColumns($columns, $unique)) {
            return;
        }

        Schema::table(self::TABLE, function (Blueprint $table) use ($columns, $name, $unique): void {
            if ($unique) {
                $table->unique($columns, $name);
                return;
            }
            $table->index($columns, $name);
        });
    }

    /** @param list<string> $columns */
    private function hasIndexForColumns(array $columns, bool $requireUnique): bool
    {
        $rows = DB::select('SHOW INDEX FROM `'.self::TABLE.'`');
        $indexes = [];
        foreach ($rows as $row) {
            $key = (string) ($row->Key_name ?? '');
            if ($key === '' || $key === 'PRIMARY') {
                continue;
            }
            $indexes[$key]['unique'] = ((int) ($row->Non_unique ?? 1)) === 0;
            $indexes[$key]['columns'][(int) ($row->Seq_in_index ?? 0)] = (string) ($row->Column_name ?? '');
        }

        foreach ($indexes as $index) {
            ksort($index['columns']);
            $actual = array_values($index['columns']);
            if ($actual === $columns && (! $requireUnique || $index['unique'] === true)) {
                return true;
            }
        }
        return false;
    }
};
