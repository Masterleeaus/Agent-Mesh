<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\DTO;

final readonly class DispatchJobContext
{
    /** @param array<int,string> $requiredSkills @param array<int,string> $requiredCertifications @param array<string,mixed> $metadata */
    public function __construct(
        public string $publicId,
        public string $title,
        public string $priority = 'normal',
        public ?string $scheduledStart = null,
        public ?string $scheduledEnd = null,
        public ?string $servicePublicId = null,
        public ?string $locationPublicId = null,
        public ?string $companyPublicId = null,
        public ?string $contactPublicId = null,
        public array $requiredSkills = [],
        public array $requiredCertifications = [],
        public array $metadata = [],
    ) {}

    /** @return array<string,mixed> */
    public function toArray(): array
    {
        return [
            'public_id'=>$this->publicId,'title'=>$this->title,'priority'=>$this->priority,
            'scheduled_start'=>$this->scheduledStart,'scheduled_end'=>$this->scheduledEnd,
            'service_public_id'=>$this->servicePublicId,'location_public_id'=>$this->locationPublicId,
            'company_public_id'=>$this->companyPublicId,'contact_public_id'=>$this->contactPublicId,
            'required_skills'=>$this->requiredSkills,'required_certifications'=>$this->requiredCertifications,
            'metadata'=>$this->metadata,
        ];
    }
}
