<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Authority;

use App\Extensions\TitanInterfaceRuntime\System\Context\InterfaceContext;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Authority\ReadAuthorityAdapterContract;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Authority\ReadAuthorityRouterContract;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Authority\ReadCacheContract;

final class ReadAuthorityRouter implements ReadAuthorityRouterContract
{
    /** @var list<ReadAuthorityAdapterContract> */
    private array $adapters;

    /** @param iterable<ReadAuthorityAdapterContract> $adapters */
    public function __construct(iterable $adapters, private readonly ReadCacheContract $cache)
    {
        $this->adapters = [];
        foreach ($adapters as $adapter) $this->adapters[] = $adapter;
    }

    public function read(InterfaceContext $context, string $authority, string $mode, string $reference, ReadQuery $query): AuthorityReadResult
    {
        self::assertToken($authority, 'authority');
        if (! in_array($mode, ['read-model', 'capability', 'legacy-route'], true)) throw new AuthorityReadException("Unsupported read mode '{$mode}'.");
        self::assertReference($reference);

        $cacheKey = $this->cacheKey($context, $authority, $mode, $reference, $query);
        $cached = $this->cache->get($cacheKey);
        if ($cached !== null) {
            return $cached->withProvenance(['cache' => 'request-hit']);
        }

        foreach ($this->adapters as $adapter) {
            if (! $adapter->supports($authority, $mode)) continue;
            $result = $adapter->read($context, $authority, $reference, $query->criteria());
            if ($result->authority !== $authority || $result->reference !== $reference) {
                throw new AuthorityReadException('Read adapter returned mismatched authority provenance.');
            }
            $provenance = array_merge($result->provenance, [
                'mode' => $mode,
                'company_id' => $context->companyId,
                'user_id' => $context->userId,
                'product_surface' => $context->productSurface,
                'domain' => $context->domain,
                'trace_id' => $context->traceId,
                'correlation_id' => $context->correlationId,
                'criteria_fingerprint' => $query->fingerprint(),
                'cache' => 'request-miss',
            ]);
            if ($context->branchId !== null) $provenance['branch_id'] = $context->branchId;
            if ($context->workspaceId !== null) $provenance['workspace_id'] = $context->workspaceId;
            if ($context->teamId !== null) $provenance['team_id'] = $context->teamId;
            $normalized = $result->withProvenance($provenance);
            $this->cache->put($cacheKey, $normalized);
            return $normalized;
        }

        throw new AuthorityReadException("No read adapter is registered for {$authority}/{$mode}.");
    }

    private function cacheKey(InterfaceContext $context, string $authority, string $mode, string $reference, ReadQuery $query): string
    {
        $scope = [
            'tenant' => (string) $context->companyId,
            'user' => (string) $context->userId,
            'surface' => $context->productSurface,
            'domain' => $context->domain,
            'branch' => $context->branchId,
            'workspace' => $context->workspaceId,
            'team' => $context->teamId,
            'authority' => $authority,
            'mode' => $mode,
            'reference' => $reference,
            'query' => $query->fingerprint(),
        ];
        return hash('sha256', (string) json_encode($scope, JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR));
    }

    private static function assertToken(string $value, string $field): void
    {
        if (! preg_match('/^[a-z0-9][a-z0-9._-]{0,127}$/', $value)) throw new AuthorityReadException("{$field} contains an unsafe token.");
    }

    private static function assertReference(string $reference): void
    {
        if ($reference === '' || strlen($reference) > 255 || preg_match('~[\\/\x00-\x1F\x7F]~', $reference)) {
            throw new AuthorityReadException('Read reference contains an unsafe value.');
        }
    }
}
