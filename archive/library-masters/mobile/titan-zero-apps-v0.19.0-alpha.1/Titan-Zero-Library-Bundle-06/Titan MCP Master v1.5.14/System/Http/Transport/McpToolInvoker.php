<?php

declare(strict_types=1);

namespace App\Extensions\TitanMcp\System\Http\Transport;

use App\Extensions\TitanMcp\System\Mcp\Support\McpCatalogue;
use App\Extensions\TitanMcp\System\Mcp\Support\CapabilityGate;
use Illuminate\Support\Facades\Auth;
use Illuminate\Contracts\Container\Container;
use InvalidArgumentException;
use ReflectionMethod;
use ReflectionNamedType;
use ReflectionParameter;
use RuntimeException;

final class McpToolInvoker
{
    public function __construct(
        private readonly Container $container,
        private readonly CapabilityGate $capabilityGate,
    ) {}

    /** @return array<int,array<string,mixed>> */
    public function catalogue(): array
    {
        $items = [];
        foreach (McpCatalogue::tools() as $definition) {
            $reflection = new ReflectionMethod($definition['handler'], $definition['method']);
            $items[] = [
                'name' => $definition['name'],
                'title' => $definition['title'],
                'description' => $definition['description'],
                'inputSchema' => $this->inputSchema($definition['name'], $reflection),
                'annotations' => $definition['annotations'],
                '_meta' => ['io.titanzero/tool-policy'=>$definition['client_policy']],
            ];
        }
        return $items;
    }

    /** @param array<string,mixed> $arguments */
    public function call(string $name, array $arguments): mixed
    {
        $definition = null;
        foreach (McpCatalogue::tools() as $candidate) {
            if ($candidate['name'] === $name) { $definition = $candidate; break; }
        }
        if ($definition === null) throw new InvalidArgumentException("Unknown MCP tool '{$name}'.");

        // Catalogue capability metadata is an enforced dispatch boundary, not presentation metadata.
        // Individual handlers retain their own checks as defence in depth.
        $this->capabilityGate->assert(Auth::user(), (string) $definition['capability']);

        $reflection = new ReflectionMethod($definition['handler'], $definition['method']);
        $allowed = [];
        foreach ($reflection->getParameters() as $parameter) $allowed[$parameter->getName()] = true;
        $unknown = array_diff_key($arguments, $allowed);
        if ($unknown !== []) throw new InvalidArgumentException('Unknown tool argument(s): '.implode(', ', array_keys($unknown)));

        $ordered = [];
        foreach ($reflection->getParameters() as $parameter) {
            $paramName = $parameter->getName();
            if (array_key_exists($paramName, $arguments)) {
                $ordered[] = $this->coerce($parameter, $arguments[$paramName]);
                continue;
            }
            if ($parameter->isDefaultValueAvailable()) { $ordered[] = $parameter->getDefaultValue(); continue; }
            if ($parameter->allowsNull()) { $ordered[] = null; continue; }
            throw new InvalidArgumentException("Missing required tool argument '{$paramName}'.");
        }

        $handler = $this->container->make($definition['handler']);
        if (!is_object($handler) || !method_exists($handler, $definition['method'])) throw new RuntimeException('MCP tool handler could not be resolved.');
        return $reflection->invokeArgs($handler, $ordered);
    }

    /** @return array<string,mixed> */
    private function inputSchema(string $toolName, ReflectionMethod $method): array
    {
        $properties = [];
        $required = [];
        foreach ($method->getParameters() as $parameter) {
            $properties[$parameter->getName()] = $this->parameterSchema($toolName, $parameter);
            if (!$parameter->isOptional() && !$parameter->allowsNull()) $required[] = $parameter->getName();
        }
        $schema = ['type'=>'object', 'properties'=>$properties, 'additionalProperties'=>false];
        if ($required !== []) $schema['required'] = $required;
        return $schema;
    }

    /** @return array<string,mixed> */
    private function parameterSchema(string $toolName, ReflectionParameter $parameter): array
    {
        $type = $parameter->getType();
        $name = $type instanceof ReflectionNamedType ? $type->getName() : 'mixed';
        $schema = match ($name) {
            'string' => ['type'=>'string'],
            'int' => ['type'=>'integer'],
            'float' => ['type'=>'number'],
            'bool' => ['type'=>'boolean'],
            'array' => ['oneOf'=>[['type'=>'array'],['type'=>'object']]],
            default => [],
        };
        if ($parameter->isDefaultValueAvailable()) $schema['default'] = $parameter->getDefaultValue();
        if ($parameter->allowsNull() && isset($schema['type'])) $schema['type'] = [$schema['type'], 'null'];
        $schema['description'] = $this->parameterDescription($toolName, $parameter->getName());
        if ($parameter->getName() === 'path') $schema += ['minLength'=>1, 'maxLength'=>4096];
        if ($parameter->getName() === 'reason') $schema += ['minLength'=>3, 'maxLength'=>500];
        if (in_array($parameter->getName(), ['expectedSha256','expected_sha256'], true)) $schema['pattern'] = '^[A-Fa-f0-9]{64}$';
        if ($parameter->getName() === 'expectedOccurrences') $schema += ['minimum'=>1, 'maximum'=>1000];
        if ($toolName === 'titan_mutation_prepare' && $parameter->getName() === 'tool') {
            $schema = ['type'=>'string','enum'=>[
                'titan_repository_write','titan_repository_replace','titan_repository_batch_write','titan_repository_mkdir',
                'titan_repository_delete','titan_repository_rollback','titan_database_mutate','titan_database_rollback','titan_artisan_mutate',
            ],'description'=>'Exact existing Titan mutation tool to prepare. The ticket binds to this tool and its canonical arguments.'];
        }
        if ($toolName === 'titan_mutation_prepare' && $parameter->getName() === 'arguments') {
            $schema = ['type'=>'object','description'=>'Exact arguments that would otherwise be passed to the intended mutation tool. They are stored server-side and committed unchanged after approval.'];
        }
        if ($parameter->getName() === 'ticketId') {
            $schema = ['type'=>'string','pattern'=>'^mt_[a-f0-9]{32}$','description'=>'Single-use Titan mutation ticket id returned by titan_mutation_prepare.'];
        }
        if ($parameter->getName() === 'ttlSeconds') {
            $schema = ['type'=>['integer','null'],'minimum'=>60,'maximum'=>3600,'default'=>(int)config('titan_mcp.mutation_tickets.default_ttl_seconds',300),'description'=>'Optional ticket lifetime in seconds. Omit to use the Titan MCP configured default.'];
        }
        if ($parameter->getName() === 'files') {
            $schema = [
                'type'=>'array', 'minItems'=>1, 'maxItems'=>50,
                'description'=>$this->parameterDescription($toolName, 'files'),
                'items'=>[
                    'type'=>'object', 'additionalProperties'=>false,
                    'required'=>['path','content'],
                    'properties'=>[
                        'path'=>['type'=>'string','minLength'=>1,'maxLength'=>4096,'description'=>'Repository-relative target path.'],
                        'content'=>['type'=>'string','description'=>'Complete UTF-8 file content to atomically write.'],
                        'expected_sha256'=>['type'=>['string','null'],'pattern'=>'^[A-Fa-f0-9]{64}$','description'=>'Optional optimistic-concurrency SHA-256 of the current file.'],
                    ],
                ],
            ];
        }
        return $schema;
    }

    private function parameterDescription(string $toolName, string $name): string
    {
        $common = [
            'path' => 'Repository-relative path. Never pass an absolute server path.',
            'content' => 'Complete content to write. Prefer titan_repository_replace for a small exact edit.',
            'reason' => 'Short human-readable reason for the mutation; recorded in the audit ledger.',
            'runId' => 'Optional client operation/run identifier used to correlate audit and recovery evidence.',
            'expectedSha256' => 'Optional SHA-256 of the file version you inspected. Use it to prevent overwriting concurrent changes.',
            'search' => 'Exact text that must currently exist in the target file.',
            'replace' => 'Replacement text. May be empty to remove the matched text.',
            'expectedOccurrences' => 'Exact number of search occurrences required before Titan will mutate the file.',
            'files' => 'Files to commit as one governed batch. Titan backs up every affected target scope before the first file is changed and restores the whole batch if any commit fails.',
            'ticketId' => 'Single-use mutation ticket returned by titan_mutation_prepare.',
            'ttlSeconds' => 'Short-lived preparation ticket lifetime in seconds.',
        ];
        return $common[$name] ?? match ($toolName) {
            'titan_repository_search' => 'Bounded repository search input.',
            default => 'Tool argument.',
        };
    }

    private function coerce(ReflectionParameter $parameter, mixed $value): mixed
    {
        $type = $parameter->getType();
        if (!$type instanceof ReflectionNamedType || $value === null) return $value;
        $expected = $type->getName();
        return match ($expected) {
            'string' => is_string($value) ? $value : throw new InvalidArgumentException("Argument '{$parameter->getName()}' must be a string."),
            'int' => is_int($value) ? $value : throw new InvalidArgumentException("Argument '{$parameter->getName()}' must be an integer."),
            'float' => (is_float($value) || is_int($value)) ? (float)$value : throw new InvalidArgumentException("Argument '{$parameter->getName()}' must be numeric."),
            'bool' => is_bool($value) ? $value : throw new InvalidArgumentException("Argument '{$parameter->getName()}' must be boolean."),
            'array' => is_array($value) ? $value : throw new InvalidArgumentException("Argument '{$parameter->getName()}' must be an array."),
            default => $value,
        };
    }
}
