/**
 * Frontend types for workflow designer
 * Mirrors backend types but optimized for UI
 */

// ReactFlow types imported in individual components as needed

export interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  version: string;
  trigger: TriggerConfig;
  nodes: Record<string, WorkflowNodeData>;
  connections: Connection[];
  settings: WorkflowSettings;
}

export interface TriggerConfig {
  type: 'webhook' | 'schedule' | 'manual';
  config: any;
}

export interface WorkflowNodeData {
  type: string;
  position: { x: number; y: number };
  inputs: Record<string, any>;
  config: Record<string, any>;
}

export interface Connection {
  source: string;
  target: string;
  sourceOutput?: string;
  targetInput?: string;
}

export interface WorkflowSettings {
  timeout: number;
  retryPolicy: RetryPolicy;
  errorHandling: ErrorHandling;
}

export interface RetryPolicy {
  maxRetries: number;
  backoffStrategy: 'linear' | 'exponential';
  baseDelay: number;
  maxDelay: number;
  retryableErrors: string[];
}

export interface ErrorHandling {
  retryPolicy: RetryPolicy;
  fallbackBehavior: {
    continueOnError: boolean;
    defaultOutput?: any;
    fallbackNode?: string;
  };
  notifications: {
    onError: NotificationConfig[];
    onFailure: NotificationConfig[];
  };
}

export interface NotificationConfig {
  type: 'email' | 'webhook' | 'slack';
  target: string;
  template?: string;
}

// ReactFlow-specific types
export interface WorkflowNodeData {
  nodeType: string;
  inputs: Record<string, any>;
  config: Record<string, any>;
  schema?: NodeSchema;
}

export interface WorkflowNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: WorkflowNodeData;
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  type?: string;
  data?: {
    sourceOutput?: string;
    targetInput?: string;
  };
}

export interface NodeSchema {
  name: string;
  description: string;
  category: 'saas' | 'ai' | 'logic' | 'utility';
  inputs: Record<string, InputSchema>;
  outputs: Record<string, OutputSchema>;
  settings?: Record<string, any>;
}

export interface InputSchema {
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  required: boolean;
  description: string;
  default?: any;
  validation?: any;
}

export interface OutputSchema {
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description: string;
}

// Execution types
export interface ExecutionResult {
  executionId: string;
  workflowId: string;
  status: 'completed' | 'failed' | 'cancelled' | 'running';
  startTime: string;
  endTime?: string;
  nodeResults: Record<string, NodeResult>;
  error?: {
    nodeId: string;
    error: any;
  };
  metrics: {
    totalNodes: number;
    completedNodes: number;
    failedNodes: number;
    totalExecutionTime: number;
  };
}

export interface NodeResult {
  success: boolean;
  outputs: Record<string, any>;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  metadata?: {
    executionTime: number;
    retryCount: number;
    warnings?: string[];
  };
}

export interface ExecutionInstance {
  id: string;
  workflowId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  triggerData?: any;
  currentNode?: string;
  executionContext: any;
}

// UI-specific types
export interface NodeType {
  type: string;
  schema?: NodeSchema;
}

export interface NodeCategory {
  name: string;
  description: string;
  nodes: NodeType[];
  color: string;
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  workflow: WorkflowDefinition;
  thumbnail?: string;
  tags: string[];
}