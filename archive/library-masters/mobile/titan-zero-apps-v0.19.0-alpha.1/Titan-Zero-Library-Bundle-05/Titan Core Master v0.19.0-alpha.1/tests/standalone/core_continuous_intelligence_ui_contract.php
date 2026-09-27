<?php
$root=realpath(__DIR__.'/../..');
$d=json_decode(file_get_contents($root.'/continuous-intelligence-ui-integration.json'),true,flags:JSON_THROW_ON_ERROR);
assert(count($d['supported_decision_outcomes'])===7);
assert(str_contains($d['authority_rule'],'No learning, UI'));
$s=file_get_contents($root.'/System/Services/TitanAppsGovernedDecisionSurface.php');
assert(str_contains($s,"'ui_execution_authority'=>false"));
assert(str_contains($s,'GovernedActionDispatcherContract'));
assert(str_contains($s,'DecisionWorkspaceContract'));
echo "core_continuous_intelligence_ui_contract: ok\n";
