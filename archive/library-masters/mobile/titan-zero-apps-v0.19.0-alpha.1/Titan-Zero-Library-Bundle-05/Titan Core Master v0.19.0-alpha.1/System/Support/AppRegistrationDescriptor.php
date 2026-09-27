<?php
declare(strict_types=1);

namespace App\Extensions\TitanAppsCore\System\Support;

use App\Extensions\TitanAppsCore\System\Contracts\AppRegistration;
use App\Extensions\TitanAppsCore\System\Contracts\AppSurface;

final readonly class AppRegistrationDescriptor implements AppRegistration
{
    /** @param list<string> $inputModes */
    public function __construct(
        private AppSurface $appSurface,
        private string $id,
        private string $displayName,
        private string $mount,
        private bool $pwa,
        private bool $offline,
        private array $inputModes,
    ) {}

    public function surface(): AppSurface { return $this->appSurface; }
    public function appId(): string { return $this->id; }

    /** @return array<string,mixed> */
    public function toArray(): array
    {
        return [
            'surface'=>$this->surface()->value,
            'app_id'=>$this->appId(),
            'display_name'=>$this->displayName,
            'interface_mount'=>$this->mount,
            'pwa'=>$this->pwa,
            'offline_capable'=>$this->offline,
            'input_modes'=>$this->inputModes,
        ];
    }
}
