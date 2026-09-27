<?php

namespace Modules\QualityControl\Domain\Quality\DTOs;

final class InspectionScheduleData
{
    public function __construct(
        public readonly ?int $companyId = null,
        public readonly ?string $subject = null,
        public readonly ?string $issueDate = null,
        public readonly ?int $workerId = null,
        public readonly ?int $agentId = null,
        public readonly ?int $complaintId = null,
        public readonly ?string $qcOutcome = null,
    ) {
    }

    public static function fromArray(array $data): self
    {
        return new self(
            companyId: isset($data['company_id']) ? (int) $data['company_id'] : null,
            subject: isset($data['subject']) ? (string) $data['subject'] : null,
            issueDate: isset($data['issue_date']) ? (string) $data['issue_date'] : null,
            workerId: isset($data['worker_id']) ? (int) $data['worker_id'] : null,
            agentId: isset($data['agent_id']) ? (int) $data['agent_id'] : null,
            complaintId: isset($data['complaint_id']) ? (int) $data['complaint_id'] : null,
            qcOutcome: isset($data['qc_outcome']) ? (string) $data['qc_outcome'] : null,
        );
    }

    public function toArray(): array
    {
        return [
            'company_id' => $this->companyId,
            'subject' => $this->subject,
            'issue_date' => $this->issueDate,
            'worker_id' => $this->workerId,
            'agent_id' => $this->agentId,
            'complaint_id' => $this->complaintId,
            'qc_outcome' => $this->qcOutcome,
        ];
    }
}
