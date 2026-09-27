<?php

declare(strict_types=1);

namespace App\Extensions\TitanBuilder\System\Models;

use App\Extensions\TitanBuilder\System\Models\Concerns\BelongsToCompany;
use Illuminate\Database\Eloquent\Model;

final class AiGenerationJob extends Model
{
    use BelongsToCompany;

    protected $table = 'titan_builder_ai_generation_jobs';
    protected $guarded = [];
    protected $casts = ['request' => 'array', 'response' => 'array'];
}
