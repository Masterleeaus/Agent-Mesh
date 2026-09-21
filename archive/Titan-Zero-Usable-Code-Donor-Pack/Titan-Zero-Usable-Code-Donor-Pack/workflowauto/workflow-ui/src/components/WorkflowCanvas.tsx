import React, { useCallback, useRef, useMemo } from 'react';
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  MiniMap,
  NodeTypes,
  EdgeTypes,
  ConnectionMode,
  ReactFlowInstance,
  BackgroundVariant,
} from 'reactflow';

import { WorkflowNode } from './nodes/WorkflowNode';
import { WorkflowEdge } from './edges/WorkflowEdge';
import { ExecutionPanel } from './panels/ExecutionPanel';
import { useWorkflowStore } from '@/hooks/useWorkflowStore';

const nodeTypes: NodeTypes = { workflowNode: WorkflowNode };
const edgeTypes: EdgeTypes = { workflowEdge: WorkflowEdge };

export const WorkflowCanvas: React.FC = () => {
  const {
    nodes,
    edges,
    setNodes,
    setEdges,
    setSelectedNode,
    isExecuting,
    executionResult,
  } = useWorkflowStore();

  const [rfNodes, setRfNodes, onNodesChange] = useNodesState(nodes);
  const [rfEdges, setRfEdges, onEdgesChange] = useEdgesState(edges);
  const rfInstance = useRef<ReactFlowInstance | null>(null);
  const [isDragOver, setIsDragOver] = React.useState(false);

  // Sync store → ReactFlow
  React.useEffect(() => { setRfNodes(nodes); }, [nodes]);
  React.useEffect(() => { setRfEdges(edges); }, [edges]);

  // Sync ReactFlow → store
  React.useEffect(() => { setNodes(rfNodes); }, [rfNodes]);
  React.useEffect(() => { setEdges(rfEdges); }, [rfEdges]);

  const onConnect = useCallback((params: Edge | Connection) => {
    setRfEdges(eds => addEdge({ ...params, id: `edge-${Date.now()}`, type: 'workflowEdge' } as Edge, eds));
  }, [setRfEdges]);

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  }, [setSelectedNode]);

  const onPaneClick = useCallback(() => setSelectedNode(null), [setSelectedNode]);
  const onInit = useCallback((i: ReactFlowInstance) => { rfInstance.current = i; }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const nodeType = e.dataTransfer.getData('application/reactflow');
    if (!nodeType) return;

    const bounds = (e.currentTarget as Element).getBoundingClientRect();
    const pos = rfInstance.current
      ? rfInstance.current.project({ x: e.clientX - bounds.left, y: e.clientY - bounds.top })
      : { x: e.clientX - bounds.left - 110, y: e.clientY - bounds.top - 40 };

    setRfNodes(nds => [...nds, {
      id: `${nodeType}-${Date.now()}`,
      type: 'workflowNode',
      position: pos,
      data: { nodeType, inputs: {}, config: {} },
    }]);
  }, [setRfNodes]);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsDragOver(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    if (!(e.currentTarget as Element).contains(e.relatedTarget as Element)) setIsDragOver(false);
  }, []);

  const nodeColor = useCallback((node: Node) => {
    const t = node.data?.nodeType || '';
    if (t.startsWith('aspire_')) return '#3b82f6';
    if (t.startsWith('ai_')) return '#a855f7';
    if (['conditional','transform','loop'].includes(t)) return '#22c55e';
    return '#f59e0b';
  }, []);

  const executionStatus = useMemo(() =>
    Object.entries(executionResult?.nodeResults || {}).reduce((acc, [id, r]) => {
      acc[id] = r.success ? 'completed' : 'failed';
      return acc;
    }, {} as Record<string, string>),
  [executionResult]);

  const isEmpty = rfNodes.length === 0;

  return (
    <div className="w-full h-full relative">
      {/* Empty state */}
      {isEmpty && (
        <div
          className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none"
          style={{ fontFamily: "'Outfit', sans-serif" }}
        >
          <div className="text-center" style={{ color: 'var(--text-muted)' }}>
            <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.3 }}>⬡</div>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6, color: 'var(--text-secondary)' }}>
              Drop nodes to start building
            </div>
            <div style={{ fontSize: 12, opacity: 0.6 }}>
              Drag from the left panel · Connect nodes · Run workflow
            </div>
          </div>
        </div>
      )}

      <ReactFlow
        ref={rfInstance as any}
        nodes={rfNodes}
        edges={rfEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onInit={onInit}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        connectionMode={ConnectionMode.Loose}
        fitView
        snapToGrid
        snapGrid={[16, 16]}
        minZoom={0.3}
        maxZoom={2}
        style={{ background: isDragOver ? 'rgba(91,91,214,0.03)' : undefined }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1.2}
          color="#1c1c2c"
        />
        <Controls />
        <MiniMap
          nodeColor={nodeColor}
          nodeStrokeWidth={1}
          zoomable
          pannable
        />

        {/* Execution overlay */}
        <ExecutionPanel
          isExecuting={isExecuting}
          executionResult={executionResult}
          executionStatus={executionStatus}
        />
      </ReactFlow>
    </div>
  );
};
