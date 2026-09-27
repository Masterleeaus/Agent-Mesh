<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Offline;

use App\Extensions\InteractionEngine\System\Contracts\ConflictResolverInterface;

class ConflictResolver implements ConflictResolverInterface
{
    public function resolve(array $command): array
    {
        if (empty($command['capability']) || !isset($command['payload']) || !is_array($command['payload'])) {
            return ['conflict' => true, 'type' => 'invalid_command', 'message' => 'Command capability and payload are required.', 'strategy' => 'reject'];
        }
        $metadata = (array) ($command['metadata'] ?? []);
        $baseVersion = $metadata['base_version'] ?? $command['payload']['base_version'] ?? null;
        $serverVersion = $metadata['server_version'] ?? $command['server_state']['version'] ?? null;
        if ($baseVersion !== null && $serverVersion !== null && (string) $baseVersion !== (string) $serverVersion) {
            return [
                'conflict' => true,
                'type' => 'version_mismatch',
                'message' => "Local base version {$baseVersion} differs from server version {$serverVersion}.",
                'strategy' => $metadata['conflict_strategy'] ?? 'prompt_user',
                'local' => $command['payload'],
                'server' => $command['server_state'] ?? null,
            ];
        }
        if (($metadata['deleted_on_server'] ?? false) && empty($metadata['allow_recreate'])) {
            return ['conflict' => true, 'type' => 'deleted_entity', 'message' => 'The target entity was deleted on the server.', 'strategy' => 'prompt_user'];
        }
        return ['conflict' => false, 'type' => null, 'message' => null, 'strategy' => 'execute'];
    }

    public function resolveConflicts(array $commands): array
    {
        $seen = [];
        $results = [];
        foreach ($commands as $index => $command) {
            $id = (string) ($command['id'] ?? $command['metadata']['local_uuid'] ?? 'index:' . $index);
            if (isset($seen[$id])) {
                $results[] = ['conflict' => true, 'type' => 'duplicate_command', 'message' => "Duplicate command id {$id}.", 'strategy' => 'deduplicate'];
                continue;
            }
            $seen[$id] = true;
            $results[] = $this->resolve((array) $command);
        }
        return $results;
    }
}
