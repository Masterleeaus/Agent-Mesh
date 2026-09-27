<?php

declare(strict_types=1);

namespace App\Extensions\TitanBuilder\System\Migration;

/**
 * Compatibility-only v0.7 normaliser. It is not a dependency on the retired system.
 * Deterministic action/read-model mappings are applied; ambiguous mappings are removed
 * and recorded for human migration review.
 */
final class LegacyBusinessSpecMigrator
{
    private const ACTION_MAP = [
        'workcore.customers.create' => 'crm.customer.create',
        'workcore.jobs.create' => 'crm.work_order.create',
        'workcore.jobs.assign' => 'crm.work_order.assign',
        'workcore.tasks.complete' => 'crm.work_order.task.complete',
    ];
    private const AMBIGUOUS_ACTIONS = ['workcore.properties.create', 'workcore.inventory.reserve'];
    private const READ_MODEL_MAP = [
        'jobs.assigned' => 'crm.field.assigned-work',
        'tasks.assigned' => 'crm.field.tasks',
        'customer.minimum' => 'crm.field.minimum-customer-context',
        'site.minimum' => 'crm.field.minimum-site-context',
        'jobs.customer' => 'crm.customer.work-orders',
        'quotes.customer' => 'crm.customer.quotes',
        'invoices.customer' => 'crm.customer.invoices',
        'operations.summary' => 'crm.owner.operations-summary',
        'schedule.capacity' => 'crm.owner.schedule-capacity',
        'approvals.pending' => 'crm.owner.approvals',
        'finance.summary' => 'crm.owner.finance-summary',
    ];

    /** @return array{value:array,review:list<string>} */
    public function migrate(array $value): array
    {
        $review = [];
        $migrated = $this->walk($value, $review);
        if ($review !== []) {
            $migrated['meta'] = is_array($migrated['meta'] ?? null) ? $migrated['meta'] : [];
            $migrated['meta']['migration_review_required'] = true;
            $migrated['meta']['migration_review'] = array_values(array_unique($review));
        }
        return ['value' => $migrated, 'review' => array_values(array_unique($review))];
    }

    private function walk(mixed $value, array &$review): mixed
    {
        if (is_string($value)) {
            if (isset(self::ACTION_MAP[$value])) { return self::ACTION_MAP[$value]; }
            if (isset(self::READ_MODEL_MAP[$value])) { return self::READ_MODEL_MAP[$value]; }
            if (in_array($value, self::AMBIGUOUS_ACTIONS, true)) {
                $review[] = 'Ambiguous legacy action requires capability review: '.$value;
                return null;
            }
            return $value;
        }
        if (is_array($value)) {
            if (! array_is_list($value)) {
                foreach (['action','intent','action_intent'] as $key) {
                    if (isset($value[$key]) && is_string($value[$key]) && in_array($value[$key], self::AMBIGUOUS_ACTIONS, true)) {
                        $review[] = 'Removed ambiguous legacy action binding: '.$value[$key];
                        return null;
                    }
                }
            }
            $out = [];
            foreach ($value as $key => $child) {
                if ($key === 'workcore') {
                    $review[] = 'Legacy template business section requires schema migration review.';
                    continue;
                }
                if ($key === 'workcore_domains') {
                    $review[] = 'Legacy vertical domain list removed; CRM capabilities must be discovered.';
                    continue;
                }
                $next = $this->walk($child, $review);
                if ($next !== null) { $out[$key] = $next; }
            }
            return $out;
        }
        return $value;
    }
}
