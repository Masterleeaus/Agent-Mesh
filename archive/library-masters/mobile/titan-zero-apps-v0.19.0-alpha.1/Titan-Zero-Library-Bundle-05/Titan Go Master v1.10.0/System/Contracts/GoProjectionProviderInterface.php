<?php
declare(strict_types=1);
namespace App\Extensions\TitanGo\System\Contracts;
interface GoProjectionProviderInterface{public function today(string $companyId,string $workerId):array;public function jobs(string $companyId,string $workerId,array $filters=[]):array;public function job(string $companyId,string $workerId,string $jobId):array;public function schedule(string $companyId,string $workerId,array $range=[]):array;public function inbox(string $companyId,string $workerId):array;}
