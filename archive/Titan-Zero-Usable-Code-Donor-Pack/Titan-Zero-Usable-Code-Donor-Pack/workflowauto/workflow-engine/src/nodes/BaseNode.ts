/**
 * Base Node implementation providing common functionality
 * All workflow nodes extend from this base class
 */

import { WorkflowNode, ExecutionContext, NodeResult, NodeConfiguration } from '../types/workflow';

export abstract class BaseNode implements WorkflowNode {
  public readonly id: string;
  public readonly type: string;
  public inputs: Record<string, any>;
  public outputs: Record<string, any>;
  public config: NodeConfiguration;

  constructor(id: string, nodeDefinition: any) {
    this.id = id;
    this.type = nodeDefinition.type;
    this.inputs = nodeDefinition.inputs || {};
    this.outputs = {};
    this.config = this.getConfiguration();
  }

  abstract execute(context: ExecutionContext): Promise<NodeResult>;
  abstract getConfiguration(): NodeConfiguration;

  protected validateInputs(context: ExecutionContext): void {
    for (const [inputName, inputSchema] of Object.entries(this.config.inputs)) {
      if (inputSchema.required && !(inputName in context.inputs)) {
        throw new Error(`Missing required input: ${inputName}`);
      }
    }
  }

  protected createSuccessResult(outputs: Record<string, any>): NodeResult {
    return {
      success: true,
      outputs,
      metadata: {
        executionTime: 0, // Will be set by engine
        retryCount: 0
      }
    };
  }

  protected createErrorResult(
    code: string, 
    message: string, 
    details?: any
  ): NodeResult {
    return {
      success: false,
      outputs: {},
      error: {
        code,
        message,
        details
      },
      metadata: {
        executionTime: 0, // Will be set by engine
        retryCount: 0
      }
    };
  }
}