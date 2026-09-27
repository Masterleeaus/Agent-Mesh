<?php

declare(strict_types=1);

namespace Tests\Unit\Extensions\TitanMapsIntelligence;

use App\Extensions\TitanMapsIntelligence\Exceptions\MapsIntelligenceException;
use App\Extensions\TitanMapsIntelligence\Services\InMemoryQueueTenantContext;
use PHPUnit\Framework\TestCase;

final class QueueTenantContextTest extends TestCase
{
    public function test_company_context_is_active_only_inside_callback(): void
    {
        $context = new InMemoryQueueTenantContext();

        $result = $context->run('company-a', static function () use ($context): string {
            return $context->companyId();
        });

        self::assertSame('company-a', $result);
        $this->expectException(MapsIntelligenceException::class);
        $context->companyId();
    }

    public function test_nested_context_restores_outer_company(): void
    {
        $context = new InMemoryQueueTenantContext();

        $context->run('company-a', static function () use ($context): void {
            self::assertSame('company-a', $context->companyId());
            $context->run('company-b', static function () use ($context): void {
                self::assertSame('company-b', $context->companyId());
            });
            self::assertSame('company-a', $context->companyId());
        });
    }

    public function test_empty_company_context_is_rejected(): void
    {
        $context = new InMemoryQueueTenantContext();
        $this->expectException(MapsIntelligenceException::class);
        $context->run('   ', static fn (): null => null);
    }
}
