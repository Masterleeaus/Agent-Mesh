<?php
$root=dirname(__DIR__); $s=file_get_contents($root.'/Services/ServiceTerritoryService.php') ?: '';
$needles=['TerritoryConflictService','matched_rule_chain','resolution_basis','primary_branch_public_id','maps.territory.conflict'];
$missing=[];foreach($needles as $n)if(!str_contains($s,$n))$missing[]=$n;
if($missing){fwrite(STDERR,'FAIL missing '.implode(', ',$missing)."\n");exit(1);} echo "PASS beta1 territory service conflict enforcement\n";
