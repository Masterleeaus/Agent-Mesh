<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Experience;

use App\Extensions\TitanInterfaceRuntime\System\Context\InterfaceContext;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Experience\FocusWorkspacePolicyContract;

final class FocusWorkspacePolicy implements FocusWorkspacePolicyContract
{
    private const KINDS=['object','workspace','collection','interaction','configuration','decision','spatial'];

    public function project(InterfaceContext $context, string $targetKind, string $targetReference): FocusWorkspaceProfile
    {
        if (! in_array($targetKind,self::KINDS,true)) throw new \InvalidArgumentException('Unsupported focus target kind.');
        if ($targetReference==='' || strlen($targetReference)>320 || preg_match('/[\x00-\x1F\x7F]/',$targetReference)) {
            throw new \InvalidArgumentException('Focus target reference is invalid.');
        }
        return new FocusWorkspaceProfile(true,$targetKind,$targetReference,$context->productSurface);
    }
}
