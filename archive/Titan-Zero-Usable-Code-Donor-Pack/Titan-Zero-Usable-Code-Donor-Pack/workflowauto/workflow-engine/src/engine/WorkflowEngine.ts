/**
 * Core Workflow Engine implementation
 * Following POC roadmap Milestone 1.1 specifications
 */

import { 
  WorkflowDefinition, 
  WorkflowNode, 
  ExecutionContext, 
  ExecutionResult, 
  NodeResult,
  WorkflowInstance 
} from '../types/workflow';
import { NodeRegistry } from '../types/nodes';
import { Logger } from '../services/Logger';
import { StateManager } from '../services/StateManager';
import { v4 as uuidv4 } from 'uuid';

export interface WorkflowEngine {
  executeWorkflow(workflow: WorkflowDefinition, triggerData?: any): Promise<ExecutionResult>;
  executeNode(node: WorkflowNode, context: ExecutionContext): Promise<NodeResult>;
  pauseExecution(executionId: string): Promise<void>;
  cancelExecution(executionId: string): Promise<void>;
  getExecutionStatus(executionId: string): Promise<WorkflowInstance>;
}

export class DefaultWorkflowEngine implements WorkflowEngine {
  private nodeRegistry: NodeRegistry;
  private stateManager: StateManager;
  private logger: Logger;
  private runningExecutions = new Map<string, WorkflowInstance>();

  constructor(
    nodeRegistry: NodeRegistry,
    stateManager: StateManager,
    logger: Logger
  ) {
    this.nodeRegistry = nodeRegistry;
    this.stateManager = stateManager;
    this.logger = logger;
  }

  async executeWorkflow(
    workflow: WorkflowDefinition, 
    triggerData?: any
  ): Promise<ExecutionResult> {
    const executionId = uuidv4();
    const startTime = new Date();
    
    this.logger.info(`Starting workflow execution`, {
      executionId,
      workflowId: workflow.id,
      workflowName: workflow.name
    });

    // Create workflow instance
    const instance: WorkflowInstance = {
      id: executionId,
      workflowId: workflow.id,
      status: 'running',
      createdAt: startTime,
      startedAt: startTime,
      triggerData,
      executionContext: {}
    };

    this.runningExecutions.set(executionId, instance);
    await this.stateManager.saveInstance(instance);

    try {
      // Build execution order from workflow definition
      const executionOrder = this.buildExecutionOrder(workflow);
      
      // Initialize result tracking
      const nodeResults: Record<string, NodeResult> = {};
      const nodeOutputs: Record<string, any> = {};
      
      // Execute nodes in order
      let currentStep = 0;
      for (const nodeId of executionOrder) {
        currentStep++;
        const nodeDefinition = workflow.nodes[nodeId];
        
        if (!nodeDefinition) {
          throw new Error(`Node definition not found: ${nodeId}`);
        }

        // Get node instance from registry
        const nodeClass = this.nodeRegistry.get(nodeDefinition.type);
        if (!nodeClass) {
          throw new Error(`Unknown node type: ${nodeDefinition.type}`);
        }

        const node: WorkflowNode = new nodeClass(nodeId, nodeDefinition);

        // Build execution context
        const context: ExecutionContext = {
          executionId,
          workflowId: workflow.id,
          nodeId,
          inputs: this.resolveInputs(nodeDefinition.inputs, nodeOutputs),
          variables: {},
          nodeOutputs,
          startTime,
          currentStep,
          totalSteps: executionOrder.length,
          credentials: this.stateManager.getCredentialManager(),
          logger: this.logger
        };

        // Update instance status
        instance.currentNode = nodeId;
        instance.status = 'running';
        await this.stateManager.saveInstance(instance);

        this.logger.info(`Executing node ${nodeId}`, {
          executionId,
          nodeType: nodeDefinition.type,
          step: currentStep,
          totalSteps: executionOrder.length
        });

        // Execute node with error handling
        const nodeResult = await this.executeNode(node, context);
        nodeResults[nodeId] = nodeResult;

        if (!nodeResult.success) {
          // Handle node failure based on workflow settings
          const shouldContinue = await this.handleNodeFailure(
            workflow, 
            nodeId, 
            nodeResult, 
            context
          );

          if (!shouldContinue) {
            const error = {
              nodeId,
              error: nodeResult.error
            };

            instance.status = 'failed';
            instance.completedAt = new Date();
            await this.stateManager.saveInstance(instance);
            this.runningExecutions.delete(executionId);

            return this.buildExecutionResult(
              executionId,
              workflow.id,
              startTime,
              new Date(),
              'failed',
              nodeResults,
              error
            );
          }
        }

        // Store node outputs for subsequent nodes
        if (nodeResult.outputs) {
          nodeOutputs[nodeId] = nodeResult.outputs;
        }
      }

      // Workflow completed successfully
      const endTime = new Date();
      instance.status = 'completed';
      instance.completedAt = endTime;
      await this.stateManager.saveInstance(instance);
      this.runningExecutions.delete(executionId);

      this.logger.info(`Workflow execution completed`, {
        executionId,
        executionTime: endTime.getTime() - startTime.getTime(),
        totalNodes: executionOrder.length
      });

      return this.buildExecutionResult(
        executionId,
        workflow.id,
        startTime,
        endTime,
        'completed',
        nodeResults
      );

    } catch (error) {
      this.logger.error(`Workflow execution failed`, {
        executionId,
        error: error instanceof Error ? error.message : String(error)
      });

      instance.status = 'failed';
      instance.completedAt = new Date();
      await this.stateManager.saveInstance(instance);
      this.runningExecutions.delete(executionId);

      return this.buildExecutionResult(
        executionId,
        workflow.id,
        startTime,
        new Date(),
        'failed',
        {},
        { nodeId: 'workflow', error }
      );
    }
  }

  async executeNode(node: WorkflowNode, context: ExecutionContext): Promise<NodeResult> {
    const startTime = Date.now();
    
    try {
      this.logger.debug(`Executing node ${context.nodeId}`, {
        executionId: context.executionId,
        nodeType: node.type,
        inputs: context.inputs
      });

      const result = await node.execute(context);
      const executionTime = Date.now() - startTime;

      this.logger.debug(`Node execution completed`, {
        executionId: context.executionId,
        nodeId: context.nodeId,
        success: result.success,
        executionTime
      });

      return {
        ...result,
        metadata: {
          ...result.metadata,
          executionTime,
          retryCount: result.metadata?.retryCount || 0
        }
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;
      
      this.logger.error(`Node execution failed`, {
        executionId: context.executionId,
        nodeId: context.nodeId,
        error: error instanceof Error ? error.message : String(error),
        executionTime
      });

      return {
        success: false,
        outputs: {},
        error: {
          code: 'EXECUTION_ERROR',
          message: error instanceof Error ? error.message : String(error),
          details: error
        },
        metadata: {
          executionTime,
          retryCount: 0
        }
      };
    }
  }

  async pauseExecution(executionId: string): Promise<void> {
    const instance = this.runningExecutions.get(executionId);
    if (instance) {
      instance.status = 'pending'; // Use pending as paused state
      await this.stateManager.saveInstance(instance);
      this.logger.info(`Execution paused`, { executionId });
    }
  }

  async cancelExecution(executionId: string): Promise<void> {
    const instance = this.runningExecutions.get(executionId);
    if (instance) {
      instance.status = 'cancelled';
      instance.completedAt = new Date();
      await this.stateManager.saveInstance(instance);
      this.runningExecutions.delete(executionId);
      this.logger.info(`Execution cancelled`, { executionId });
    }
  }

  async getExecutionStatus(executionId: string): Promise<WorkflowInstance> {
    const instance = this.runningExecutions.get(executionId) || 
                    await this.stateManager.getInstance(executionId);
    
    if (!instance) {
      throw new Error(`Execution not found: ${executionId}`);
    }
    
    return instance;
  }

  private buildExecutionOrder(workflow: WorkflowDefinition): string[] {
    // Simple topological sort based on connections
    // For POC, implement basic sequential execution
    const nodes = Object.keys(workflow.nodes);
    const visited = new Set<string>();
    const order: string[] = [];

    // Find entry point (node with no incoming connections)
    const hasIncoming = new Set(workflow.connections.map(c => c.target));
    const entryPoints = nodes.filter(nodeId => !hasIncoming.has(nodeId));

    if (entryPoints.length === 0 && nodes.length > 0) {
      // Fallback: start with first node if no clear entry point
      return nodes;
    }

    // Simple DFS traversal
    const visit = (nodeId: string) => {
      if (visited.has(nodeId)) return;
      visited.add(nodeId);
      order.push(nodeId);

      // Find connected nodes
      const outgoing = workflow.connections
        .filter(c => c.source === nodeId)
        .map(c => c.target);
      
      outgoing.forEach(visit);
    };

    entryPoints.forEach(visit);
    
    // Add any remaining nodes
    nodes.forEach(nodeId => {
      if (!visited.has(nodeId)) {
        order.push(nodeId);
      }
    });

    return order;
  }

  private resolveInputs(
    inputDefinition: Record<string, any>, 
    nodeOutputs: Record<string, any>
  ): Record<string, any> {
    const resolved: Record<string, any> = {};

    for (const [key, value] of Object.entries(inputDefinition)) {
      if (typeof value === 'string' && value.includes('{{')) {
        // Simple template resolution: {{nodeId.outputs.field}}
        const templatePattern = /\{\{([^}]+)\}\}/g;
        let resolvedValue = value;
        
        let match;
        while ((match = templatePattern.exec(value)) !== null) {
          const path = match[1];
          const pathValue = this.getNestedValue(nodeOutputs, path);
          resolvedValue = resolvedValue.replace(match[0], String(pathValue || ''));
        }
        
        resolved[key] = resolvedValue;
      } else {
        resolved[key] = value;
      }
    }

    return resolved;
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }

  private async handleNodeFailure(
    workflow: WorkflowDefinition,
    nodeId: string,
    nodeResult: NodeResult,
    context: ExecutionContext
  ): Promise<boolean> {
    const errorHandling = workflow.settings.errorHandling;
    
    // Check if error is retryable
    if (nodeResult.error && errorHandling.retryPolicy.retryableErrors.includes(nodeResult.error.code)) {
      const retryCount = nodeResult.metadata?.retryCount || 0;
      
      if (retryCount < errorHandling.retryPolicy.maxRetries) {
        this.logger.info(`Retrying failed node`, {
          executionId: context.executionId,
          nodeId,
          retryCount: retryCount + 1,
          error: nodeResult.error
        });
        
        // Implement retry logic here
        return true;
      }
    }

    // Check if workflow should continue on error
    if (errorHandling.fallbackBehavior.continueOnError) {
      this.logger.warn(`Continuing workflow despite node failure`, {
        executionId: context.executionId,
        nodeId,
        error: nodeResult.error
      });
      return true;
    }

    return false;
  }

  private buildExecutionResult(
    executionId: string,
    workflowId: string,
    startTime: Date,
    endTime: Date,
    status: 'completed' | 'failed' | 'cancelled',
    nodeResults: Record<string, NodeResult>,
    error?: { nodeId: string; error: any }
  ): ExecutionResult {
    const nodeIds = Object.keys(nodeResults);
    const completedNodes = nodeIds.filter(id => nodeResults[id].success).length;
    const failedNodes = nodeIds.filter(id => !nodeResults[id].success).length;

    return {
      executionId,
      workflowId,
      status,
      startTime,
      endTime,
      nodeResults,
      error,
      metrics: {
        totalNodes: nodeIds.length,
        completedNodes,
        failedNodes,
        totalExecutionTime: endTime.getTime() - startTime.getTime()
      }
    };
  }
}