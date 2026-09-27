<?php

declare(strict_types=1);
namespace App\Extensions\TitanInterfaceRuntime\System\Presentation;
final class ResponsiveAuditor
{
    public function audit(PresentationTree $tree):ResponsiveAuditReport
    {
        $v=[];$mobile=in_array($tree->surface,['go','hub','onboarding'],true);
        if($mobile&&$tree->responsive->mode==='fixed')$v[]='Mobile-first surfaces cannot use fixed-only responsive mode.';
        foreach($tree->responsive->breakpoints as$name=>$px)if($px<240||$px>4096)$v[]="Breakpoint {$name} is outside supported bounds.";
        return new ResponsiveAuditReport($v);
    }
}
