<?php
declare(strict_types=1);
namespace App\Extensions\TitanBuilder\System\Contracts;
interface BuilderRuntimeHealth { public function report(): array; }
