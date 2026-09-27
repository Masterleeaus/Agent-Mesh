<?php
declare(strict_types=1);
namespace App\Extensions\TitanVisualRuntime\System\Runtime;
use App\Extensions\TitanVisualRuntime\System\Contracts\VisualResourceIntegrityVerifier;
final class Sha256VisualResourceIntegrityVerifier implements VisualResourceIntegrityVerifier {
 public function verify(array $resource, ?string $bytes=null): array {
  $expected=strtolower((string)($resource['sha256']??''));
  if($expected!=='' && !preg_match('/^[a-f0-9]{64}$/',$expected)) throw new \InvalidArgumentException('Invalid visual resource SHA-256.');
  if($expected==='' || $bytes===null) return ['verified'=>false,'reason'=>$expected===''?'no-integrity-metadata':'bytes-unavailable','algorithm'=>'sha256'];
  $actual=hash('sha256',$bytes); $match=hash_equals($expected,$actual);
  return ['verified'=>$match,'reason'=>$match?'match':'mismatch','algorithm'=>'sha256','actual'=>$actual];
 }
}
