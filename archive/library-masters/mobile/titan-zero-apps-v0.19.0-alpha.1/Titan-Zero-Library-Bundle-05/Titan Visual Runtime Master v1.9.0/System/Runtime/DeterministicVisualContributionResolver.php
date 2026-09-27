<?php
namespace App\Extensions\TitanVisualRuntime\System\Runtime;
use App\Extensions\TitanVisualRuntime\System\Contracts\VisualContributionResolver;
final class DeterministicVisualContributionResolver implements VisualContributionResolver
{
 public function resolve(string $slot,array $contributions): ?array {
  $matches=array_values(array_filter($contributions,fn($c)=>is_array($c)&&($c['slot']??null)===$slot));
  if(!$matches)return null;
  usort($matches,fn($a,$b)=>(($b['priority']??0)<=>($a['priority']??0)) ?: strcmp((string)($a['provider']??''),(string)($b['provider']??'')));
  if(count($matches)>1 && ($matches[0]['priority']??0)===($matches[1]['priority']??0) && ($matches[0]['provider']??'')===($matches[1]['provider']??'')) throw new \RuntimeException('Ambiguous visual contribution ownership');
  return $matches[0];
 }
}
