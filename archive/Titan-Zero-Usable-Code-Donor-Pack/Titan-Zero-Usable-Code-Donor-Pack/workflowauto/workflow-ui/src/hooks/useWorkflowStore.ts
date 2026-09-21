/**
 * Zustand store for workflow state management
 * Centralized state for nodes, edges, execution status, etc.
 */

import { create } from 'zustand';
import { Node, Edge } from 'reactflow';
import { WorkflowDefinition, ExecutionResult, NodeType } from '@/types/workflow';
import { WorkflowAPI } from '@/services/WorkflowAPI';

interface WorkflowStore {
  // Workflow definition
  workflowId: string;
  workflowName: string;
  workflowDescription: string;
  
  // ReactFlow state
  nodes: Node[];
  edges: Edge[];
  selectedNode: Node | null;
  
  // Available node types
  nodeTypes: NodeType[];
  isLoadingNodeTypes: boolean;
  
  // Execution state
  isExecuting: boolean;
  executionResult: ExecutionResult | null;
  
  // Actions
  setWorkflowMetadata: (metadata: { id: string; name: string; description: string }) => void;
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  setSelectedNode: (node: Node | null) => void;
  
  loadNodeTypes: () => Promise<void>;
  executeWorkflow: (triggerData?: any) => Promise<void>;
  clearExecution: () => void;
  
  // Workflow management
  saveWorkflow: () => WorkflowDefinition;
  loadWorkflow: (workflow: WorkflowDefinition) => void;
  resetWorkflow: () => void;
}

export const useWorkflowStore = create<WorkflowStore>((set, get) => ({
  // Initial state
  workflowId: `workflow-${Date.now()}`,
  workflowName: 'Untitled Workflow',
  workflowDescription: '',
  
  nodes: [],
  edges: [],
  selectedNode: null,
  
  nodeTypes: [],
  isLoadingNodeTypes: false,
  
  isExecuting: false,
  executionResult: null,
  
  // Actions
  setWorkflowMetadata: (metadata) => {
    set({
      workflowId: metadata.id,
      workflowName: metadata.name,
      workflowDescription: metadata.description,
    });
  },
  
  setNodes: (nodes) => {
    set({ nodes });
  },
  
  setEdges: (edges) => {
    set({ edges });
  },
  
  setSelectedNode: (node) => {
    set({ selectedNode: node });
  },
  
  loadNodeTypes: async () => {
    set({ isLoadingNodeTypes: true });
    
    try {
      const nodeTypes = await WorkflowAPI.getNodeTypes();
      set({ nodeTypes, isLoadingNodeTypes: false });
    } catch (error) {
      console.error('Failed to load node types:', error);
      set({ isLoadingNodeTypes: false });
    }
  },
  
  executeWorkflow: async (triggerData) => {
    const { nodes, edges, workflowId, workflowName, workflowDescription } = get();
    
    set({ isExecuting: true, executionResult: null });
    
    try {
      const workflow = WorkflowAPI.convertToWorkflowDefinition(
        nodes,
        edges,
        {
          id: workflowId,
          name: workflowName,
          description: workflowDescription,
        }
      );
      
      // Validate workflow first
      const validationErrors = WorkflowAPI.validateWorkflow(workflow);
      if (validationErrors.length > 0) {
        throw new Error(`Workflow validation failed: ${validationErrors.join(', ')}`);
      }
      
      const result = await WorkflowAPI.executeWorkflow(workflow, triggerData);
      set({ executionResult: result, isExecuting: false });
      
    } catch (error) {
      console.error('Workflow execution failed:', error);
      set({ 
        isExecuting: false,
        executionResult: {
          executionId: 'failed',
          workflowId,
          status: 'failed',
          startTime: new Date().toISOString(),
          nodeResults: {},
          error: {
            nodeId: 'workflow',
            error: error instanceof Error ? error.message : String(error),
          },
          metrics: {
            totalNodes: 0,
            completedNodes: 0,
            failedNodes: 0,
            totalExecutionTime: 0,
          },
        },
      });
    }
  },
  
  clearExecution: () => {
    set({ executionResult: null, isExecuting: false });
  },
  
  saveWorkflow: () => {
    const { nodes, edges, workflowId, workflowName, workflowDescription } = get();
    
    return WorkflowAPI.convertToWorkflowDefinition(
      nodes,
      edges,
      {
        id: workflowId,
        name: workflowName,
        description: workflowDescription,
      }
    );
  },
  
  loadWorkflow: (workflow) => {
    const { nodes, edges } = WorkflowAPI.convertFromWorkflowDefinition(workflow);
    
    set({
      workflowId: workflow.id,
      workflowName: workflow.name,
      workflowDescription: workflow.description,
      nodes,
      edges,
      selectedNode: null,
      executionResult: null,
    });
  },
  
  resetWorkflow: () => {
    set({
      workflowId: `workflow-${Date.now()}`,
      workflowName: 'Untitled Workflow',
      workflowDescription: '',
      nodes: [],
      edges: [],
      selectedNode: null,
      executionResult: null,
    });
  },
}));