import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { executeAgent } from '../../packages/runtime/src/engine';
import { loadRuntimeConfig } from '../../packages/runtime/src/config';
import type { RuntimeConfig, ExecutionResult } from '../../packages/runtime/src/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface JsonSchema {
  type?: string;
  properties?: Record<string, {
    type?: string;
    description?: string;
    enum?: string[];
    minimum?: number;
    maximum?: number;
    [key: string]: unknown;
  }>;
  required?: string[];
  anyOf?: Array<{ required?: string[] }>;
  [key: string]: unknown;
}

function getAgentName(agentDir: string): string {
  const agentJsonPath = resolve(agentDir, 'agent.json');
  if (!existsSync(agentJsonPath)) {
    return agentDir.split('/').pop()!.split('\\').pop()!;
  }
  const agentJson = JSON.parse(readFileSync(agentJsonPath, 'utf-8'));
  return agentJson.agent?.name || agentJson.name || agentDir;
}

function loadAgentRuntimeConfig(agentDir: string): Partial<RuntimeConfig> | null {
  const runtimePath = resolve(agentDir, 'runtime.json');
  if (!existsSync(runtimePath)) return null;
  return JSON.parse(readFileSync(runtimePath, 'utf-8')) as unknown as Partial<RuntimeConfig>;
}

function validateInput(input: unknown, schema: JsonSchema): void {
  if (schema.type === 'object') {
    if (typeof input !== 'object' || input === null || Array.isArray(input)) {
      throw new Error('Input must be a JSON object');
    }
  }
  const obj = input as Record<string, unknown>;
  if (schema.required) {
    for (const field of schema.required) {
      if (obj[field] === undefined) {
        throw new Error(`Missing required field: "${field}"`);
      }
    }
  }
  if (schema.anyOf) {
    const matchesAny = schema.anyOf.some((alt) => {
      if (!alt.required) return true;
      return alt.required.every((f) => obj[f] !== undefined);
    });
    if (!matchesAny) {
      throw new Error(
        `Input must satisfy one of: ${JSON.stringify(schema.anyOf.map((a) => a.required))}`
      );
    }
  }
  if (schema.properties) {
    for (const [key, prop] of Object.entries(schema.properties)) {
      const val = obj[key];
      if (val === undefined) continue;
      if (prop.type === 'integer' && typeof val !== 'number') {
        throw new Error(`Field "${key}" must be an integer`);
      }
      if (prop.type === 'boolean' && typeof val !== 'boolean') {
        throw new Error(`Field "${key}" must be a boolean`);
      }
      if (prop.type === 'string' && typeof val !== 'string') {
        throw new Error(`Field "${key}" must be a string`);
      }
      if (prop.enum && !prop.enum.includes(val as string)) {
        throw new Error(`Field "${key}" must be one of: ${prop.enum.join(', ')}`);
      }
      if (prop.minimum !== undefined && typeof val === 'number' && val < prop.minimum) {
        throw new Error(`Field "${key}" must be >= ${prop.minimum}`);
      }
      if (prop.maximum !== undefined && typeof val === 'number' && val > prop.maximum) {
        throw new Error(`Field "${key}" must be <= ${prop.maximum}`);
      }
    }
  }
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.error('Usage: npx tsx agents/harness/run.ts <agent-name> <input-file> [--raw]');
    console.error('');
    console.error('Arguments:');
    console.error('  agent-name    Directory name under agents/ (e.g. request-classifier)');
    console.error('  input-file    Path to JSON file with agent input');
    console.error('  --raw         Output raw assistant text instead of parsed JSON result');
    process.exit(1);
  }

  const agentDirName = args[0];
  const inputFile = resolve(args[1]);
  const rawOutput = args.includes('--raw');

  const agentsDir = resolve(__dirname, '..');
  const agentDir = resolve(agentsDir, agentDirName);

  if (!existsSync(agentDir)) {
    console.error(`Agent directory not found: ${agentDir}`);
    process.exit(1);
  }

  const agentName = getAgentName(agentDir);

  const schemaPath = resolve(agentDir, 'input-schema.json');
  const instructionPath = resolve(agentDir, 'instruction.md');

  let schema: JsonSchema = {};
  if (existsSync(schemaPath)) {
    schema = JSON.parse(readFileSync(schemaPath, 'utf-8'));
  }

  if (!existsSync(inputFile)) {
    console.error(`Input file not found: ${inputFile}`);
    process.exit(1);
  }

  let input: unknown;
  try {
    input = JSON.parse(readFileSync(inputFile, 'utf-8'));
  } catch {
    console.error('Input file must contain valid JSON');
    process.exit(1);
  }

  try {
    validateInput(input, schema);
  } catch (e: any) {
    console.error(`Validation error: ${e.message}`);
    process.exit(1);
  }

  let instruction = '';
  if (existsSync(instructionPath)) {
    instruction = readFileSync(instructionPath, 'utf-8');
  }

  const agentRuntimeConfig = loadAgentRuntimeConfig(agentDir);

  const runtimeConfig: Partial<RuntimeConfig> = {
    ...agentRuntimeConfig,
    agentName,
  };

  if (rawOutput) {
    console.error(`Running agent: ${agentName} (raw output mode)`);
  } else {
    console.error(`Running agent: ${agentName} via AI Runtime v2`);
  }

  const result: ExecutionResult = await executeAgent({
    agentName,
    instruction,
    input,
    schema,
    config: runtimeConfig,
  });

  if (result.errors.length > 0) {
    for (const err of result.errors) {
      console.error(`[attempt ${err.attempt}] ${err.code}: ${err.message}`);
    }
  }

  console.error(`Status: ${result.status}`);
  console.error(`Duration: ${result.timing.durationMs}ms`);
  console.error(`Confidence: ${result.confidence}`);
  console.error(`Routing: ${result.routingAction}`);
  console.error(`Cost: ${result.cost.totalCents.toFixed(4)} cents (${result.cost.inputTokens} in / ${result.cost.outputTokens} out)`);

  if (result.status === 'fallback') {
    const fb = result.metadata.fallback as any;
    if (fb) {
      console.error(`Fallback: ${fb.action} — ${fb.reason}`);
    }
  }

  if (rawOutput) {
    console.log(String(result.output));
  } else {
    console.log(JSON.stringify(result.output, null, 2));
  }

  process.exit(result.status === 'success' ? 0 : 1);
}

main().catch((err) => {
  console.error(`Runtime error: ${err.message}`);
  process.exit(1);
});
