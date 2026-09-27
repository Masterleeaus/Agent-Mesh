<?php
$root=dirname(__DIR__);$checks=[
 ['Models/ResourceFallbackRequest.php','review_due_at'],
 ['Models/ResourceFallbackRequest.php','escalated_at'],
 ['Console/EscalateResourceFallbacksCommand.php','maps.resource_fallback.review_timeout'],
 ['Services/ResourceFallbackService.php','fallbackHumanReviewTimeoutSeconds'],
 ['System/TitanMapsIntelligenceServiceProvider.php','titan-maps:escalate-resource-fallbacks'],
];$fail=[];foreach($checks as [$f,$n]){$s=@file_get_contents($root.'/'.$f)?:'';if(!str_contains($s,$n))$fail[]="$f missing $n";}if($fail){fwrite(STDERR,"FAIL\n - ".implode("\n - ",$fail)."\n");exit(1);}echo "PASS resource fallback review-timeout architecture\n";
