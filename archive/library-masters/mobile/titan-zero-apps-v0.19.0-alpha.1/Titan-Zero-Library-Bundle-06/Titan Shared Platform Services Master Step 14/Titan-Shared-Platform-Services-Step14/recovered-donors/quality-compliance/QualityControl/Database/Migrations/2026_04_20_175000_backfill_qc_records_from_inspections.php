<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (!Schema::hasTable('inspections') || !Schema::hasTable('qc_records')) {
            return;
        }

        DB::table('inspections')
            ->orderBy('id')
            ->chunkById(200, function ($inspections) {
                foreach ($inspections as $inspection) {
                    $recordId = $this->upsertRecord($inspection);
                    $this->upsertItems((int) $recordId, $inspection);
                }
            });
    }

    public function down(): void
    {
        // Data backfill migration is intentionally non-destructive.
    }

    private function upsertRecord(object $inspection): int
    {
        $existing = DB::table('qc_records')
            ->where('legacy_inspection_id', $inspection->id)
            ->first();

        $data = [
            'company_id' => $inspection->company_id,
            'legacy_inspection_id' => $inspection->id,
            'booking_id' => is_null($inspection->booking_id) ? null : (string) $inspection->booking_id,
            'cleaner_id' => $inspection->inspector_id,
            'template_id' => $inspection->template_id,
            'status' => $this->mapStatus((string) $inspection->status),
            'overall_score' => $this->mapOverallScore($inspection->score),
            'notes' => $inspection->notes,
            'inspected_by' => $inspection->inspector_id,
            'inspected_at' => $inspection->inspected_at,
            'approved_at' => $inspection->approved_at,
            'approved_by' => $inspection->approved_by,
            'reclean_booking_id' => $inspection->reclean_booking_id,
            'reclean_triggered' => ((string) $inspection->status) === 'reclean_booked',
            'reclean_triggered_at' => ((string) $inspection->status) === 'reclean_booked' ? now() : null,
            'created_at' => $inspection->created_at ?? now(),
            'updated_at' => $inspection->updated_at ?? now(),
        ];

        if ($existing) {
            DB::table('qc_records')
                ->where('id', $existing->id)
                ->update($data);

            return (int) $existing->id;
        }

        return (int) DB::table('qc_records')->insertGetId($data);
    }

    private function upsertItems(int $recordId, object $inspection): void
    {
        if (!Schema::hasTable('inspection_items') || !Schema::hasTable('qc_record_items')) {
            return;
        }

        $items = DB::table('inspection_items')
            ->where('inspection_id', $inspection->id)
            ->orderBy('id')
            ->get();

        foreach ($items as $item) {
            $payload = [
                'company_id' => $inspection->company_id,
                'record_id' => $recordId,
                'legacy_item_id' => $item->id,
                'item_label' => $item->area,
                'score' => $item->passed ? 100 : 0,
                'weight' => 0,
                'notes' => $item->notes,
                'photo' => $item->photo_path,
                'created_at' => $item->created_at ?? now(),
                'updated_at' => $item->updated_at ?? now(),
            ];

            $existingItem = DB::table('qc_record_items')->where('legacy_item_id', $item->id)->first();

            if ($existingItem) {
                DB::table('qc_record_items')
                    ->where('id', $existingItem->id)
                    ->update($payload);
            } else {
                DB::table('qc_record_items')->insert($payload);
            }
        }
    }

    private function mapStatus(string $status): string
    {
        return match ($status) {
            'passed' => 'pass',
            'failed' => 'fail',
            'reclean_booked' => 'reclean_required',
            default => 'pending',
        };
    }

    private function mapOverallScore($score): int
    {
        if (is_null($score)) {
            return 0;
        }

        $value = (float) $score;

        if ($value <= 10) {
            $value *= 10;
        }

        return (int) max(0, min(100, round($value)));
    }
};

