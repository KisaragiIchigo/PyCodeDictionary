import React from 'react';
import { SymbolNode, BigOComplexity } from '../../types';

interface FlowchartTooltipProps {
  hoveredNode: SymbolNode;
  tooltipPos: { x: number; y: number };
}

export const FlowchartTooltip: React.FC<FlowchartTooltipProps> = ({
  hoveredNode,
  tooltipPos
}) => {
  const getBigOBadgeStyle = (bigO?: BigOComplexity) => {
    switch (bigO) {
      case 'O(1)':
      case 'O(log n)':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'O(n)':
      case 'O(n log n)':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
      case 'O(n^2)':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'O(n^3)':
      case 'O(2^n)':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse';
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  return (
    <div
      style={{
        position: 'absolute',
        left: `${Math.min(window.innerWidth - 360, tooltipPos.x + 15)}px`,
        top: `${Math.min(window.innerHeight - 280, tooltipPos.y + 15)}px`
      }}
      className="z-40 w-80 p-3.5 rounded-2xl bg-slate-900/98 border border-cyan-500/50 shadow-2xl backdrop-blur-xl pointer-events-none space-y-2 select-text"
    >
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase font-mono font-bold text-cyan-400">
          {hoveredNode.kind}
        </span>
        {hoveredNode.bigO && (
          <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded border font-bold ${getBigOBadgeStyle(hoveredNode.bigO)}`}>
            計算量: {hoveredNode.bigO}
          </span>
        )}
      </div>

      <div className="font-mono font-bold text-sm text-slate-100 truncate">
        {hoveredNode.name}
      </div>

      {hoveredNode.bigOReason && (
        <div className="text-[10.5px] text-slate-300 bg-white/[0.03] p-1.5 rounded border border-white/[0.04]">
          💡 {hoveredNode.bigOReason}
        </div>
      )}

      {hoveredNode.parameters && hoveredNode.parameters.length > 0 && (
        <div className="text-[10px] font-mono text-slate-300 bg-slate-950/60 p-1.5 rounded border border-white/[0.04] overflow-x-auto">
          ({hoveredNode.parameters.join(', ')})
          {hoveredNode.returnType && <span className="text-emerald-400"> -&gt; {hoveredNode.returnType}</span>}
        </div>
      )}

      {hoveredNode.docstring && (
        <div className="text-[11px] text-slate-300 italic bg-white/[0.02] p-1.5 rounded border border-white/[0.04] leading-relaxed">
          "{hoveredNode.docstring}"
        </div>
      )}
    </div>
  );
};
