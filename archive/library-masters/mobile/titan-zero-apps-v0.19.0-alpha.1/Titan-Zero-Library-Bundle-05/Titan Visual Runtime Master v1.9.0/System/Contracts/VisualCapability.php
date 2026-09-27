<?php
declare(strict_types=1);
namespace App\Extensions\TitanVisualRuntime\System\Contracts;
final readonly class VisualCapability {
    public function __construct(public string $id, public bool $required=false) {
        if (!preg_match('/^[a-z0-9][a-z0-9._-]{1,95}$/', $id)) throw new \InvalidArgumentException('Invalid visual capability id.');
    }
}
