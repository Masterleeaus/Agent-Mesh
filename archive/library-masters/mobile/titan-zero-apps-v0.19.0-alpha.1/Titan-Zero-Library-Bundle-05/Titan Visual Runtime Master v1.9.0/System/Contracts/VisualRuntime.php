<?php
declare(strict_types=1);
namespace App\Extensions\TitanVisualRuntime\System\Contracts;
interface VisualRuntime { public function plan(array $request, VisualEnvironment $environment, VisualPreferences $preferences): array; }
