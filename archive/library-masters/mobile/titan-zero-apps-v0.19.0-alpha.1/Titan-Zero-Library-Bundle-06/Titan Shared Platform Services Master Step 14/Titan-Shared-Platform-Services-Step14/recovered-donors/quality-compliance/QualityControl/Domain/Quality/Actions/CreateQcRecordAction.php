<?php

namespace Modules\QualityControl\Domain\Quality\Actions;

use App\Models\User;
use Modules\QualityControl\Domain\Quality\DTOs\QcRecordData;
use Modules\QualityControl\Entities\QcRecord;
use Modules\QualityControl\Services\ExecutionRecordService;

final class CreateQcRecordAction
{
    public function __construct(private readonly ExecutionRecordService $records)
    {
    }

    public function handle(QcRecordData $data, User $actor): QcRecord
    {
        return $this->records->create($data->toArray(), $actor);
    }
}
