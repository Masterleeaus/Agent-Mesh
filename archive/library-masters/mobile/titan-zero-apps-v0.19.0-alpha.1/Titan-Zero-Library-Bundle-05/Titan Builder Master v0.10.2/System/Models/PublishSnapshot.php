<?php

declare(strict_types=1);

namespace App\Extensions\TitanBuilder\System\Models;

use App\Extensions\TitanBuilder\System\Models\Concerns\BelongsToCompany;
use Illuminate\Database\Eloquent\Model;

final class PublishSnapshot extends Model
{
    use BelongsToCompany;

    protected $table = 'titan_builder_publish_snapshots';
    protected $guarded = [];
    protected $casts = ['snapshot' => 'array', 'published_at' => 'datetime'];
}
