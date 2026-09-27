<?php
declare(strict_types=1);
namespace App\Extensions\TitanAppsCore\System\Services;

use App\Extensions\TitanAppsCore\System\Contracts\ExtensionInstallReadiness;

final class TitanAppsCoreInstallReadiness implements ExtensionInstallReadiness
{
    public function __construct(
        private readonly TitanAppsCoreReadinessValidator $validator,
        private readonly TitanAppsApplicationRegistry $applications,
        private readonly TitanAppsPublicServiceRegistry $publicServices,
    ) {}

    public function inspect(): array
    {
        $errors = $this->validator->errors();
        return [
            'extension'=>'titan-apps-core',
            'installable'=>$errors === [],
            'errors'=>$errors,
            'applications'=>$this->applications->catalogue(),
            'public_services'=>$this->publicServices->catalogue(),
            'migrations_required'=>false,
            'destructive_uninstall'=>false,
            'retained_data'=>[],
        ];
    }
}
