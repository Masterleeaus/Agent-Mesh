<?php
declare(strict_types=1);
$root=dirname(__DIR__);
require_once $root.'/System/Presentation/HubWorkspaceSpecFactory.php';
use App\Extensions\TitanHub\System\Presentation\HubWorkspaceSpecFactory;
function hws(bool $ok,string $message):void{if(!$ok){fwrite(STDERR,"FAIL: {$message}\n");exit(1);}echo "PASS: {$message}\n";}
$f=new HubWorkspaceSpecFactory();
foreach(['home','book','inbox','more'] as $workspace){
    $spec=$f->build($workspace,['items'=>[['id'=>'x','status'=>'open']],'name'=>'Customer']);
    hws(($spec['component']??null)==='mobile-app-shell',"{$workspace} uses Builder mobile shell");
    hws(($spec['props']['surface']??null)==='hub',"{$workspace} canonical hub surface");
    hws(($spec['visual']['visualTreatment']??null)==='hub.'.$workspace,"{$workspace} visual treatment delegated");
    $json=json_encode($spec,JSON_THROW_ON_ERROR);
    hws(!preg_match('/<script|javascript:|\beval\b|raw_html|innerHTML/i',$json),"{$workspace} contains no executable UI");
}
$home=$f->build('home',['summary'=>['greeting'=>'Hello Sam','summary'=>'Everything is on track.'],'jobs'=>[['id'=>'j1']],'quotes'=>[['id'=>'q1']],'invoices'=>[['id'=>'i1']]]);
hws(count($home['children']??[])>=2,'home emits semantic child components');
hws(($home['children'][0]['props']['title']??null)==='Hello Sam','home uses nested provider greeting safely');
hws(($home['children'][0]['props']['subtitle']??null)==='Everything is on track.','home uses nested provider summary safely');
$book=$f->build('book',['services'=>[['id'=>'s1','name'=>'Clean']]]);
hws(str_contains(json_encode($book), 'hub.service-request.create'),'book exposes governed service request intent');
$unknown=$f->build('unknown',['x'=>1]);
hws(($unknown['children'][0]['component']??null)==='empty-state','unknown workspace safely degrades');
