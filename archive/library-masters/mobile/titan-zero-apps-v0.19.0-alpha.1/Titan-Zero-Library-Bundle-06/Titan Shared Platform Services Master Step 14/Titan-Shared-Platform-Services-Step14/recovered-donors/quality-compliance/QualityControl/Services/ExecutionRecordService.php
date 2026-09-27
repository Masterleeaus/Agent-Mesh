<?php

namespace Modules\QualityControl\Services;

use App\Models\User;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Facades\DB;
use Modules\QualityControl\Entities\QcRecord;
use Modules\QualityControl\Entities\QcRecordItem;

class ExecutionRecordService
{
    public function listForCompany(int $companyId, array $filters = [])
    {
        return QcRecord::query()
            ->where('company_id', $companyId)
            ->when(!empty($filters['property_id']), fn ($q) => $q->where('property_id', (int) $filters['property_id']))
            ->when(!empty($filters['unit_id']), fn ($q) => $q->where('unit_id', (int) $filters['unit_id']))
            ->when(!empty($filters['room_id']), fn ($q) => $q->where('room_id', (int) $filters['room_id']))
            ->when(!empty($filters['visit_id']), fn ($q) => $q->where('visit_id', (int) $filters['visit_id']))
            ->with(['cleaner', 'template'])
            ->latest();
    }

    public function findForTenant(int $id, int $companyId): QcRecord
    {
        $record = QcRecord::with(['items', 'cleaner', 'template', 'inspector'])->where('company_id', $companyId)->findOrFail($id);

        return $record;
    }

    public function findByLegacyInspectionIdOrId(int $id, int $companyId): ?QcRecord
    {
        return QcRecord::query()
            ->where('company_id', $companyId)
            ->where(function ($q) use ($id) {
                $q->where('id', $id);

                if ($this->hasColumn('qc_records', 'legacy_inspection_id')) {
                    $q->orWhere('legacy_inspection_id', $id);
                }

                if ($this->hasColumn('qc_records', 'legacy_pm_property_inspection_id')) {
                    $q->orWhere('legacy_pm_property_inspection_id', $id);
                }
            })
            ->first();
    }

    public function create(array $validated, User $actor): QcRecord
    {
        if ((int) ($actor->company_id ?? 0) <= 0) { throw new \LogicException('QualityControl requires company_id context.'); }
        return DB::transaction(function () use ($validated, $actor) {
            $record = QcRecord::create([
                'company_id' => (int) $actor->company_id,
                'booking_id' => $validated['booking_id'] ?? null,
                'cleaner_id' => $validated['cleaner_id'] ?? null,
                'template_id' => $validated['template_id'] ?? null,
                'schedule_id' => $validated['schedule_id'] ?? null,
                'property_id' => $validated['property_id'] ?? null,
                'unit_id' => $validated['unit_id'] ?? null,
                'room_id' => $validated['room_id'] ?? null,
                'visit_id' => $validated['visit_id'] ?? null,
                'status' => 'pending',
                'overall_score' => 0,
                'notes' => $validated['notes'] ?? null,
                'inspected_by' => $actor->id,
                'inspected_at' => $validated['inspected_at'] ?? now(),
            ]);

            foreach ($validated['items'] ?? [] as $item) {
                QcRecordItem::create([
                    'company_id' => $record->company_id,
                    'record_id' => $record->id,
                    'item_label' => $item['item_label'],
                    'score' => (int) $item['score'],
                    'weight' => (int) ($item['weight'] ?? 0),
                    'notes' => $item['notes'] ?? null,
                ]);
            }

            $record->recalculateScore();

            return $record->fresh(['items', 'template']);
        });
    }

    public function update(int $id, array $validated, ?int $companyId): QcRecord
    {
        return DB::transaction(function () use ($id, $validated, $companyId) {
            $record = $this->findForTenant($id, $companyId);

            $record->fill([
                'booking_id' => $validated['booking_id'] ?? $record->booking_id,
                'cleaner_id' => $validated['cleaner_id'] ?? $record->cleaner_id,
                'template_id' => $validated['template_id'] ?? $record->template_id,
                'schedule_id' => $validated['schedule_id'] ?? $record->schedule_id,
                'property_id' => $validated['property_id'] ?? $record->property_id,
                'unit_id' => $validated['unit_id'] ?? $record->unit_id,
                'room_id' => $validated['room_id'] ?? $record->room_id,
                'visit_id' => $validated['visit_id'] ?? $record->visit_id,
                'notes' => $validated['notes'] ?? $record->notes,
                'inspected_at' => $validated['inspected_at'] ?? $record->inspected_at,
            ]);
            $record->save();

            if (array_key_exists('items', $validated) && is_array($validated['items'])) {
                $record->items()->delete();

                foreach ($validated['items'] as $item) {
                    QcRecordItem::create([
                        'company_id' => $record->company_id,
                        'record_id' => $record->id,
                        'item_label' => $item['item_label'],
                        'score' => (int) $item['score'],
                        'weight' => (int) ($item['weight'] ?? 0),
                        'notes' => $item['notes'] ?? null,
                    ]);
                }
            }

            $record->recalculateScore();

            return $record->fresh(['items', 'template']);
        });
    }

    public function delete(int $id, int $companyId): void
    {
        $record = $this->findForTenant($id, $companyId);
        $record->delete();
    }

    public function markApproved(int $id, int $companyId): QcRecord
    {
        $record = $this->findForTenant($id, $companyId);
        $record->status = 'pass';
        $record->save();

        return $record;
    }

    public function markNeedsReclean(int $id, int $companyId): QcRecord
    {
        $record = $this->findForTenant($id, $companyId);
        $record->status = 'reclean_required';
        $record->reclean_triggered = true;
        $record->reclean_triggered_at = now();
        $record->save();

        return $record;
    }

    private function hasColumn(string $table, string $column): bool
    {
        try {
            return \Schema::hasColumn($table, $column);
        } catch (\Throwable) {
            return false;
        }
    }
}
