<?php

declare(strict_types=1);

namespace Tests\Feature\Extensions\TitanInterfaceRuntime;

use App\Extensions\TitanInterfaceRuntime\System\TitanInterfaceRuntimeServiceProvider;
use Illuminate\Support\Facades\File;
use Tests\TestCase;

final class UninstallSafetyTest extends TestCase
{
    public function test_uninstall_removes_only_published_package_config(): void
    {
        $path = config_path('titan-interface-runtime.php');
        $hadOriginal = File::exists($path);
        $original = $hadOriginal ? File::get($path) : null;

        try {
            File::put($path, "<?php return ['test' => true];\n");
            TitanInterfaceRuntimeServiceProvider::uninstall();
            self::assertFalse(File::exists($path));
        } finally {
            if ($hadOriginal && $original !== null) {
                File::put($path, $original);
            } else {
                File::delete($path);
            }
        }
    }
}
