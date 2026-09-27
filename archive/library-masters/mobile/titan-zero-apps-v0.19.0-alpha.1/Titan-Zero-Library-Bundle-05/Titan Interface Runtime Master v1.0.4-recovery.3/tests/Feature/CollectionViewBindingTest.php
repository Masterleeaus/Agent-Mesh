<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Extensions\TitanInterfaceRuntime\System\Contracts\Collection\CollectionViewPreferenceStoreContract;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Collection\CollectionViewSwitcherContract;
use Tests\TestCase;

final class CollectionViewBindingTest extends TestCase
{
    public function test_pass12_collection_view_services_are_bound():void
    {
        self::assertInstanceOf(CollectionViewPreferenceStoreContract::class,app(CollectionViewPreferenceStoreContract::class));
        self::assertInstanceOf(CollectionViewSwitcherContract::class,app(CollectionViewSwitcherContract::class));
    }
}
