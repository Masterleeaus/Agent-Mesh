<?php
declare(strict_types=1);
namespace App\Extensions\TitanBuilder\System\Contracts;

final readonly class BuilderContributionProvenance
{
    public string $companyId;

    public function __construct(
        public string $provider,
        public string $contributionId,
        public string $contractVersion='1.0',
        ?string $companyId=null,
        ?string $tenantId=null
    ) {
        if(!preg_match('/^[a-z0-9][a-z0-9._-]{0,127}$/',$provider)) throw new \InvalidArgumentException('Invalid provider.');
        if(!preg_match('/^[a-z0-9][a-z0-9._:-]{0,127}$/',$contributionId)) throw new \InvalidArgumentException('Invalid contribution id.');

        // Compatibility only: legacy tenantId resolves to the sole canonical company_id boundary.
        $resolved=$companyId ?? $tenantId;
        if($resolved===null || !preg_match('/^[A-Za-z0-9._:-]{1,128}$/',$resolved)) {
            throw new \InvalidArgumentException('Valid company_id is required.');
        }
        if($companyId!==null && $tenantId!==null && $companyId!==$tenantId) {
            throw new \InvalidArgumentException('Conflicting company_id and legacy tenantId.');
        }
        $this->companyId=$resolved;
    }

    public function toArray(): array
    {
        return [
            'provider'=>$this->provider,
            'contributionId'=>$this->contributionId,
            'contractVersion'=>$this->contractVersion,
            'company_id'=>$this->companyId,
        ];
    }
}
