<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\LocalIntelligence\Sync;

final class VectorClock
{
    /** @var array<string, int> */
    private array $values;

    /** @param array<string, int|numeric-string> $values */
    public function __construct(array $values = [])
    {
        $normalized = [];
        foreach ($values as $node => $counter) {
            $node = trim((string) $node);
            if ($node === '' || !is_numeric($counter) || (int) $counter < 0) {
                throw new \InvalidArgumentException('Vector clocks require non-empty node IDs and non-negative integer counters.');
            }
            $normalized[$node] = (int) $counter;
        }
        ksort($normalized);
        $this->values = $normalized;
    }

    public function tick(string $node): self
    {
        $node = trim($node);
        if ($node === '') {
            throw new \InvalidArgumentException('Vector clock node ID is required.');
        }
        $values = $this->values;
        $values[$node] = ($values[$node] ?? 0) + 1;
        return new self($values);
    }

    public function merge(self $other): self
    {
        $values = $this->values;
        foreach ($other->values as $node => $counter) {
            $values[$node] = max($values[$node] ?? 0, $counter);
        }
        return new self($values);
    }

    public function compare(self $other): string
    {
        $nodes = array_unique(array_merge(array_keys($this->values), array_keys($other->values)));
        $less = false;
        $greater = false;
        foreach ($nodes as $node) {
            $left = $this->values[$node] ?? 0;
            $right = $other->values[$node] ?? 0;
            $less = $less || $left < $right;
            $greater = $greater || $left > $right;
        }
        return match (true) {
            !$less && !$greater => 'equal',
            $less && !$greater => 'before',
            !$less && $greater => 'after',
            default => 'concurrent',
        };
    }

    /** @return array<string, int> */
    public function toArray(): array
    {
        return $this->values;
    }
}
