<?php

declare(strict_types=1);

namespace App\Extensions\TitanBuilder\System\Models;

use App\Extensions\TitanBuilder\System\Models\Concerns\BelongsToCompany;
use Illuminate\Database\Eloquent\Model;

final class BuilderPage extends Model
{
    use BelongsToCompany;

    protected $table = 'titan_builder_pages';
    protected $guarded = [];
    protected $casts = ['meta' => 'array'];
}
