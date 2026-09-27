<?php
declare(strict_types=1);
namespace App\Extensions\TitanVisualRuntime\System\Contracts;
final readonly class VisualContribution {
    public function __construct(public string $id, public string $provider, public array $surfaces, public array $metadata) {
        if (!preg_match('/^[a-z0-9][a-z0-9._-]{1,127}$/', $id)) throw new \InvalidArgumentException('Invalid visual contribution id.');
        foreach ($surfaces as $surface) if (!in_array($surface,['zero','go','hub'],true)) throw new \InvalidArgumentException('Invalid visual contribution surface.');
    }
    public function toArray(): array { return ['id'=>$this->id,'provider'=>$this->provider,'surfaces'=>$this->surfaces,'metadata'=>$this->metadata]; }
}
