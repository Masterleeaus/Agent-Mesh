<?php

namespace Modules\QualityControl\Domain\Quality\Actions;

use Modules\QualityControl\Domain\Quality\DTOs\InspectionReplyData;
use Modules\QualityControl\Entities\ScheduleReply;

final class SubmitInspectionReplyAction
{
    public function handle(InspectionReplyData $data): ScheduleReply
    {
        return ScheduleReply::create([
            'schedule_id' => $data->scheduleId,
            'comment' => $data->comment,
            'added_by' => $data->userId,
        ]);
    }
}
