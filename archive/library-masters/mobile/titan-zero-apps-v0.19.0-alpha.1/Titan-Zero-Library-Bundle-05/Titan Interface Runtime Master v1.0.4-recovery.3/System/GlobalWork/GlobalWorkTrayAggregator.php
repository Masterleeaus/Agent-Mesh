<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\GlobalWork;

use App\Extensions\TitanInterfaceRuntime\System\Context\InterfaceContext;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\GlobalWork\GlobalWorkProviderGatewayContract;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\GlobalWork\GlobalWorkTrayAggregatorContract;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Registry\GlobalWorkRegistryContract;
use App\Extensions\TitanInterfaceRuntime\System\Surfaces\GlobalWorkTrayCatalog;
use App\Extensions\TitanInterfaceRuntime\System\Objects\ObjectReference;

final readonly class GlobalWorkTrayAggregator implements GlobalWorkTrayAggregatorContract
{
    public function __construct(
        private GlobalWorkRegistryContract $registry,
        private GlobalWorkProviderGatewayContract $gateway,
        private int $defaultLimit = 50,
    ) {
        if ($defaultLimit < 1 || $defaultLimit > 200) throw new \InvalidArgumentException('Global work default limit must be between 1 and 200.');
    }

    public function aggregate(InterfaceContext $context, string $tray, ?int $limit = null): GlobalWorkTraySnapshot
    {
        if (! GlobalWorkTrayCatalog::accepts($tray)) throw new \InvalidArgumentException("Unsupported global work tray '{$tray}'.");
        $limit ??= $this->defaultLimit;
        if ($limit < 1 || $limit > 200) throw new \InvalidArgumentException('Global work tray limit must be between 1 and 200.');

        $descriptors = $this->registry->forTray($tray, $context->productSurface);
        if ($descriptors === []) return new GlobalWorkTraySnapshot($tray, 'empty', [], []);

        $health = [];
        $candidates = [];
        $omitted = ['tenant'=>0,'permission'=>0,'wrong_tray'=>0,'invalid'=>0];

        foreach ($descriptors as $descriptor) {
            try {
                $result = $this->gateway->fetch($descriptor, $context, min(500, max($limit * 4, 50)));
                $health[] = $result->health;
                foreach ($result->items as $item) {
                    if ($item->tray !== $tray) { $omitted['wrong_tray']++; continue; }
                    if (! $item->tenantMatches($context->companyId)) { $omitted['tenant']++; continue; }
                    if (! $item->authorizedBy($context->capabilities)) { $omitted['permission']++; continue; }
                    if ($item->objectRef !== null) {
                        try {
                            $object = ObjectReference::parse($item->objectRef);
                            if ($object->companyId !== null && (string) $object->companyId !== (string) $context->companyId) { $omitted['tenant']++; continue; }
                        } catch (\Throwable) { $omitted['invalid']++; continue; }
                    }
                    $candidates[] = $item;
                }
            } catch (\Throwable $e) {
                $health[] = new GlobalWorkProviderHealth(
                    $descriptor->providerKey(),
                    'unavailable',
                    'Provider unavailable.',
                    0,
                );
            }
        }

        usort($candidates, [self::class, 'compare']);
        $deduped = [];
        $seen = [];
        $deduplicated = 0;
        foreach ($candidates as $item) {
            $key = $item->dedupeKey();
            if (isset($seen[$key])) { $deduplicated++; continue; }
            $seen[$key] = true;
            $deduped[] = $item;
        }

        $truncated = count($deduped) > $limit;
        if ($truncated) $deduped = array_slice($deduped, 0, $limit);
        $degraded = array_filter($health, static fn (GlobalWorkProviderHealth $h): bool => $h->degraded()) !== [];
        $status = $degraded ? 'degraded' : ($deduped === [] ? 'empty' : 'ready');
        $omitted = array_filter($omitted, static fn (int $count): bool => $count > 0);

        return new GlobalWorkTraySnapshot($tray, $status, $deduped, $health, $deduplicated, $omitted, $truncated);
    }

    public function all(InterfaceContext $context, ?int $limitPerTray = null): array
    {
        $out = [];
        foreach (GlobalWorkTrayCatalog::ORDER as $tray) $out[$tray] = $this->aggregate($context, $tray, $limitPerTray);
        return $out;
    }

    private static function compare(GlobalWorkItemReference $left, GlobalWorkItemReference $right): int
    {
        $priority = $right->priority <=> $left->priority;
        if ($priority !== 0) return $priority;
        $time = $right->occurredAt <=> $left->occurredAt;
        if ($time !== 0) return $time;
        $authority = strcmp($left->sourceAuthority, $right->sourceAuthority);
        if ($authority !== 0) return $authority;
        $reference = strcmp($left->sourceReference, $right->sourceReference);
        return $reference !== 0 ? $reference : strcmp($left->itemKey, $right->itemKey);
    }
}
