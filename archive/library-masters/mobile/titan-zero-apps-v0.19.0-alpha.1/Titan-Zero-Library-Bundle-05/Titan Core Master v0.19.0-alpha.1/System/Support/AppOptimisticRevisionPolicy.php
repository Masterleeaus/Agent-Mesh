<?php
declare(strict_types=1);

namespace App\Extensions\TitanAppsCore\System\Support;

/**
 * Shared optimistic revision rule for mutable app-owned state.
 *
 * Canonical semantics:
 * - first persisted revision is 1;
 * - every subsequent write advances exactly one revision;
 * - stale and skipped revisions fail closed.
 */
final class AppOptimisticRevisionPolicy
{
    public function __construct(private readonly string $conflictCode='app_revision_conflict') {}

    public function assertNext(?int $currentRevision,int $incomingRevision): int
    {
        $expected=($currentRevision??0)+1;
        if($incomingRevision!==$expected) throw new \RuntimeException($this->conflictCode);
        return $incomingRevision;
    }
}
