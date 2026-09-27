<?php

declare(strict_types=1);

namespace Modules\CustomerFeedback\Actions;

use Modules\CustomerFeedback\Entities\FeedbackTicket;
use Modules\CustomerFeedback\Events\FeedbackTicketCreated;

final class IngestReviewAction
{
    /** @param array<string,mixed> $data */
    public function execute(array $data): FeedbackTicket
    {
        $companyId = (int) ($data['company_id'] ?? 0);
        $userId = (int) ($data['user_id'] ?? 0);
        $rating = (int) ($data['rating'] ?? 0);
        if ($companyId <= 0 || $userId <= 0 || $rating < 1 || $rating > 5) {
            throw new \InvalidArgumentException('company_id, user_id and a rating from 1 to 5 are required.');
        }

        $ticket = new FeedbackTicket();
        $ticket->company_id = $companyId;
        $ticket->user_id = $userId;
        $ticket->title = trim((string) ($data['title'] ?? ('Customer review (' . $rating . '/5)')));
        $ticket->description = trim((string) ($data['review'] ?? $data['description'] ?? 'Rating submitted without written review.'));
        $ticket->feedback_type = $rating <= 2 ? FeedbackTicket::TYPE_COMPLAINT : FeedbackTicket::TYPE_FEEDBACK;
        $ticket->status = FeedbackTicket::STATUS_OPEN;
        $ticket->priority = $rating <= 2 ? FeedbackTicket::PRIORITY_HIGH : FeedbackTicket::PRIORITY_LOW;
        $ticket->custom_meta = [
            'source_kind' => 'review',
            'rating' => $rating,
            'source' => (string) ($data['source'] ?? 'customer'),
            'external_review_id' => $data['external_review_id'] ?? null,
        ];
        $ticket->save();
        FeedbackTicketCreated::dispatch($ticket);
        return $ticket;
    }
}
