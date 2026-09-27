<?php
declare(strict_types=1);
namespace Modules\TitanZeroAssurance\Contracts;
use Modules\TitanZeroAssurance\ValueObjects\SignalEnvelope;
interface AssuranceSignalHandler { public function supports(SignalEnvelope $signal): bool; public function handle(SignalEnvelope $signal): array; }
