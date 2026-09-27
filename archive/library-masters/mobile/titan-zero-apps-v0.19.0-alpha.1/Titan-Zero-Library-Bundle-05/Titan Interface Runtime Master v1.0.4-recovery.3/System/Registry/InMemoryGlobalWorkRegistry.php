<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Registry;

use App\Extensions\TitanInterfaceRuntime\System\Contracts\Registry\GlobalWorkRegistryContract;
use App\Extensions\TitanInterfaceRuntime\System\Surfaces\GlobalWorkTrayCatalog;

final class InMemoryGlobalWorkRegistry implements GlobalWorkRegistryContract
{
    private GlobalWorkRegistrySnapshot $current;

    public function __construct()
    {
        $this->current = new GlobalWorkRegistrySnapshot();
    }

    public function rebuild(array $contributions): GlobalWorkRegistrySnapshot
    {
        ksort($contributions, SORT_STRING);
        $active = [];
        $byTray = [];
        $rejected = [];

        foreach ($contributions as $contributorKey => $contribution) {
            try {
                $descriptor = $this->unwrapDescriptor($contribution);
                $items = $descriptor['global_work'] ?? null;
                if (! is_array($items) || ! array_is_list($items)) throw new \InvalidArgumentException('global_work must be a list.');

                foreach ($items as $raw) {
                    if (! is_array($raw) || array_is_list($raw)) throw new \InvalidArgumentException('global_work entries must be objects.');
                    $item = GlobalWorkDescriptor::fromArray((string) $contributorKey, $raw);
                    $key = $item->providerKey() . ':' . $item->tray;
                    if (isset($active[$key])) continue;
                    $active[$key] = $item;
                    $byTray[$item->tray][] = $key;
                }
            } catch (\Throwable $e) {
                $rejected[(string) $contributorKey][] = $e->getMessage();
            }
        }

        ksort($active, SORT_STRING);
        foreach (GlobalWorkTrayCatalog::ORDER as $tray) {
            $keys = $byTray[$tray] ?? [];
            sort($keys, SORT_STRING);
            if ($keys !== []) $byTray[$tray] = $keys;
        }
        ksort($byTray, SORT_STRING);
        foreach ($rejected as &$messages) $messages = array_values(array_unique($messages));
        unset($messages);
        ksort($rejected, SORT_STRING);

        return $this->current = new GlobalWorkRegistrySnapshot($active, $byTray, $rejected);
    }

    public function forTray(string $tray, string $productSurface): array
    {
        if (! GlobalWorkTrayCatalog::accepts($tray)) throw new \InvalidArgumentException("Unsupported global work tray '{$tray}'.");
        $out = [];
        foreach ($this->current->byTray[$tray] ?? [] as $key) {
            $descriptor = $this->current->declarations[$key] ?? null;
            if ($descriptor !== null && $descriptor->visibleOn($productSurface)) $out[] = $descriptor;
        }
        return $out;
    }

    public function snapshot(): GlobalWorkRegistrySnapshot
    {
        return $this->current;
    }

    /** @param array<string,mixed> $contribution @return array<string,mixed> */
    private function unwrapDescriptor(array $contribution): array
    {
        $descriptor = $contribution['descriptor'] ?? $contribution;
        if (! is_array($descriptor) || array_is_list($descriptor)) throw new \InvalidArgumentException('contribution descriptor must be an object.');
        return $descriptor;
    }
}
