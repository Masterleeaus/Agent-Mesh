<?php
declare(strict_types=1);
namespace App\Extensions\TitanVisualRuntime\System\Contracts;
final readonly class VisualEnvironment
{
    public function __construct(
        public string $surface,
        public string $deviceClass='unknown',
        public int $width=0,
        public float $devicePixelRatio=1.0,
        public bool $webgl=false,
        public bool $canvas=true,
        public bool $lowPower=false,
        public string $connectivity='unknown',
        public ?int $memoryMb=null,
        public ?string $gpuTier=null,
        public ?int $companyId=null
    ) {
        if($companyId!==null && $companyId<1) throw new \InvalidArgumentException('Invalid company_id.');
    }
}
