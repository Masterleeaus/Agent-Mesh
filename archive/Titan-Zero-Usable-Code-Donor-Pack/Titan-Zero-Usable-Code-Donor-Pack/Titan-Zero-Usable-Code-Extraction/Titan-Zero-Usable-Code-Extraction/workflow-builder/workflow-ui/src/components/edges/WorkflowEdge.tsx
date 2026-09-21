import React from 'react';
import { EdgeProps, getBezierPath, BaseEdge } from 'reactflow';

export const WorkflowEdge: React.FC<EdgeProps> = ({
  sourceX, sourceY, targetX, targetY,
  sourcePosition, targetPosition,
  style = {},
  markerEnd,
  selected,
}) => {
  const [edgePath] = getBezierPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition });

  return (
    <BaseEdge
      path={edgePath}
      markerEnd={markerEnd}
      style={{
        ...style,
        strokeWidth: selected ? 2.5 : 1.8,
        stroke: selected ? '#818cf8' : '#3a3a58',
        strokeDasharray: selected ? '0' : '0',
        filter: selected ? 'drop-shadow(0 0 4px rgba(129,140,248,0.6))' : 'none',
        transition: 'stroke 0.15s, filter 0.15s',
        ...style,
      }}
    />
  );
};
