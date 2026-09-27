<?php

require __DIR__.'/../../System/Contracts/AppSurface.php';
require __DIR__.'/../../System/Support/AppJourneyContext.php';
require __DIR__.'/../../System/Support/OfflineCapabilityIntent.php';

use App\Extensions\TitanAppsCore\System\Contracts\AppSurface;
use App\Extensions\TitanAppsCore\System\Support\AppJourneyContext;
use App\Extensions\TitanAppsCore\System\Support\OfflineCapabilityIntent;

$journey = new AppJourneyContext(AppSurface::Zero, 'onboarding', 'business-profile');
assert($journey->toArray()['surface'] === 'zero');

$intent = new OfflineCapabilityIntent(
    'intent-1',
    AppSurface::Go,
    12,
    99,
    'crm.work_order.note.write',
    'idem-1',
    ['note'=>'safe test']
);
$row = $intent->toArray();
assert($row['company_id'] === 12);
assert($row['actor_id'] === 99);
assert($row['surface'] === 'go');
assert($row['idempotency_key'] === 'idem-1');

$failed = false;
try {
    new AppJourneyContext(AppSurface::Hub, 'onboarding', 'start');
} catch (\InvalidArgumentException) {
    $failed = true;
}
assert($failed === true);

echo "core_runtime_contract: ok\n";
