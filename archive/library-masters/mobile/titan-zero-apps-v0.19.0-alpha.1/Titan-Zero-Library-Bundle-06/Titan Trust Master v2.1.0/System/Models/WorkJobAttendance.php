<?php

declare(strict_types=1);

namespace App\Extensions\TitanTrust\System\Models;

use Illuminate\Database\Eloquent\Model;
use App\Extensions\TitanTrust\System\Models\Concerns\TenantScoped;

class WorkJobAttendance extends Model
{
    use TenantScoped;

    protected $table = 'work_jobs_attendance';

    protected $fillable = [
    'company_id',
    'user_id',
    'team_id',
    'created_by_team_id',
    'job_id',
    'staff_user_id',
    'clock_in_at',
    'clock_in_source',
    'clock_out_at',
    'clock_out_source',
    'derived_first_capture_at',
    'derived_last_capture_at',
    'lat',
    'lng',
    'accuracy_m',
    'notes',
    'meta_json',
];


    protected $casts = [
    'clock_in_at' => 'datetime',
    'clock_out_at' => 'datetime',
    'derived_first_capture_at' => 'datetime',
    'derived_last_capture_at' => 'datetime',
    'meta_json' => 'array',
];

}
