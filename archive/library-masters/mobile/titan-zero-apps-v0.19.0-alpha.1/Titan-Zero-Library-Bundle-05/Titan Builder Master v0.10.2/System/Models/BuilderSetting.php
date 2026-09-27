<?php

declare(strict_types=1);

namespace App\Extensions\TitanBuilder\System\Models;

use Illuminate\Database\Eloquent\Model;

/** Builder-owned platform/company preferences. Tenant-scoped reads must use BuilderSettingsRepository. */
final class BuilderSetting extends Model
{
    protected $table = 'titan_builder_settings';
    protected $guarded = [];
    protected $casts = ['company_id' => 'integer', 'value' => 'array'];
}
