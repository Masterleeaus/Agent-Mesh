<?php

declare(strict_types=1);

namespace Modules\CustomerFeedback\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Modules\CustomerFeedback\Entities\FeedbackTicket;
use Modules\CustomerFeedback\Services\FeedbackAiService;
use Modules\TitanZeroAssurance\Services\ExecutionContextStore;
use Modules\TitanZeroAssurance\ValueObjects\CompanyExecutionContext;

final class AnalyzeFeedbackTicket implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public function __construct(public readonly int $feedbackTicketId, public readonly int $companyId) {}

    public function handle(FeedbackAiService $ai): void
    {
        $callback = function () use ($ai): void {
            $ticket = FeedbackTicket::withoutGlobalScopes()
                ->where('company_id', $this->companyId)
                ->find($this->feedbackTicketId);
            if ($ticket) {
                $ai->analyzeTicket($ticket);
            }
        };

        if (class_exists(ExecutionContextStore::class) && function_exists('app')) {
            $store = app(ExecutionContextStore::class);
            $store->runWith(new CompanyExecutionContext($this->companyId, 'system', 'customer-feedback-ai'), $callback);
            return;
        }
        $callback();
    }
}
