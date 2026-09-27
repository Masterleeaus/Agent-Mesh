<?php

namespace Modules\QualityControl\Domain\Quality\Actions;

use Modules\QualityControl\Entities\ScheduleFile;

final class AttachInspectionFileAction
{
    public function handle(int $replyId, string $filename, ?string $externalLink = null): ScheduleFile
    {
        return ScheduleFile::create([
            'schedule_reply_id' => $replyId,
            'filename' => $filename,
            'hashname' => $filename,
            'external_link' => $externalLink,
        ]);
    }
}
