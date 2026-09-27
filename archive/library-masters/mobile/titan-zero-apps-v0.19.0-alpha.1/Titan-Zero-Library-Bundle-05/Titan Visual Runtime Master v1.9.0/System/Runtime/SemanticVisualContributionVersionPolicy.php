<?php
declare(strict_types=1);
namespace App\Extensions\TitanVisualRuntime\System\Runtime;
use App\Extensions\TitanVisualRuntime\System\Contracts\VisualContributionVersionPolicy;
final class SemanticVisualContributionVersionPolicy implements VisualContributionVersionPolicy
{
    public function compare(string $incoming,string $existing): int {
        $this->assertCompatible($incoming); $this->assertCompatible($existing);
        return version_compare($incoming,$existing);
    }
    public function assertCompatible(string $version): void {
        if(!preg_match('/^\d+\.\d+\.\d+$/',$version)) throw new \InvalidArgumentException('Invalid visual contribution version.');
        if((int)explode('.',$version)[0]!==1) throw new \RuntimeException('Unsupported visual contribution major version.');
    }
}
