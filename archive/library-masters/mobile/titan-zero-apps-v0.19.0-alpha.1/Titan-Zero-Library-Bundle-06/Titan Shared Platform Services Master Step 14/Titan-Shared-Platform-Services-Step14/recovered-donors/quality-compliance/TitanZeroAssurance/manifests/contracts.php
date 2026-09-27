<?php

declare(strict_types=1);

return [
    'schema' => 'titan.assurance.v1',
    'company_boundary' => 'company_id',
    'contracts' => [
        'company_execution_context' => \Modules\TitanZeroAssurance\ValueObjects\CompanyExecutionContext::class,
        'signal_envelope' => \Modules\TitanZeroAssurance\ValueObjects\SignalEnvelope::class,
        'evidence_ref' => \Modules\TitanZeroAssurance\ValueObjects\EvidenceRef::class,
        'finding' => \Modules\TitanZeroAssurance\ValueObjects\AssuranceFinding::class,
        'work_item_request' => \Modules\TitanZeroAssurance\ValueObjects\WorkItemRequest::class,
        'audit_event' => \Modules\TitanZeroAssurance\ValueObjects\AuditEvent::class,
        'authority_decision' => \Modules\TitanZeroAssurance\ValueObjects\AuthorityDecision::class,
        'capability_definition' => \Modules\TitanZeroAssurance\ValueObjects\CapabilityDefinition::class,
    ],
];
