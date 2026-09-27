<?php
declare(strict_types=1);
namespace App\Extensions\TitanVisualRuntime\System\Contracts;
final readonly class VisualCompanyScope
{
    public function __construct(public int $companyId)
    {
        if($companyId<1) throw new \InvalidArgumentException('Visual company scope requires company_id.');
    }
    public function toArray(): array { return ['company_id'=>$this->companyId,'tenant_boundary'=>'company_id']; }
}
