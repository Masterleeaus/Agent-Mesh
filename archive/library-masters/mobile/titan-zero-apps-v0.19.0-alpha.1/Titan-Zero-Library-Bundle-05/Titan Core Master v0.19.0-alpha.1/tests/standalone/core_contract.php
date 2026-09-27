<?php
require __DIR__.'/../../System/Contracts/AppSurface.php';
use App\Extensions\TitanAppsCore\System\Contracts\AppSurface;
assert(AppSurface::resolve('zero') === AppSurface::Zero);
assert(AppSurface::resolve('command') === AppSurface::Zero);
assert(AppSurface::resolve('worker') === AppSurface::Go);
assert(AppSurface::resolve('customer') === AppSurface::Hub);
echo "core_contract: ok\n";
