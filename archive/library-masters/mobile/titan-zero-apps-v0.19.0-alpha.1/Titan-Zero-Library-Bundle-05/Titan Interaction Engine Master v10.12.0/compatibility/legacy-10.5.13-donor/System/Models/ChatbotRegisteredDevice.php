<?php

namespace App\Extensions\Chatbot\System\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * @deprecated Legacy Chatbot sync compatibility model.
 *
 * The compatibility subsystem is retained for proven legacy callers, but
 * company_id is the sole company authority boundary.
 */
class ChatbotRegisteredDevice extends Model
{
    protected $table='ext_chatbot_registered_devices';
    protected $guarded=[];
    protected $casts=[
        'capabilities'=>'array',
        'last_seen_at'=>'datetime',
        'revoked_at'=>'datetime',
    ];
}
