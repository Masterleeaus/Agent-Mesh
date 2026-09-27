<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Presentation;

final class AccessibilityAuditor
{
    private const INTERACTIVE = ['button','link','input','select','textarea','checkbox','radio','switch','menuitem','tab','action'];

    public function audit(PresentationTree $tree): AccessibilityAuditReport
    {
        $violations=[];$seen=[];$count=0;
        $this->walk($tree->root,$violations,$seen,$count);
        return new AccessibilityAuditReport($violations,$count);
    }

    /** @param list<array{code:string,key:string,message:string}> $violations @param array<string,bool> $seen */
    private function walk(PresentationNode $node,array &$violations,array &$seen,int &$count): void
    {
        $count++;
        if (isset($seen[$node->key])) $violations[]=['code'=>'duplicate-key','key'=>$node->key,'message'=>'Presentation keys must be unique for deterministic focus and labelling.'];
        $seen[$node->key]=true;
        $a = is_array($node->props['accessibility'] ?? null) ? $node->props['accessibility'] : [];
        $interactive = in_array(strtolower($node->type),self::INTERACTIVE,true) || (($node->props['interactive']??false)===true);
        if ($interactive) {
            $name=trim((string)($a['name']??$node->props['accessible_name']??''));
            if ($name==='') $violations[]=['code'=>'accessible-name','key'=>$node->key,'message'=>'Interactive presentation requires an accessible name.'];
            if (($a['keyboard_operable']??false)!==true) $violations[]=['code'=>'keyboard','key'=>$node->key,'message'=>'Interactive presentation must be keyboard operable.'];
            if (($a['focus_visible']??false)!==true) $violations[]=['code'=>'focus-visible','key'=>$node->key,'message'=>'Interactive presentation must expose visible focus.'];
            $target=(int)($a['target_size_px']??0);
            if ($target<24) $violations[]=['code'=>'target-size','key'=>$node->key,'message'=>'Interactive target must meet the WCAG 2.2 AA 24 CSS px minimum target-size check.'];
            $tabIndex=$a['tab_index']??0;
            if (is_numeric($tabIndex) && (int)$tabIndex>0) $violations[]=['code'=>'tab-order','key'=>$node->key,'message'=>'Positive tabindex is prohibited; DOM order owns focus order.'];
        }
        $live=$a['live_region']??null;
        if ($live!==null && !in_array($live,['off','polite','assertive'],true)) $violations[]=['code'=>'live-region','key'=>$node->key,'message'=>'Live region must be off, polite or assertive.'];
        foreach ($node->children as $child) $this->walk($child,$violations,$seen,$count);
    }
}
