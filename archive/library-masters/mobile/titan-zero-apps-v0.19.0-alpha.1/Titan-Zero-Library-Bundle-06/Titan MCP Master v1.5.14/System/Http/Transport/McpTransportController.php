<?php

declare(strict_types=1);

namespace App\Extensions\TitanMcp\System\Http\Transport;

use App\Extensions\TitanMcp\System\Mcp\Support\McpCatalogue;
use App\Extensions\TitanMcp\System\Mcp\Support\PlanningPromptBuilder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Auth\Access\AuthorizationException;
use InvalidArgumentException;
use Throwable;

final class McpTransportController
{
    private const PROTOCOL_VERSION = '2025-03-26';

    public function __construct(
        private readonly McpToolInvoker $tools,
        private readonly PlanningPromptBuilder $planning,
    ) {}

    public function handle(Request $request): JsonResponse
    {
        if (!config('titan_mcp.enabled', true)) return $this->rpcError(null, -32000, 'Titan MCP is disabled.', 503);
        $payload = $request->json()->all();
        if (!is_array($payload) || array_is_list($payload)) return $this->rpcError(null, -32600, 'Invalid JSON-RPC request.', 400);
        $id = $payload['id'] ?? null;
        $method = $payload['method'] ?? null;
        $params = $payload['params'] ?? [];
        if (!is_string($method) || !is_array($params)) return $this->rpcError($id, -32600, 'Invalid JSON-RPC request.', 400);

        try {
            $result = match ($method) {
                'initialize' => $this->initialize(),
                'ping' => (object)[],
                'tools/list' => ['tools'=>$this->tools->catalogue()],
                'tools/call' => $this->callTool($params),
                'prompts/list' => ['prompts'=>[[
                    'name'=>'titan_start_plan',
                    'title'=>'Titan Start Plan',
                    'description'=>'Build a grounded read-only implementation plan using Titan MCP evidence.',
                    'arguments'=>[['name'=>'goal','description'=>'Implementation goal to plan','required'=>true]],
                ]]],
                'prompts/get' => $this->getPrompt($params),
                'notifications/initialized' => null,
                default => throw new InvalidArgumentException("Unsupported MCP method '{$method}'."),
            };
            if ($method === 'notifications/initialized') return response()->json((object)[], 202);
            return response()->json(['jsonrpc'=>'2.0','id'=>$id,'result'=>$result], 200, ['MCP-Protocol-Version'=>self::PROTOCOL_VERSION]);
        } catch (AuthorizationException $e) {
            return $this->rpcError($id, -32001, $e->getMessage(), 403);
        } catch (InvalidArgumentException $e) {
            return $this->rpcError($id, -32602, $e->getMessage(), 400);
        } catch (Throwable $e) {
            report($e);
            return $this->rpcError($id, -32000, config('app.debug') ? $e->getMessage() : 'Titan MCP request failed.', 500);
        }
    }

    /** @return array<string,mixed> */
    private function initialize(): array
    {
        return [
            'protocolVersion'=>self::PROTOCOL_VERSION,
            'capabilities'=>['tools'=>['listChanged'=>false], 'prompts'=>['listChanged'=>false]],
            'serverInfo'=>['name'=>(string)config('titan_mcp.server.name','Titan MCP'), 'version'=>(string)config('titan_mcp.server.version','1.5.14')],
            '_meta'=>['io.titanzero/client-contract'=>[
                'schema'=>'titan-mcp-client-contract/1',
                'contract_hash'=>McpCatalogue::contractHash(),
                'two_phase_mutation_tickets'=>true,
                'prepare_tool'=>'titan_mutation_prepare',
                'commit_tool'=>'titan_mutation_commit',
                'status_tool'=>'titan_mutation_status',
                'exact_argument_preservation_required'=>true,
                'repository_max_write_bytes'=>max(1024,(int)config('titan_mcp.repository.max_write_bytes',1048576)),
                'mutation_ticket_max_argument_bytes'=>max(4096,(int)config('titan_mcp.mutation_tickets.max_argument_bytes',12582912)),
            ]],
            'instructions'=>'Titan MCP is optimized for coding agents including ChatGPT and Codee. Inspect before editing; preserve mutation arguments exactly; pass expectedSha256 after reads; prefer exact replace for small edits and batch write for coordinated multi-file changes. Approval-centric clients should use titan_mutation_prepare, review the returned approval evidence, obtain human approval, then call titan_mutation_commit with only the ticket ID. Direct mutation tools remain supported and still create their own verified pre-write backups.',
        ];
    }

    /** @param array<string,mixed> $params @return array<string,mixed> */
    private function callTool(array $params): array
    {
        $name = $params['name'] ?? null;
        $arguments = $params['arguments'] ?? [];
        if (!is_string($name) || !is_array($arguments)) throw new InvalidArgumentException('tools/call requires name and object arguments.');
        try {
            $result = $this->tools->call($name, $arguments);
            $structured = is_array($result) ? $result : ['result'=>$result];
            $json = json_encode($structured, JSON_UNESCAPED_SLASHES|JSON_UNESCAPED_UNICODE|JSON_PRETTY_PRINT|JSON_THROW_ON_ERROR);
            return [
                'content'=>[['type'=>'text','text'=>$json]],
                'structuredContent'=>$structured,
                'isError'=>false,
            ];
        } catch (AuthorizationException|InvalidArgumentException $e) {
            throw $e;
        } catch (Throwable $e) {
            report($e);
            $structured = [
                'error'=>[
                    'code'=>'TITAN_TOOL_EXECUTION_FAILED',
                    'tool'=>$name,
                    'message'=>config('app.debug') ? $e->getMessage() : 'Titan MCP tool execution failed.',
                    'retryable'=>false,
                ],
            ];
            return [
                'content'=>[['type'=>'text','text'=>json_encode($structured, JSON_UNESCAPED_SLASHES|JSON_UNESCAPED_UNICODE|JSON_PRETTY_PRINT|JSON_THROW_ON_ERROR)]],
                'structuredContent'=>$structured,
                'isError'=>true,
            ];
        }
    }

    /** @param array<string,mixed> $params @return array<string,mixed> */
    private function getPrompt(array $params): array
    {
        if (($params['name'] ?? null) !== 'titan_start_plan') throw new InvalidArgumentException('Unknown MCP prompt.');
        $arguments = $params['arguments'] ?? [];
        if (!is_array($arguments) || !is_string($arguments['goal'] ?? null)) throw new InvalidArgumentException('titan_start_plan requires a goal string.');
        $messages = [];
        foreach ($this->planning->build($arguments['goal']) as $message) {
            $messages[] = ['role'=>$message['role'], 'content'=>['type'=>'text','text'=>$message['content']]];
        }
        return ['description'=>'Grounded Titan implementation planning prompt.', 'messages'=>$messages];
    }

    private function rpcError(mixed $id, int $code, string $message, int $status): JsonResponse
    {
        return response()->json(['jsonrpc'=>'2.0','id'=>$id,'error'=>['code'=>$code,'message'=>$message]], $status, ['MCP-Protocol-Version'=>self::PROTOCOL_VERSION]);
    }
}
