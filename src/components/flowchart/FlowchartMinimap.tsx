import React from 'react';
import { GraphLayout } from '../../types';

interface FlowchartMinimapProps {
  layout: GraphLayout;
  selectedNodeName: string | null;
  activeSimNode: string | null;
}

export const FlowchartMinimap: React.FC<FlowchartMinimapProps> = ({
  layout,
  selectedNodeName,
  activeSimNode
}) => {
  if (layout.nodes.length === 0) return null;

  return (
    <div className="absolute bottom-4 right-4 z-20 w-44 h-28 rounded-xl bg-slate-950/90 border border-white/10 shadow-2xl backdrop-blur-md overflow-hidden pointer-events-none flex items-center justify-center p-2">
      <svg
        viewBox={`0 0 ${layout.width} ${layout.height}`}
        className="w-full h-full opacity-60"
      >
        {layout.edges.map(e => (
          <line
            key={e.id}
            x1={e.points[0].x}
            y1={e.points[0].y}
            x2={e.points[1].x}
            y2={e.points[1].y}
            stroke="#06B6D4"
            strokeWidth="8"
            opacity="0.4"
          />
        ))}
        {layout.nodes.map(n => (
          <rect
            key={n.id}
            x={n.x}
            y={n.y}
            width={n.width}
            height={n.height}
            rx="8"
            fill={selectedNodeName === n.symbol.name || activeSimNode === n.symbol.name ? '#06B6D4' : '#334155'}
          />
        ))}
      </svg>
    </div>
  );
};
