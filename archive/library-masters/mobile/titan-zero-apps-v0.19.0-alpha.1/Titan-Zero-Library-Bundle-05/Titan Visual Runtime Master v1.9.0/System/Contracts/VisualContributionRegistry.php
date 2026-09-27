<?php
declare(strict_types=1);
namespace App\Extensions\TitanVisualRuntime\System\Contracts;

interface VisualContributionRegistry
{
    public function register(array $contribution): void;
    public function registerSource(VisualContributionSource $source): void;
    public function resolve(string $id,string $surface,?string $companyId=null): ?array;
    public function all(?string $companyId=null): array;
}
