<?php
declare(strict_types=1);
namespace App\Extensions\TitanVisualRuntime\System\Contracts;
interface VisualRuntimeCompatibilityNegotiator { public function negotiate(array $consumer): array; }
