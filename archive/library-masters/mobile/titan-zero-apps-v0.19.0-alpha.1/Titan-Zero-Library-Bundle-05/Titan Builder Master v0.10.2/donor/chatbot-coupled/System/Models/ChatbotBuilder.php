<?php

namespace App\Extensions\Chatbot\System\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class ChatbotBuilder extends Model
{
    use SoftDeletes;

    protected $table = 'ext_chatbot_builder_configs';

    protected $fillable = [
        'tenant_id',
        'chatbot_id',
        'step_current',
        'config',
        'customization',
        'theme_settings',
        'publish_status',
    ];

    protected $casts = [
        'config' => 'json',
        'customization' => 'json',
        'theme_settings' => 'json',
    ];

    public function chatbot()
    {
        return $this->belongsTo(Chatbot::class);
    }

    public function getConfigValue($key, $default = null)
    {
        return data_get($this->config, $key, $default);
    }

    public function setConfigValue($key, $value): void
    {
        $config = $this->config ?? [];
        data_set($config, $key, $value);
        $this->config = $config;
    }

    public function getThemeColor($colorKey): ?string
    {
        return data_get($this->theme_settings, "colors.$colorKey");
    }

    public function getHeaderBackground(): array
    {
        return data_get($this->theme_settings, 'header_background', [
            'type' => 'gradient',
            'value' => 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        ]);
    }
}
