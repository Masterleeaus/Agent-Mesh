<?php
declare(strict_types=1);
namespace App\Extensions\TitanVisualRuntime\System\Contracts;

interface VisualContributionSnapshot
{
    public function snapshot(?string $companyId=null): array;
}
