<?php
declare(strict_types=1);
$root=dirname(__DIR__);
$fail=0;$check=function(bool $ok,string $m)use(&$fail){echo($ok?'PASS ':'FAIL ').$m."\n";if(!$ok)$fail++;};
$sp=file_get_contents($root.'/System/InteractionEngineServiceProvider.php');
$check(str_contains($sp,'ZeroExperienceCapabilityProvider'),'canonical Zero experience provider is registered');
$check(str_contains($sp,'LegacyChatbotZeroGatewayAdapter'),'legacy Chatbot gateway is adapted behind canonical Zero provider');
$check(!str_contains($sp,'$registry->register(new ChatbotCapabilityProvider('),'Chatbot provider is not canonical registry authority');
$aliases=file_get_contents($root.'/System/Capabilities/CapabilityAliasRegistry.php');
$check(str_contains($aliases,"'chatbot.identity.update'=>'zero.identity.update'"),'legacy chatbot identity capability aliases to Zero');
$check(str_contains($aliases,"'chatbot.activate'=>'zero.activate'"),'legacy chatbot activation aliases to Zero');
$wizard=file_get_contents($root.'/resources/wizards/field_home_services_onboarding.json');
$check(!str_contains($wizard,'"provider": "chatbot"'),'new onboarding plan no longer canonically targets chatbot provider');
$check(!preg_match('/"capability"\s*:\s*"chatbot\./',$wizard),'new onboarding plan no longer canonically targets chatbot capabilities');
$compat=file_get_contents($root.'/System/Capabilities/Providers/ChatbotCapabilityProvider.php');
$check(str_contains($compat,'@deprecated'),'legacy Chatbot provider is explicitly compatibility-only');
exit($fail?1:0);
