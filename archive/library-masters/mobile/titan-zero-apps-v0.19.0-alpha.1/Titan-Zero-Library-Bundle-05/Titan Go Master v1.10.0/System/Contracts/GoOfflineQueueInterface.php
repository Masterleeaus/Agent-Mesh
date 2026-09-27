<?php
declare(strict_types=1);
namespace App\Extensions\TitanGo\System\Contracts;
interface GoOfflineQueueInterface{public function enqueue(GoOfflineOperation $operation):array;public function pending(string $companyId,string $workerId,string $deviceId):array;}
