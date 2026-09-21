/**
 * Core workflow type definitions following POC roadmap specifications
 */

export interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  version: string;
  
  trigger: {
    type: 'webhook' | 'schedule' | 'manual';
    config: TriggerConfig;
  };
  
  nodes: {
    [nodeId: string]: {
      type: string;
      position: { x: number; y: number };
      inputs: Record<string, any>;
      config: Record<string, any>;
    };
  };
  
  connections: Array<{
    source: string;
    target: string;
    sourceOutput?: string;
    targetInput?: string;
  }>;
  
  settings: {
    timeout: number;
    retryPolicy: RetryPolicy;
    errorHandling: ErrorHandling;
  };
}

export interface TriggerConfig {
  webhook?: {
    path: string;
    method: string;
    authentication?: boolean;
  };
  schedule?: {
    cron: string;
    timezone?: string;
  };
  manual?: {
    requiresConfirmation: boolean;
  };
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

export interface ExecutionContext {
  executionId: string;
  workflowId: string;
  nodeId: string;
  
  inputs: Record<string, any>;
  variables: Record<string, any>;
  
  credentials: CredentialManager;
  logger: Logger;
  
  // Previous node outputs
  nodeOutputs: Record<string, any>;
  
  // Workflow metadata
  startTime: Date;
  currentStep: number;
  totalSteps: number;
}

export interface CredentialManager {
  getCredentials(workspace: string, connector: string): Promise<any>;
  setCredentials(workspace: string, connector: string, credentials: any): Promise<void>;
}

export interface Logger {
  info(message: string, meta?: any): void;
  warn(message: string, meta?: any): void;
  error(message: string, meta?: any): void;
  debug(message: string, meta?: any): void;
}

export interface WorkflowNode {
  id: string;
  type: string;
  inputs: Record<string, any>;
  outputs: Record<string, any>;
  config: NodeConfiguration;
  execute(context: ExecutionContext): Promise<NodeResult>;
}

export interface NodeConfiguration {
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
  validation?: any; // Zod schema
}

export interface OutputSchema {
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description: string;
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

export interface ExecutionResult {
  executionId: string;
  workflowId: string;
  status: 'completed' | 'failed' | 'cancelled' | 'running';
  startTime: Date;
  endTime?: Date;
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

export interface WorkflowInstance {
  id: string;
  workflowId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  triggerData?: any;
  currentNode?: string;
  executionContext: any;
}