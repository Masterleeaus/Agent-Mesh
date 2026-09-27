@php($tempChatPolicy = app(\App\Extensions\TempChat\System\Privacy\TemporaryChatPolicy::class))
@if ($tempChat && setting('chatpro-temp-chat-allowed', 1) == 1 && $tempChatPolicy->enabled())
    <p class="mx-auto text-balance px-5 text-center lg:w-4/5" id="temp-chat-note">
        <strong>{{ __('Temporary Chat Enabled') }}:</strong>
        {{ __($tempChatPolicy->description()) }}
    </p>
@endif
