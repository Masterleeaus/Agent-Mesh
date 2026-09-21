/**
 * Conditional Logic Node
 * Provides if/else branching logic for workflows
 * Following POC roadmap Milestone 1.2 specifications
 */

import { ExecutionContext, NodeResult, NodeConfiguration } from '../../types/workflow';
import { BaseNode } from '../BaseNode';

export class ConditionalNode extends BaseNode {
  getConfiguration(): NodeConfiguration {
    return {
      name: 'Conditional',
      description: 'Executes conditional branching logic (if/else)',
      category: 'logic',
      inputs: {
        condition: {
          type: 'string',
          required: true,
          description: 'JavaScript expression to evaluate (e.g., "data.value > 100")'
        },
        data: {
          type: 'object',
          required: false,
          description: 'Data object to use in condition evaluation'
        },
        true_value: {
          type: 'object',
          required: false,
          description: 'Value to output when condition is true'
        },
        false_value: {
          type: 'object',
          required: false,
          description: 'Value to output when condition is false'
        }
      },
      outputs: {
        result: {
          type: 'boolean',
          description: 'Result of condition evaluation'
        },
        output: {
          type: 'object',
          description: 'The selected true_value or false_value'
        },
        branch: {
          type: 'string',
          description: 'Which branch was taken ("true" or "false")'
        }
      }
    };
  }

  async execute(context: ExecutionContext): Promise<NodeResult> {
    try {
      this.validateInputs(context);

      const { 
        condition, 
        data = {}, 
        true_value, 
        false_value 
      } = context.inputs;

      context.logger.info(`Evaluating conditional logic`, {
        executionId: context.executionId,
        nodeId: context.nodeId,
        condition
      });

      // Safe evaluation of condition
      const result = this.evaluateCondition(condition, data, context);
      
      const branch = result ? 'true' : 'false';
      const output = result ? true_value : false_value;

      context.logger.info(`Conditional evaluation completed`, {
        executionId: context.executionId,
        nodeId: context.nodeId,
        result,
        branch
      });

      return this.createSuccessResult({
        result,
        output,
        branch
      });

    } catch (error) {
      context.logger.error(`Failed to evaluate conditional logic`, {
        executionId: context.executionId,
        nodeId: context.nodeId,
        error: error instanceof Error ? error.message : String(error)
      });

      return this.createErrorResult(
        'EVALUATION_ERROR',
        error instanceof Error ? error.message : String(error),
        error
      );
    }
  }

  private evaluateCondition(
    condition: string, 
    data: any, 
    context: ExecutionContext
  ): boolean {
    // Simple safe evaluation for POC
    // In production, use a proper expression evaluator like JSONata
    
    try {
      // Create safe evaluation context
      const evalContext = {
        data,
        nodeOutputs: context.nodeOutputs,
        variables: context.variables
      };

      // Simple pattern matching for common conditions
      if (condition.includes('data.')) {
        return this.evaluateDataCondition(condition, data);
      }

      if (condition.includes('nodeOutputs.')) {
        return this.evaluateNodeOutputCondition(condition, context.nodeOutputs);
      }

      // Fallback to basic boolean evaluation
      if (condition === 'true') return true;
      if (condition === 'false') return false;

      // Simple numeric comparisons
      const numericMatch = condition.match(/(\d+(?:\.\d+)?)\s*([><=!]+)\s*(\d+(?:\.\d+)?)/);
      if (numericMatch) {
        const left = parseFloat(numericMatch[1]);
        const operator = numericMatch[2];
        const right = parseFloat(numericMatch[3]);

        switch (operator) {
          case '>': return left > right;
          case '<': return left < right;
          case '>=': return left >= right;
          case '<=': return left <= right;
          case '==': return left === right;
          case '!=': return left !== right;
          default: return false;
        }
      }

      // Default to false for safety
      context.logger.warn(`Unable to evaluate condition, defaulting to false`, {
        condition
      });
      return false;

    } catch (error) {
      context.logger.error(`Error evaluating condition`, {
        condition,
        error: error instanceof Error ? error.message : String(error)
      });
      throw new Error(`Failed to evaluate condition: ${condition}`);
    }
  }

  private evaluateDataCondition(condition: string, data: any): boolean {
    // Simple data property checks
    if (condition.includes('data.length')) {
      const lengthMatch = condition.match(/data\.length\s*([><=!]+)\s*(\d+)/);
      if (lengthMatch && Array.isArray(data)) {
        const operator = lengthMatch[1];
        const value = parseInt(lengthMatch[2]);
        
        switch (operator) {
          case '>': return data.length > value;
          case '<': return data.length < value;
          case '>=': return data.length >= value;
          case '<=': return data.length <= value;
          case '==': return data.length === value;
          case '!=': return data.length !== value;
        }
      }
    }

    // Property existence checks
    const existsMatch = condition.match(/data\.(\w+)/);
    if (existsMatch) {
      const property = existsMatch[1];
      return data && data[property] !== undefined && data[property] !== null;
    }

    return false;
  }

  private evaluateNodeOutputCondition(condition: string, nodeOutputs: any): boolean {
    // Check node output properties
    const outputMatch = condition.match(/nodeOutputs\.(\w+)\.(\w+)/);
    if (outputMatch) {
      const nodeId = outputMatch[1];
      const property = outputMatch[2];
      
      return nodeOutputs[nodeId] && 
             nodeOutputs[nodeId][property] !== undefined && 
             nodeOutputs[nodeId][property] !== null;
    }

    return false;
  }
}