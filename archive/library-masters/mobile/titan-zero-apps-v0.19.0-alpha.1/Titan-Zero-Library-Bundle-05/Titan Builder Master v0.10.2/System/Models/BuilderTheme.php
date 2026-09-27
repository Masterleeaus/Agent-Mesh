<?php

declare(strict_types=1);

namespace App\Extensions\TitanBuilder\System\Models;

use App\Extensions\TitanBuilder\System\Models\Concerns\BelongsToCompany;
use Illuminate\Database\Eloquent\Model;

final class BuilderTheme extends Model
{
    use BelongsToCompany;

    protected $table = 'titan_builder_themes';
    protected $guarded = [];
    protected $casts = ['tokens' => 'array', 'is_default' => 'boolean'];
}
