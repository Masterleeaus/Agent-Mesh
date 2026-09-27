<?php

declare(strict_types=1);

namespace App\Extensions\TitanBuilder\System\Models;

use App\Extensions\TitanBuilder\System\Models\Concerns\BelongsToCompany;
use Illuminate\Database\Eloquent\Model;

final class BuilderProject extends Model
{
    use BelongsToCompany;

    protected $table = 'titan_builder_projects';
    protected $guarded = [];
    protected $casts = ['meta' => 'array'];
}
