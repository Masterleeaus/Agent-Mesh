<?php

declare(strict_types=1);

namespace App\Extensions\TitanBuilder\System\Models;

use App\Extensions\TitanBuilder\System\Models\Concerns\BelongsToCompany;
use Illuminate\Database\Eloquent\Model;

final class BuilderTemplate extends Model
{
    use BelongsToCompany;

    protected $table = 'titan_builder_templates';
    protected $guarded = [];
    protected $casts = ['definition' => 'array'];
}
