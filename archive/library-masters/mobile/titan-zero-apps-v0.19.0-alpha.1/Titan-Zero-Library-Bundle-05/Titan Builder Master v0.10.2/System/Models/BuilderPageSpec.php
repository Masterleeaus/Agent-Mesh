<?php

declare(strict_types=1);

namespace App\Extensions\TitanBuilder\System\Models;

use App\Extensions\TitanBuilder\System\Models\Concerns\BelongsToCompany;
use Illuminate\Database\Eloquent\Model;

final class BuilderPageSpec extends Model
{
    use BelongsToCompany;

    protected $table = 'titan_builder_page_specs';
    protected $guarded = [];
    protected $casts = ['spec' => 'array'];
}
