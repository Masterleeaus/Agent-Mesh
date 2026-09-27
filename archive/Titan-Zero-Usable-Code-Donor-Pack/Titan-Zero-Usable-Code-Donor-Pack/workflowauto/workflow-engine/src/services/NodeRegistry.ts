/**
 * Node Registry for dynamic node loading and management
 * Supports the node types defined in POC roadmap Milestone 1.2
 */

import { NodeRegistry, NodeFactory } from '../types/nodes';
import { WorkflowNode, NodeConfiguration } from '../types/workflow';
import { Logger } from './Logger';

export class DefaultNodeRegistry implements NodeRegistry {
  private nodes = new Map<string, any>();
  private schemas = new Map<string, NodeConfiguration>();
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  register(type: string, nodeClass: any, schema?: NodeConfiguration): void {
    this.nodes.set(type, nodeClass);
    
    if (schema) {
      this.schemas.set(type, schema);
    }

    this.logger.info(`Registered node type: ${type}`, {
      nodeType: type,
      hasSchema: !!schema
    });
  }

  unregister(type: string): void {
    this.nodes.delete(type);
    this.schemas.delete(type);
    this.logger.info(`Unregistered node type: ${type}`);
  }

  get(type: string): any {
    return this.nodes.get(type);
  }

  list(): string[] {
    return Array.from(this.nodes.keys());
  }

  exists(type: string): boolean {
    return this.nodes.has(type);
  }

  getSchema(type: string): NodeConfiguration | undefined {
    return this.schemas.get(type);
  }

  listByCategory(category: string): string[] {
    return this.list().filter(type => {
      const schema = this.getSchema(type);
      return schema?.category === category;
    });
  }

  validateConfig(type: string, config: any): boolean {
    const schema = this.schemas.get(type);
    if (!schema) {
      this.logger.warn(`No schema found for node type: ${type}`);
      return false;
    }

    // Basic validation - check required inputs are present
    for (const [inputName, inputSchema] of Object.entries(schema.inputs)) {
      if (inputSchema.required && !(inputName in config)) {
        this.logger.error(`Missing required input: ${inputName} for node type: ${type}`);
        return false;
      }
    }

    return true;
  }
}

export class DefaultNodeFactory implements NodeFactory {
  private registry: NodeRegistry;
  private logger: Logger;

  constructor(registry: NodeRegistry, logger: Logger) {
    this.registry = registry;
    this.logger = logger;
  }

  createNode(type: string, config: any): WorkflowNode {
    const NodeClass = this.registry.get(type);
    
    if (!NodeClass) {
      throw new Error(`Unknown node type: ${type}`);
    }

    if (!this.registry.validateConfig(type, config)) {
      throw new Error(`Invalid configuration for node type: ${type}`);
    }

    try {
      const nodeId = config.id || `${type}-${Date.now()}`;
      const node = new NodeClass(nodeId, config);
      
      this.logger.debug(`Created node instance`, {
        nodeId,
        nodeType: type
      });

      return node;
    } catch (error) {
      this.logger.error(`Failed to create node`, {
        nodeType: type,
        error
      });
      throw error;
    }
  }

  listNodeTypes(): string[] {
    return this.registry.list();
  }

  getNodeSchema(type: string): NodeConfiguration | undefined {
    return this.registry.getSchema(type);
  }

  validateNodeConfig(type: string, config: any): boolean {
    return this.registry.validateConfig(type, config);
  }
}