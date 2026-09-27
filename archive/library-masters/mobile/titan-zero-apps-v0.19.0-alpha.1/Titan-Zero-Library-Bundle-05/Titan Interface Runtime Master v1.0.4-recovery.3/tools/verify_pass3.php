<?php

declare(strict_types=1);

$root = dirname(__DIR__);
$required = [
    'System/Context/ContextResolutionException.php',
    'System/Context/AuthenticatedContextPrincipal.php',
    'System/Contracts/Context/AuthenticatedContextPrincipalProviderContract.php',
    'System/Contracts/Context/InterfaceContextStoreContract.php',
    'System/Context/InMemoryInterfaceContextStore.php',
    'System/Context/InterfaceContext.php',
    'System/Contracts/Context/InterfaceContextResolverContract.php',
    'System/Context/InterfaceContextResolver.php',
];
foreach ($required as $file) {
    $path = $root . '/' . $file;
    if (! is_file($path)) {
        fwrite(STDERR, "FAIL: missing {$file}\n");
        exit(1);
    }
    require_once $path;
}

use App\Extensions\TitanInterfaceRuntime\System\Context\AuthenticatedContextPrincipal;
use App\Extensions\TitanInterfaceRuntime\System\Context\ContextResolutionException;
use App\Extensions\TitanInterfaceRuntime\System\Context\InMemoryInterfaceContextStore;
use App\Extensions\TitanInterfaceRuntime\System\Context\InterfaceContext;
use App\Extensions\TitanInterfaceRuntime\System\Context\InterfaceContextResolver;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Context\AuthenticatedContextPrincipalProviderContract;

$failures = [];
$check = static function (bool $condition, string $message) use (&$failures): void {
    if (! $condition) $failures[] = $message;
};
$expectThrows = static function (callable $fn, string $contains) use (&$failures): void {
    try {
        $fn();
        $failures[] = "expected ContextResolutionException containing '{$contains}'";
    } catch (ContextResolutionException $e) {
        if (! str_contains($e->getMessage(), $contains)) {
            $failures[] = "wrong exception message: {$e->getMessage()}";
        }
    }
};

$provider = new class implements AuthenticatedContextPrincipalProviderContract {
    public function current(): AuthenticatedContextPrincipal
    {
        return new AuthenticatedContextPrincipal(
            companyId: 41,
            userId: 7,
            roles: ['owner', 'dispatcher'],
            capabilities: ['crm.read', 'job.assign'],
            teamId: 'team:principal',
        );
    }
};

$defaultContext = null;

$resolver = new InterfaceContextResolver(
    principalProvider: $provider,
    allowedProductSurfaces: ['command', 'go', 'hub', 'onboarding'],
    defaultProductSurface: 'command',
    defaultDomain: 'platform',
);

$defaultContext = $resolver->resolve();
$check($defaultContext->teamId === 'team:principal', 'team context not inherited from authenticated principal');

$context = $resolver->resolve([
    'branch_id' => 3,
    'workspace_id' => 'workspace:alpha',
    'team_id' => 'team:dispatch',
    'device_id' => 'device-abc',
    'product_surface' => 'go',
    'domain' => 'work',
    'object_ref' => 'crm.work-order:WO-42',
    'conversation_id' => 'conv-9',
    'journey_id' => 'journey-11',
    'trace_id' => 'trace-1',
    'correlation_id' => 'corr-1',
    'causation_id' => 'cause-1',
]);

$check($context->companyId === 41, 'tenant not resolved from authenticated principal');
$check($context->userId === 7, 'user not resolved from authenticated principal');
$check($context->roles === ['owner', 'dispatcher'], 'roles not propagated');
$check($context->capabilities === ['crm.read', 'job.assign'], 'capabilities not propagated');
$check($context->productSurface === 'go' && $context->domain === 'work', 'surface/domain overrides not applied');
$check($context->branchId === 3 && $context->workspaceId === 'workspace:alpha', 'branch/workspace context missing');
$check($context->teamId === 'team:dispatch' && $context->deviceId === 'device-abc', 'team/device context missing');
$check($context->objectRef === 'crm.work-order:WO-42', 'object context missing');
$check($context->conversationId === 'conv-9' && $context->journeyId === 'journey-11', 'conversation/journey context missing');
$check($context->traceId === 'trace-1' && $context->correlationId === 'corr-1' && $context->causationId === 'cause-1', 'trace context missing');

$serialized = $context->jsonSerialize();
$check(($serialized['company_id'] ?? null) === 41, 'serialization missing tenant');
$check(($serialized['context_version'] ?? null) === '1.0', 'serialization missing context version');
$check(($serialized['trace_id'] ?? null) === 'trace-1', 'serialization missing trace id');

$expectThrows(static fn() => $resolver->resolve(['company_id' => 99]), 'company_id');
$expectThrows(static fn() => $resolver->resolve(['user_id' => 8]), 'user_id');
$expectThrows(static fn() => $resolver->resolve(['product_surface' => 'unknown']), 'product_surface');
$expectThrows(static fn() => $resolver->resolve(['domain' => '../unsafe']), 'domain');

$missingProvider = new class implements AuthenticatedContextPrincipalProviderContract {
    public function current(): AuthenticatedContextPrincipal
    {
        throw new ContextResolutionException('authenticated principal is required');
    }
};
$missingResolver = new InterfaceContextResolver($missingProvider, ['command'], 'command', 'platform');
$expectThrows(static fn() => $missingResolver->resolve(), 'authenticated principal');

$child = $context->with([
    'domain' => 'customers',
    'object_ref' => 'crm.customer:C-1',
    'conversation_id' => 'conv-10',
]);
$check($child !== $context, 'context propagation must return a new immutable instance');
$check($child->companyId === $context->companyId && $child->userId === $context->userId, 'propagation changed security principal');
$check($child->productSurface === $context->productSurface, 'propagation changed product surface unexpectedly');
$check($child->domain === 'customers' && $child->objectRef === 'crm.customer:C-1', 'propagation did not change selected context');
$check($child->traceId === $context->traceId && $child->correlationId === $context->correlationId, 'trace context not propagated');

$expectThrows(static fn() => $context->with(['company_id' => 99]), 'company_id');
$expectThrows(static fn() => $context->with(['user_id' => 99]), 'user_id');
$expectThrows(static fn() => $context->with(['roles' => ['admin']]), 'roles');
$expectThrows(static fn() => $context->with(['capabilities' => ['*']]), 'capabilities');
$expectThrows(static fn() => $context->with(['product_surface' => 'hub']), 'product_surface');
$expectThrows(static fn() => $context->with(['trace_id' => 'trace-other']), 'trace_id');
$expectThrows(static fn() => $context->with(['correlation_id' => 'corr-other']), 'correlation_id');

$store = new InMemoryInterfaceContextStore();
$check($store->current() === null, 'new context store must be empty');
$store->set($context);
$check($store->requireCurrent() === $context, 'context store did not retain context');
$store->clear();
$expectThrows(static fn() => $store->requireCurrent(), 'context is not bound');

if ($failures !== []) {
    foreach ($failures as $failure) fwrite(STDERR, "FAIL: {$failure}\n");
    exit(1);
}

echo "PASS: authenticated tenant/user resolution\n";
echo "PASS: branch/workspace/team/device propagation\n";
echo "PASS: product-surface/domain/object/conversation/journey propagation\n";
echo "PASS: trace serialization\n";
echo "PASS: cross-tenant override rejected\n";
echo "PASS: cross-user override rejected\n";
echo "PASS: missing authenticated context fails closed\n";
echo "PASS: unsafe surface/domain rejected\n";
echo "PASS: immutable child context propagation\n";
echo "PASS: security principal cannot be escalated by child context\n";
echo "PASS: scoped current-context store semantics\n";
