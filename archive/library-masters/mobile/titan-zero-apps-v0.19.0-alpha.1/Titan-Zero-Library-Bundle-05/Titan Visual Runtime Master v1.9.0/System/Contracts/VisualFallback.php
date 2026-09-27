<?php
declare(strict_types=1);
namespace App\Extensions\TitanVisualRuntime\System\Contracts;
final readonly class VisualFallback {
    public function __construct(public string $treatment='semantic-static', public ?string $reason=null) {}
    public function toArray(): array { return ['treatment'=>$this->treatment,'reason'=>$this->reason]; }
}
