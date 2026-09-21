/**
 * API service for communicating with workflow engine
 */

import axios from 'axios';
import { WorkflowDefinition, ExecutionResult, ExecutionInstance, NodeType } from '@/types/workflow';

const API_BASE_URL = 'http://localhost:8004';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging
api.interceptors.request.use((config) => {
  console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`, config.data);
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log(`[API] Response:`, response.data);
    return response;
  },
  (error) => {
    console.error(`[API] Error:`, error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export class WorkflowAPI {
  /**
   * Get service health status
   */
  static async getHealth(): Promise<any> {
    const response = await api.get('/health');
    return response.data;
  }

  /**
   * Execute a workflow
   */
  static async executeWorkflow(
    workflow: WorkflowDefinition, 
    triggerData?: any
  ): Promise<ExecutionResult> {
    const response = await api.post('/workflows/execute', {
      workflow,
      triggerData
    });
    
    if (!response.data.success) {
      throw new Error(response.data.error);
    }
    
    return response.data.result;
  }

  /**
   * Get execution status
   */
  static async getExecutionStatus(executionId: string): Promise<ExecutionInstance> {
    const response = await api.get(`/executions/${executionId}`);
    
    if (!response.data.success) {
      throw new Error(response.data.error);
    }
    
    return response.data.instance;
  }

  /**
   * Pause workflow execution
   */
  static async pauseExecution(executionId: string): Promise<void> {
    const response = await api.post(`/executions/${executionId}/pause`);
    
    if (!response.data.success) {
      throw new Error(response.data.error);
    }
  }

  /**
   * Cancel workflow execution
   */
  static async cancelExecution(executionId: string): Promise<void> {
    const response = await api.post(`/executions/${executionId}/cancel`);
    
    if (!response.data.success) {
      throw new Error(response.data.error);
    }
  }

  /**
   * Get available node types
   */
  static async getNodeTypes(): Promise<NodeType[]> {
    const response = await api.get('/nodes');
    
    if (!response.data.success) {
      throw new Error(response.data.error);
    }
    
    return response.data.nodeTypes;
  }

  /**
   * Validate workflow definition
   */
  static validateWorkflow(workflow: WorkflowDefinition): string[] {
    const errors: string[] = [];
    
    // Basic validation
    if (!workflow.id) {
      errors.push('Workflow ID is required');
    }
    
    if (!workflow.name) {
      errors.push('Workflow name is required');
    }
    
    if (!workflow.nodes || Object.keys(workflow.nodes).length === 0) {
      errors.push('Workflow must have at least one node');
    }
    
    // Node validation
    for (const [nodeId, node] of Object.entries(workflow.nodes)) {
      if (!node.type) {
        errors.push(`Node ${nodeId} is missing type`);
      }
      
      if (!node.position) {
        errors.push(`Node ${nodeId} is missing position`);
      }
    }
    
    // Connection validation
    for (const connection of workflow.connections) {
      if (!workflow.nodes[connection.source]) {
        errors.push(`Connection references unknown source node: ${connection.source}`);
      }
      
      if (!workflow.nodes[connection.target]) {
        errors.push(`Connection references unknown target node: ${connection.target}`);
      }
    }
    
    return errors;
  }

  /**
   * Convert ReactFlow nodes/edges to workflow definition
   */
  static convertToWorkflowDefinition(
    nodes: any[], 
    edges: any[], 
    metadata: { id: string; name: string; description: string }
  ): WorkflowDefinition {
    const workflowNodes: Record<string, any> = {};
    const connections: any[] = [];
    
    // Convert nodes
    nodes.forEach(node => {
      workflowNodes[node.id] = {
        type: node.data.nodeType,
        position: node.position,
        inputs: node.data.inputs || {},
        config: node.data.config || {}
      };
    });
    
    // Convert edges
    edges.forEach(edge => {
      connections.push({
        source: edge.source,
        target: edge.target,
        sourceOutput: edge.data?.sourceOutput,
        targetInput: edge.data?.targetInput
      });
    });
    
    return {
      ...metadata,
      version: '1.0.0',
      trigger: {
        type: 'manual',
        config: {}
      },
      nodes: workflowNodes,
      connections,
      settings: {
        timeout: 300000, // 5 minutes
        retryPolicy: {
          maxRetries: 3,
          backoffStrategy: 'exponential',
          baseDelay: 1000,
          maxDelay: 30000,
          retryableErrors: ['TIMEOUT_ERROR', 'NETWORK_ERROR']
        },
        errorHandling: {
          retryPolicy: {
            maxRetries: 3,
            backoffStrategy: 'exponential',
            baseDelay: 1000,
            maxDelay: 30000,
            retryableErrors: ['TIMEOUT_ERROR', 'NETWORK_ERROR']
          },
          fallbackBehavior: {
            continueOnError: false
          },
          notifications: {
            onError: [],
            onFailure: []
          }
        }
      }
    };
  }

  /**
   * Convert workflow definition to ReactFlow nodes/edges
   */
  static convertFromWorkflowDefinition(workflow: WorkflowDefinition): {
    nodes: any[];
    edges: any[];
  } {
    const nodes: any[] = [];
    const edges: any[] = [];
    
    // Convert nodes
    Object.entries(workflow.nodes).forEach(([nodeId, node]) => {
      nodes.push({
        id: nodeId,
        type: 'workflowNode',
        position: node.position,
        data: {
          nodeType: node.type,
          inputs: node.inputs,
          config: node.config
        }
      });
    });
    
    // Convert connections to edges
    workflow.connections.forEach((connection, index) => {
      edges.push({
        id: `edge-${index}`,
        source: connection.source,
        target: connection.target,
        data: {
          sourceOutput: connection.sourceOutput,
          targetInput: connection.targetInput
        }
      });
    });
    
    return { nodes, edges };
  }
}