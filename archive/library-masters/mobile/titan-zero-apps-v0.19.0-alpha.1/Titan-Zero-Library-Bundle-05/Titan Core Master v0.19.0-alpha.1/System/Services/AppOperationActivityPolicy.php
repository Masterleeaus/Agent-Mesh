<?php
declare(strict_types=1);

namespace App\Extensions\TitanAppsCore\System\Services;

/** Shared app-facing classification of governed operation states. */
final class AppOperationActivityPolicy
{
    /** @param array<string,mixed> $operation */
    public function category(array $operation): string
    {
        $status=strtolower(trim((string)($operation['status']??'')));
        $metadata=is_array($operation['metadata']??null)?$operation['metadata']:[];
        $data=is_array($operation['data']??null)?$operation['data']:[];
        $terminal=($metadata['terminal']??false)===true||($data['terminal']??false)===true;

        if($terminal||in_array($status,['complete','completed','succeeded','success','done'],true)) return 'completed';
        return match($status){
            'offline_deferred','queued','deferred','prepared' => 'queued',
            'pending_approval','failed','validation_failed','conflict','blocked_dependency','unauthorized','unavailable' => 'attention',
            'executed','executing','monitoring','working','running','in_progress' => 'active',
            default => 'attention',
        };
    }

    /** @param array<string,mixed> $operation */
    public function isResumable(array $operation): bool
    {
        return in_array($this->category($operation),['queued','active','attention'],true);
    }
}
