<?php
declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\System\Integration;

use InvalidArgumentException;

final class EcosystemRecoveryReconciliationPolicy
{
    private const STATES = ['pending','retry_wait','reconciling','recovered','dead_letter','attention_required'];
    private const RETRYABLE = ['timeout','rate_limit','transient_provider_error','unknown_outcome'];
    private const PERMANENT = ['authorization_denied','validation_failed','idempotency_collision'];

    public static function assertState(string $state): void
    {
        if (!in_array($state, self::STATES, true)) {
            throw new InvalidArgumentException('Invalid recovery state.');
        }
    }

    public static function nextAfterFailure(string $outcome, int $attempt, int $maxAttempts = 5): string
    {
        if ($attempt < 1 || $maxAttempts < 1) {
            throw new InvalidArgumentException('Attempt counts must be positive.');
        }
        if (in_array($outcome, self::PERMANENT, true)) {
            return 'attention_required';
        }
        if (!in_array($outcome, self::RETRYABLE, true)) {
            return 'attention_required';
        }
        return $attempt >= $maxAttempts ? 'dead_letter' : 'retry_wait';
    }

    public static function reconciliationState(bool $receiptSucceeded, bool $domainStateMatches, bool $outcomeKnown): string
    {
        if (!$outcomeKnown) { return 'attention_required'; }
        if ($receiptSucceeded && $domainStateMatches) { return 'recovered'; }
        return 'reconciling';
    }

    public static function canCommitRecoveredWork(bool $leaseCurrent, int $claimGeneration, int $currentGeneration): bool
    {
        return $leaseCurrent && $claimGeneration === $currentGeneration;
    }
}
