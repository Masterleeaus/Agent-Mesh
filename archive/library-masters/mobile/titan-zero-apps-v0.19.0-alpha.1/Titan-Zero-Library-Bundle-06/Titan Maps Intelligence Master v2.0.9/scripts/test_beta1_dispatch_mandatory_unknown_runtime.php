<?php
require dirname(__DIR__).'/DTO/DispatchScoreResult.php';
require dirname(__DIR__).'/Services/DispatchScoreService.php';
use App\Extensions\TitanMapsIntelligence\Services\DispatchScoreService;
$s=new DispatchScoreService();
$r=$s->score(['priority'=>'normal','required_certifications'=>['electrical_licence']],['availability_status'=>'available','mandatory_certification_status'=>'unknown','tracking_allowed'=>true,'on_duty'=>true,'location_status'=>'fresh']);
if(!$r->blocked || !in_array('mandatory_qualification_unverified',$r->blockers,true)){fwrite(STDERR,"FAIL unknown mandatory certification was not blocked\n");exit(1);} echo "PASS mandatory unknown certification blocker\n";
