<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Extensions\Chatbot\System\Services\Sync\SyncEntityRegistry;
use PHPUnit\Framework\TestCase;

class ChatbotSyncSecurityContractTest extends TestCase
{
    public function test_only_supported_sync_entities_are_exposed(): void
    {
        $this->assertSame(['conversation', 'message', 'customer'], SyncEntityRegistry::TYPES);
    }

    public function test_sync_service_uses_owned_queries_for_identifier_lookups(): void
    {
        $source = file_get_contents(dirname(__DIR__, 2) . '/System/Services/Sync/ChatbotSyncService.php');
        $this->assertStringContainsString('queryForUser($type, $user)', $source);
        $this->assertStringNotContainsString('newQuery()->find(', $source);
    }

    public function test_client_adapter_is_bootstrapped(): void
    {
        $blade = file_get_contents(dirname(__DIR__, 2) . '/resources/views/frontend-ui/components/pwa.blade.php');
        $this->assertStringContainsString('IndexedDbChatbotSyncAdapter', $blade);
        $this->assertStringContainsString('new window.ChatbotSyncEngine(adapter)', $blade);
    }
}
