<?php

namespace App\Extensions\Chatbot\System\Models;

use Illuminate\Database\Eloquent\Model;

class ChatbotBuilderChannel extends Model
{
    protected $table = 'ext_chatbot_builder_channels';

    protected $fillable = [
        'tenant_id',
        'builder_config_id',
        'channel_type',
        'channel_config',
        'enabled',
        'enabled_at',
    ];

    protected $casts = [
        'channel_config' => 'json',
        'enabled' => 'boolean',
    ];

    public function builder()
    {
        return $this->belongsTo(ChatbotBuilder::class, 'builder_config_id');
    }
}
