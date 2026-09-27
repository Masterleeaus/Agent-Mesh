<?php

declare(strict_types=1);

$root = dirname(__DIR__, 2);
require_once $root.'/System/Mcp/Support/MutationTicketStore.php';

use App\Extensions\TitanMcp\System\Mcp\Support\MutationTicketStore;

$tmp = sys_get_temp_dir().'/titan-mcp-ticket-store-'.bin2hex(random_bytes(5));
$store = new MutationTicketStore($tmp);
$created = $store->create([
    'status'=>'prepared',
    'actor_id'=>7,
    'tool'=>'titan_repository_write',
    'arguments_sha256'=>str_repeat('a', 64),
]);
$id = $created['ticket_id'] ?? null;
if (!is_string($id) || preg_match('/^mt_[a-f0-9]{32}$/', $id) !== 1) throw new RuntimeException('Ticket id format invalid.');
$read = $store->read($id);
if (($read['status'] ?? null) !== 'prepared' || ($read['actor_id'] ?? null) !== 7) throw new RuntimeException('Ticket read did not preserve data.');
$store->replace($id, array_replace($read, ['status'=>'committing']));
if (($store->read($id)['status'] ?? null) !== 'committing') throw new RuntimeException('Ticket replacement failed.');

// Prove prepared -> committing is single-use and compare-and-swap guarded.
$second = $store->create(['status'=>'prepared','actor_id'=>7,'tool'=>'titan_repository_write','arguments_sha256'=>str_repeat('b',64)]);
$secondId = (string)$second['ticket_id'];
$store->transition($secondId, 'prepared', ['status'=>'committing']);
$doubleCommitBlocked = false;
try { $store->transition($secondId, 'prepared', ['status'=>'committing']); } catch (RuntimeException) { $doubleCommitBlocked = true; }
if (!$doubleCommitBlocked) throw new RuntimeException('Mutation ticket compare-and-swap allowed a second commit transition.');

// Corrupt the sealed ticket and prove it fails closed.
$ticketPath = $tmp.'/'.$id.'.json';
file_put_contents($ticketPath, str_replace('committing', 'committed', (string) file_get_contents($ticketPath)));
$blocked = false;
try { $store->read($id); } catch (RuntimeException) { $blocked = true; }
if (!$blocked) throw new RuntimeException('Tampered mutation ticket was accepted.');

foreach (glob($tmp.'/*') ?: [] as $path) @unlink($path);
@rmdir($tmp);
echo "Titan MCP mutation ticket store: PASS\n";
