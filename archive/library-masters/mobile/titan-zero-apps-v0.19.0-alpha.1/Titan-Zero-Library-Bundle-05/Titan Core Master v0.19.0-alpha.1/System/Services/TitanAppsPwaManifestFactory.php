<?php
declare(strict_types=1);

namespace App\Extensions\TitanAppsCore\System\Services;

use App\Extensions\TitanAppsCore\System\Contracts\AppSurface;

final class TitanAppsPwaManifestFactory
{
    public function __construct(private readonly TitanAppsApplicationRegistry $applications) {}

    /** @return array<string,mixed> */
    public function make(AppSurface $surface,string $startUrl,string $name,string $shortName,array $icons=[]): array
    {
        $app=$this->applications->get($surface)->toArray();
        return [
            'name'=>$name,
            'short_name'=>$shortName,
            'id'=>$startUrl,
            'start_url'=>$startUrl,
            'scope'=>$startUrl,
            'display'=>'standalone',
            'theme_color'=>'#000000',
            'background_color'=>'#000000',
            'icons'=>array_values($icons),
            'titan'=>[
                'surface'=>$surface->value,
                'app_id'=>$app['app_id'],
                'interface_mount'=>$app['interface_mount'],
                'offline_capable'=>(bool)$app['offline_capable'],
                'input_modes'=>$app['input_modes'],
            ],
        ];
    }
}
