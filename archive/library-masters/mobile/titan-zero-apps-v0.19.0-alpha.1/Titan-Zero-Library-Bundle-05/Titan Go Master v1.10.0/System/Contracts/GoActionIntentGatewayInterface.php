<?php
declare(strict_types=1);
namespace App\Extensions\TitanGo\System\Contracts;
interface GoActionIntentGatewayInterface{public function submit(string $companyId,string $workerId,string $intent,array $payload,array $context=[]):array;}
