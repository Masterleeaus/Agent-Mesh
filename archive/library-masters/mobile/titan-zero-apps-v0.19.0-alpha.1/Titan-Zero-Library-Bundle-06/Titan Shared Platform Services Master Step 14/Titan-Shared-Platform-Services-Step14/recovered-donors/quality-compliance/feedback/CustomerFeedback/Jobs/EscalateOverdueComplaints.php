<?php

declare(strict_types=1);

namespace Modules\CustomerFeedback\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Modules\CustomerFeedback\Entities\FeedbackTicket;
use Modules\CustomerFeedback\Events\ComplaintEscalated;
use Modules\TitanZeroAssurance\Services\ExecutionContextStore;
use Modules\TitanZeroAssurance\ValueObjects\CompanyExecutionContext;

final class EscalateOverdueComplaints implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public function __construct(public readonly int $companyId) {}

    public function handle(): void
    {
        if ($this->companyId <= 0) throw new \InvalidArgumentException('company_id must be positive.');
        $run = function (): void {
            FeedbackTicket::withoutGlobalScopes()
                ->where('company_id', $this->companyId)
                ->where('feedback_type', FeedbackTicket::TYPE_COMPLAINT)
                ->whereNotIn('status', [FeedbackTicket::STATUS_RESOLVED, FeedbackTicket::STATUS_CLOSED])
                ->whereNull('escalated_at')
                ->whereNotNull('sla_due_at')
                ->where('sla_due_at', '<=', now())
                ->orderBy('id')
                ->chunkById(100, function ($tickets): void {
                    foreach ($tickets as $ticket) {
                        $ticket->status = FeedbackTicket::STATUS_PENDING;
                        $ticket->priority = FeedbackTicket::PRIORITY_HIGH;
                        $ticket->escalated_at = now();
                        $ticket->escalation_reason = 'SLA overdue';
                        $ticket->requires_investigation = true;
                        $ticket->save();
                        ComplaintEscalated::dispatch($ticket, 'SLA overdue');
                    }
                });
        };

        if (class_exists(ExecutionContextStore::class) && function_exists('app')) {
            app(ExecutionContextStore::class)->runWith(new CompanyExecutionContext($this->companyId, 'system', 'customer-feedback-sla'), $run);
            return;
        }
        $run();
    }
}
