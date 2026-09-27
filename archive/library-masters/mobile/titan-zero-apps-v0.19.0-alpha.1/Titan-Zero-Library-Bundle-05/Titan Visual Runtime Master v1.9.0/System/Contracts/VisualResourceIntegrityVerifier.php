<?php
declare(strict_types=1);
namespace App\Extensions\TitanVisualRuntime\System\Contracts;
interface VisualResourceIntegrityVerifier { public function verify(array $resource, ?string $bytes=null): array; }
