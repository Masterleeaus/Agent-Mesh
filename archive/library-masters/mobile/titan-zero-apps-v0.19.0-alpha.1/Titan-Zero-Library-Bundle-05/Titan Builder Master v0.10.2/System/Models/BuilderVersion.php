<?php

declare(strict_types=1);

namespace App\Extensions\TitanBuilder\System\Models;

use App\Extensions\TitanBuilder\System\Models\Concerns\BelongsToCompany;
use Illuminate\Database\Eloquent\Model;

final class BuilderVersion extends Model
{
    use BelongsToCompany;

    protected $table = 'titan_builder_versions';
    protected $guarded = [];
    protected $casts = ['published_at' => 'datetime', 'meta' => 'array'];
}
