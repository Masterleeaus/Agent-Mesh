/**
 * Node type definitions for different categories
 * Following POC roadmap node specifications
 */

import { WorkflowNode } from './workflow';

export interface NodeTypes {
  // SaaS Integration Nodes
  aspire_fetch_opportunity: AspireNode;
  aspire_create_proposal: AspireNode;
  aspire_upload_attachment: AspireNode;
  
  // AI Enhancement Nodes
  ai_text_generation: AINode;
  ai_data_analysis: AINode;
  ai_decision_making: AINode;
  
  // Logic Nodes
  conditional: LogicNode;
  loop: LogicNode;
  transform: LogicNode;
  
  // Utility Nodes
  webhook: TriggerNode;
  timer: TriggerNode;
  email: ActionNode;
}

export interface AspireNode extends WorkflowNode {
  category: 'saas';
  connector: 'aspire';
  mcpMethod: string;
  requiredCredentials: string[];
}

export interface AINode extends WorkflowNode {
  category: 'ai';
  aiProvider: 'claude' | 'openai' | 'gemini';
  model: string;
  maxTokens?: number;
  temperature?: number;
}

export interface LogicNode extends WorkflowNode {
  category: 'logic';
  operator: 'if' | 'for' | 'while' | 'transform' | 'merge';
}

export interface TriggerNode extends WorkflowNode {
  category: 'utility';
  triggerType: 'webhook' | 'schedule' | 'event';
}

export interface ActionNode extends WorkflowNode {
  category: 'utility';
  actionType: 'email' | 'notification' | 'storage';
}

// Node factory interface
export interface NodeFactory {
  createNode(type: string, config: any): WorkflowNode;
  listNodeTypes(): string[];
  getNodeSchema(type: string): any;
  validateNodeConfig(type: string, config: any): boolean;
}

// Node registry for dynamic node loading
export interface NodeRegistry {
  register(type: string, nodeClass: any, schema?: any): void;
  unregister(type: string): void;
  get(type: string): any;
  list(): string[];
  exists(type: string): boolean;
  getSchema(type: string): any;
  validateConfig(type: string, config: any): boolean;
}