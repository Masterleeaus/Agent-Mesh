<?php
$s=file_get_contents(dirname(__DIR__).'/System/Context/RequestTrustedCustomerContextResolver.php');
$c=file_get_contents(dirname(__DIR__).'/config/hub.php');
function hp4($x,$m){if(!$x){fwrite(STDERR,"FAIL $m\n");exit(1);}echo "PASS $m\n";}
hp4(str_contains($s,'Trusted company_id context is required for Titan Hub.'),'Hub requires company_id');
hp4(str_contains($s,'Trusted customer identity is required for Titan Hub.'),'Hub requires customer identity');
hp4(str_contains($c,"'require_company_context' => true"),'company requirement defaults on');
hp4(str_contains($c,"'require_customer_identity' => true"),'customer requirement defaults on');
