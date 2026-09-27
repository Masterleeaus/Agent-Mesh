<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Presentation;

final readonly class LocalizationProfile implements \JsonSerializable
{
    public function __construct(public string $locale,public string $fallbackLocale,public string $direction)
    {
        if(!in_array($direction,['ltr','rtl'],true))throw new \InvalidArgumentException('Localization direction is invalid.');
    }
    public function jsonSerialize():array{return ['locale'=>$this->locale,'fallback_locale'=>$this->fallbackLocale,'direction'=>$this->direction,'strings_owned_by_translation_layer'=>true];}
}
