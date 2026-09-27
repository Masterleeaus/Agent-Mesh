<?php

declare(strict_types=1);

return [
    'module' => 'customer_feedback',
    'capabilities' => [
        ['key' => 'feedback.ticket.inspect', 'label' => 'Feedback: Inspect ticket', 'risk' => 'low', 'requires' => ['view_feedback'], 'handler' => 'feedback.ticket.inspect'],
        ['key' => 'feedback.complaint.create', 'label' => 'Feedback: Create complaint', 'risk' => 'low', 'requires' => ['add_feedback'], 'handler' => 'feedback.complaint.create'],
        ['key' => 'feedback.complaint.escalate', 'label' => 'Feedback: Escalate complaint', 'risk' => 'medium', 'requires' => ['edit_feedback'], 'handler' => 'feedback.complaint.escalate'],
        ['key' => 'feedback.complaint.resolve', 'label' => 'Feedback: Resolve complaint', 'risk' => 'medium', 'requires' => ['edit_feedback'], 'handler' => 'feedback.complaint.resolve'],
        ['key' => 'feedback.complaint.analyse', 'label' => 'Feedback: Analyse complaint', 'risk' => 'low', 'requires' => ['view_feedback'], 'handler' => 'feedback.complaint.analyse'],
        ['key' => 'feedback.complaint.draft_response', 'label' => 'Feedback: Draft complaint response', 'risk' => 'low', 'requires' => ['view_feedback'], 'handler' => 'feedback.complaint.draft_response'],
        ['key' => 'feedback.corrective_work.request', 'label' => 'Feedback: Request corrective work', 'risk' => 'medium', 'requires' => ['edit_feedback'], 'handler' => 'feedback.corrective_work.request'],
        ['key' => 'feedback.reclean.request', 'label' => 'Feedback: Request re-clean', 'risk' => 'medium', 'requires' => ['edit_feedback'], 'handler' => 'feedback.reclean.request'],
        ['key' => 'feedback.review.ingest', 'label' => 'Feedback: Ingest customer review', 'risk' => 'low', 'requires' => ['add_feedback'], 'handler' => 'feedback.review.ingest'],
        ['key' => 'feedback.nps.inspect', 'label' => 'Feedback: Inspect NPS', 'risk' => 'low', 'requires' => ['view_feedback'], 'handler' => 'feedback.nps.inspect'],
        ['key' => 'feedback.csat.inspect', 'label' => 'Feedback: Inspect CSAT', 'risk' => 'low', 'requires' => ['view_feedback'], 'handler' => 'feedback.csat.inspect'],
        ['key' => 'feedback.insights.generate', 'label' => 'Feedback: Generate insights', 'risk' => 'low', 'requires' => ['view_feedback'], 'handler' => 'feedback.insights.generate'],
        ['key' => 'feedback.complaint.sla.inspect', 'label' => 'Feedback: Inspect complaint SLA', 'risk' => 'low', 'requires' => ['view_feedback'], 'handler' => 'feedback.complaint.sla.inspect'],
    ],
    'zero_enabled' => true,
    'hub_enabled' => true,
    'go_enabled' => false,
];
