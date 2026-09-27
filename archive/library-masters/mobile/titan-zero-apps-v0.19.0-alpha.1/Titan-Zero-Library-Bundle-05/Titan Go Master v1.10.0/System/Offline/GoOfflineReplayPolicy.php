<?php

declare(strict_types=1);

namespace App\Extensions\TitanGo\System\Offline;

use App\Extensions\TitanGo\System\Contracts\TitanFieldMobileGatewayInterface;
use InvalidArgumentException;

final class GoOfflineReplayPolicy
{
    public function __construct(private TitanFieldMobileGatewayInterface $field, private ?GoOfflineOperationPolicy $envelopePolicy = null) {}

    public function validate(GoOfflineOperation $operation): void
    {
        ($this->envelopePolicy ?? new GoOfflineOperationPolicy())->validate($operation);

        if (!in_array($operation->capability, $this->field->replayOperations(), true)) {
            throw new InvalidArgumentException('Unsupported Titan Go offline operation: '.$operation->capability);
        }

        if ($operation->baseVersion !== null && $operation->baseVersion < 1) {
            throw new InvalidArgumentException('baseVersion must be null or a positive integer.');
        }

        if (strtotime($operation->occurredAt) === false) {
            throw new InvalidArgumentException('occurredAt must be a valid timestamp.');
        }
    }

    /** @return array{company_id:string,actor_id:string,device_id:string} */
    public function validateBatch(array $operations): array
    {
        if ($operations === [] || count($operations) > $this->field->maxBatchSize()) {
            throw new InvalidArgumentException('Titan Go offline batches must contain between 1 and '.$this->field->maxBatchSize().' operations.');
        }

        $ids = [];
        $scope = null;
        foreach ($operations as $operation) {
            if (!$operation instanceof GoOfflineOperation) {
                throw new InvalidArgumentException('Offline batches may contain only GoOfflineOperation values.');
            }
            $this->validate($operation);
            $operationScope = [
                'company_id' => $operation->companyId,
                'actor_id' => $operation->actorId,
                'device_id' => $operation->deviceId,
            ];
            if ($scope === null) {
                $scope = $operationScope;
            } elseif ($scope !== $operationScope) {
                throw new InvalidArgumentException('Titan Go offline batches must be single-company, single-actor and single-device.');
            }
            if (isset($ids[$operation->operationId])) {
                throw new InvalidArgumentException('Duplicate operation_id in offline batch.');
            }
            $ids[$operation->operationId] = true;
        }

        return $scope ?? throw new InvalidArgumentException('Titan Go offline batch scope could not be resolved.');
    }
}
