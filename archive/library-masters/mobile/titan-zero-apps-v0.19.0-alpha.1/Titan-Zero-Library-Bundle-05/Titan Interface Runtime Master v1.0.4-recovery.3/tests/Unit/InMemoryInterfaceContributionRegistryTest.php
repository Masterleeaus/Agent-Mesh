<?php

declare(strict_types=1);

namespace Tests\Unit\Extensions\TitanInterfaceRuntime;

use App\Extensions\TitanInterfaceRuntime\System\Registry\InMemoryInterfaceContributionRegistry;
use PHPUnit\Framework\TestCase;

final class InMemoryInterfaceContributionRegistryTest extends TestCase
{
    public function test_registry_stores_metadata_only_by_extension_key(): void
    {
        $registry = new InMemoryInterfaceContributionRegistry();
        $registry->register('crm', ['schema_version' => '1.0']);

        self::assertTrue($registry->has('crm'));
        self::assertSame(['schema_version' => '1.0'], $registry->get('crm'));

        $registry->forget('crm');
        self::assertFalse($registry->has('crm'));
    }
}
