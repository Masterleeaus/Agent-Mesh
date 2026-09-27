<?php

namespace App\Extensions\Chatbot\System\Services\Sync;

use App\Extensions\Chatbot\System\Models\Chatbot;
use App\Extensions\Chatbot\System\Models\ChatbotConversation;
use App\Extensions\Chatbot\System\Models\ChatbotCustomer;
use App\Extensions\Chatbot\System\Models\ChatbotHistory;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use InvalidArgumentException;

class SyncEntityRegistry
{
    public function map(): array
    {
        return [
            'conversation' => ChatbotConversation::class,
            'message'      => ChatbotHistory::class,
            'customer'     => ChatbotCustomer::class,
        ];
    }

    public function supports(string $type): bool
    {
        return isset($this->map()[$type]);
    }

    public function model(string $type): Model
    {
        $class = $this->map()[$type] ?? null;

        if (! $class) {
            throw new InvalidArgumentException("Unsupported entity type: {$type}");
        }

        return new $class;
    }

    /**
     * Return a query restricted to records the authenticated user can sync.
     * This deliberately follows the extension's existing ownership chain rather
     * than trusting IDs supplied by a device.
     */
    public function query(string $type, Authenticatable $user): Builder
    {
        $query = $this->model($type)->newQuery();

        return match ($type) {
            'customer' => $query->where('user_id', $user->getAuthIdentifier()),
            'conversation' => $query->whereHas('chatbot', static function (Builder $chatbots) use ($user): void {
                $chatbots->where('user_id', $user->getAuthIdentifier());
            }),
            'message' => $query->whereHas('conversation.chatbot', static function (Builder $chatbots) use ($user): void {
                $chatbots->where('user_id', $user->getAuthIdentifier());
            }),
            default => $query->whereRaw('1 = 0'),
        };
    }

    public function allowed(string $type): array
    {
        return match ($type) {
            'conversation' => [
                'chatbot_id', 'chatbot_customer_id', 'chatbot_channel', 'chatbot_channel_id',
                'customer_channel_id', 'ip_address', 'conversation_name', 'session_id',
                'connect_agent_at', 'customer_payload', 'is_showed_on_history', 'ticket_status',
                'country_code', 'pinned', 'last_activity_at', 'send_email_at', 'review_requested_at',
                'review_request_reason', 'review_submitted_at', 'review_message', 'review_selected_response',
            ],
            'message' => [
                'chatbot_id', 'conversation_id', 'model', 'role', 'message', 'message_type',
                'media_name', 'is_internal_note', 'voice_call_duration', 'created_at',
            ],
            'customer' => [
                'name', 'email', 'phone', 'country_code', 'avatar',
                'chatbot_id', 'session_id', 'ip_address', 'chatbot_channel', 'payload',
            ],
            default => [],
        };
    }
    public function assertPayloadAuthorized(string $type, array $payload, Authenticatable $user): void
    {
        $userId = $user->getAuthIdentifier();

        if (isset($payload['chatbot_id']) && ! Chatbot::query()->whereKey($payload['chatbot_id'])->where('user_id', $userId)->exists()) {
            throw new SyncProtocolException('The selected chatbot is not available to this user.', 'CHATBOT_NOT_AUTHORIZED', 403);
        }

        if ($type === 'message' && isset($payload['conversation_id'])) {
            $conversation = ChatbotConversation::query()
                ->whereKey($payload['conversation_id'])
                ->whereHas('chatbot', static fn (Builder $query) => $query->where('user_id', $userId))
                ->first();

            if (! $conversation) {
                throw new SyncProtocolException('The selected conversation is not available to this user.', 'CONVERSATION_NOT_AUTHORIZED', 403);
            }

            if (isset($payload['chatbot_id']) && (int) $payload['chatbot_id'] !== (int) $conversation->chatbot_id) {
                throw new SyncProtocolException('The message chatbot and conversation do not match.', 'ENTITY_RELATION_MISMATCH', 422);
            }
        }
    }

}
