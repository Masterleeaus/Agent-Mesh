<?php

namespace Tests\Feature\Sync;

use Tests\TestCase;

class SyncContractTest extends TestCase
{
    public function test_sync_routes_are_registered(): void
    {
        $routes = collect(app('router')->getRoutes()->getRoutes())->map->uri();

        foreach ([
            'api/v2/chatbot/sync/bootstrap',
            'api/v2/chatbot/sync/push',
            'api/v2/chatbot/sync/pull',
            'api/v2/chatbot/sync/acknowledge',
            'api/v2/chatbot/sync/status',
            'api/v2/chatbot/sync/conflicts/{conflict}/resolve',
            'api/v2/chatbot/devices/register',
            'api/v2/chatbot/devices/{device}/revoke',
        ] as $uri) {
            $this->assertTrue($routes->contains($uri), "Missing route {$uri}");
        }
    }

    public function test_operation_status_contract_is_stable(): void
    {
        $expected = [
            'local-only', 'queued', 'sending', 'synced', 'failed',
            'needs-review', 'conflict', 'cancelled', 'deleted-locally', 'deleted-remotely',
        ];
        $source = file_get_contents(base_path('app/Extensions/Chatbot/resources/pwa/chatbot-pwa/sync/engine.js'));

        foreach ($expected as $status) {
            $this->assertStringContainsString("'{$status}'", $source);
        }
    }

    public function test_sync_queries_are_scoped_through_the_entity_registry(): void
    {
        $source = file_get_contents(base_path('app/Extensions/Chatbot/System/Services/Sync/SyncEntityRegistry.php'));

        $this->assertStringContainsString("where('user_id', \$user->getAuthIdentifier())", $source);
        $this->assertStringContainsString("whereHas('conversation.chatbot'", $source);
        $this->assertStringContainsString('assertPayloadAuthorized', $source);
    }

    public function test_push_contract_supports_partial_results_and_dependencies(): void
    {
        $source = file_get_contents(base_path('app/Extensions/Chatbot/System/Services/Sync/ChatbotSyncService.php'));

        $this->assertStringContainsString('dependencyOrder', $source);
        $this->assertStringContainsString('DEPENDENCY_UNRESOLVED', $source);
        $this->assertStringContainsString('VERSION_CONFLICT', $source);
        $this->assertStringContainsString('DUPLICATE_LOCAL_CREATION', $source);
    }

    public function test_client_uses_separate_filtered_entity_cursors(): void
    {
        $source = file_get_contents(base_path('app/Extensions/Chatbot/resources/pwa/chatbot-pwa/sync/engine.js'));

        $this->assertStringContainsString("const scopes = entities.length ? [...new Set(entities)] : ['*'];", $source);
        $this->assertStringContainsString('await this.pullScope(scope, pullLimit)', $source);
        $this->assertStringContainsString("markOperations(operationIds, 'failed'", $source);
    }
    public function test_device_endpoints_use_authenticated_identifier_and_public_payload(): void
    {
        $source = file_get_contents(base_path('app/Extensions/Chatbot/System/Http/Controllers/Api/Sync/ChatbotDeviceController.php'));

        $this->assertStringContainsString('getAuthIdentifier()', $source);
        $this->assertStringContainsString('devicePayload', $source);
        $this->assertStringNotContainsString("'tenant_id'", substr($source, strpos($source, 'private function devicePayload')));
        $this->assertStringNotContainsString("'user_id'", substr($source, strpos($source, 'private function devicePayload')));
    }

    public function test_acknowledgement_count_only_includes_existing_scoped_changes(): void
    {
        $source = file_get_contents(base_path('app/Extensions/Chatbot/System/Services/Sync/ChatbotSyncService.php'));

        $this->assertStringContainsString('$acknowledged = 0;', $source);
        $this->assertStringContainsString('$acknowledged++;', $source);
        $this->assertStringContainsString('return $acknowledged;', $source);
    }

    public function test_dependency_lookup_is_scoped_by_user_and_device(): void
    {
        $source = file_get_contents(base_path('app/Extensions/Chatbot/System/Services/Sync/ChatbotSyncService.php'));
        $method = substr($source, strpos($source, 'private function unresolvedDependencies'));

        $this->assertStringContainsString("where('user_id', \$device->user_id)", $method);
        $this->assertStringContainsString("where('device_id', \$device->id)", $method);
    }

}
