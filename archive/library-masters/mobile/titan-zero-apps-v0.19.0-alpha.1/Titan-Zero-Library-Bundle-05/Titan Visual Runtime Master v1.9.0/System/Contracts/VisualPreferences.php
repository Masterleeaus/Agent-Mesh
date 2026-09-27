<?php
declare(strict_types=1);
namespace App\Extensions\TitanVisualRuntime\System\Contracts;
final readonly class VisualPreferences { public function __construct(public bool $reducedMotion=false, public bool $highContrast=false, public float $textScale=1.0, public bool $screenReader=false) {} }
