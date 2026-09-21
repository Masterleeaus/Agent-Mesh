/**
 * Node library panel showing categorized nodes for drag-drop
 */

import React, { useEffect, useState } from 'react';
import { useWorkflowStore } from '@/hooks/useWorkflowStore';
import { NodeCategory } from '@/types/workflow';

const NODE_CATEGORIES: NodeCategory[] = [
  {
    name: 'SaaS Integration',
    description: 'Connect to external SaaS platforms',
    color: 'blue',
    nodes: []
  },
  {
    name: 'AI Enhancement',
    description: 'AI-powered text and content generation',
    color: 'purple', 
    nodes: []
  },
  {
    name: 'Logic & Flow',
    description: 'Conditional logic and workflow control',
    color: 'green',
    nodes: []
  },
  {
    name: 'Utilities',
    description: 'Data transformation and utility functions',
    color: 'orange',
    nodes: []
  }
];

interface NodeLibraryProps {
  className?: string;
}

export const NodeLibrary: React.FC<NodeLibraryProps> = ({ className }) => {
  const { nodeTypes, loadNodeTypes, isLoadingNodeTypes } = useWorkflowStore();
  const [categories, setCategories] = useState<NodeCategory[]>(NODE_CATEGORIES);

  useEffect(() => {
    loadNodeTypes();
  }, [loadNodeTypes]);

  useEffect(() => {
    if (nodeTypes.length > 0) {
      const categorizedNodes = [...NODE_CATEGORIES];
      
      nodeTypes.forEach(nodeType => {
        const category = getNodeCategory(nodeType.type);
        const categoryIndex = categorizedNodes.findIndex(cat => 
          getCategoryName(category) === cat.name
        );
        
        if (categoryIndex !== -1) {
          categorizedNodes[categoryIndex].nodes.push(nodeType);
        }
      });
      
      setCategories(categorizedNodes);
    }
  }, [nodeTypes]);

  const getNodeCategory = (nodeType: string): string => {
    if (nodeType.startsWith('aspire_')) return 'saas';
    if (nodeType.startsWith('ai_')) return 'ai';
    if (['conditional', 'transform'].includes(nodeType)) return 'logic';
    return 'utility';
  };

  const getCategoryName = (category: string): string => {
    const categoryMap: Record<string, string> = {
      'saas': 'SaaS Integration',
      'ai': 'AI Enhancement', 
      'logic': 'Logic & Flow',
      'utility': 'Utilities'
    };
    return categoryMap[category] || 'Utilities';
  };

  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  const getNodeDisplayName = (nodeType: string): string => {
    return nodeType
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const getNodeDescription = (nodeType: string): string => {
    const descriptions: Record<string, string> = {
      'aspire_fetch_opportunity': 'Fetch opportunity data from Aspire platform',
      'aspire_create_proposal': 'Create new proposal in Aspire system',
      'ai_text_generation': 'Generate text content using AI models',
      'conditional': 'Add conditional logic to workflow execution',
      'transform': 'Transform and map data between nodes'
    };
    return descriptions[nodeType] || 'Custom workflow node';
  };

  if (isLoadingNodeTypes) {
    return (
      <div className={`workflow-panel ${className}`}>
        <h3>Node Library</h3>
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`workflow-panel ${className}`}>
      <h3>Node Library</h3>
      <div className="text-sm text-muted-foreground mb-4">
        Drag nodes to the canvas to build your workflow
      </div>

      <div className="space-y-4">
        {categories.map(category => (
          <div key={category.name} className="space-y-2">
            <div className="font-medium text-sm flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full bg-${category.color}-500`} />
              {category.name}
            </div>
            <div className="text-xs text-muted-foreground mb-2">
              {category.description}
            </div>
            
            <div className="space-y-1">
              {category.nodes.map(nodeType => (
                <div
                  key={nodeType.type}
                  className={`
                    p-3 rounded-lg border-2 border-dashed cursor-grab
                    hover:border-solid hover:shadow-sm transition-all
                    node-category-${getNodeCategory(nodeType.type)}
                    bg-opacity-50 hover:bg-opacity-75
                  `}
                  draggable
                  onDragStart={(e) => onDragStart(e, nodeType.type)}
                >
                  <div className="font-medium text-sm">
                    {getNodeDisplayName(nodeType.type)}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {getNodeDescription(nodeType.type)}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 font-mono">
                    {nodeType.type}
                  </div>
                </div>
              ))}
              
              {category.nodes.length === 0 && (
                <div className="text-xs text-muted-foreground italic p-2">
                  No nodes available in this category
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};