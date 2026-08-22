import React from 'react';
import { GraphEdgeLayout } from '../../types';

interface FlowchartEdgeProps {
  edgeLayout: GraphEdgeLayout;
  isActive: boolean;
  isDimmed: boolean;
}

export const FlowchartEdge: React.FC<FlowchartEdgeProps> = ({
  edgeLayout,
  isActive,
  isDimmed
}) => {
  const { id, points, edge } = edgeLayout;
  const [start, end] = points;
  const dy = (end.y - start.y) / 2;
  const pathD = `M ${start.x} ${start.y} C ${start.x} ${start.y + dy}, ${end.x} ${end.y - dy}, ${end.x} ${end.y}`;
  const strokeWidth = Math.min(5.5, 1.5 + edge.count * 0.7);

  return (
    <g key={id}>
      <path
        d={pathD}
        fill="none"
        stroke={
          isActive
            ? '#06B6D4'
            : isDimmed
            ? 'rgba(51, 65, 85, 0.25)'
            : 'rgba(6, 182, 212, 0.45)'
        }
        strokeWidth={isActive ? strokeWidth + 2.5 : strokeWidth}
        markerEnd={isDimmed ? 'url(#flow-arrow-dim)' : 'url(#flow-arrow)'}
        strokeLinecap="round"
        className="transition-all duration-200"
      />
    </g>
  );
};
