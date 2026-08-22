import React from 'react';
import { GraphNodeLayout, PatternTag, BigOComplexity } from '../../types';

interface FlowchartNodeProps {
  node: GraphNodeLayout;
  isSelected: boolean;
  isSimActive: boolean;
  isCaller: boolean;
  isCallee: boolean;
  isDimmed: boolean;
  onClick: (e: React.MouseEvent) => void;
  onMouseEnter: (e: React.MouseEvent) => void;
  onMouseLeave: () => void;
}

export const FlowchartNode: React.FC<FlowchartNodeProps> = ({
  node,
  isSelected,
  isSimActive,
  isCaller,
  isCallee,
  isDimmed,
  onClick,
  onMouseEnter,
  onMouseLeave
}) => {
  const { symbol, x, y, width, height, isEntry, isLeaf } = node;

  const getTagBadgeStyle = (tag: PatternTag) => {
    switch (tag) {
      case 'async':
        return 'bg-violet-500/20 text-violet-300 border-violet-500/40';
      case 'net':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
      case 'io':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'recursive':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      case 'database':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      default:
        return 'bg-slate-700/50 text-slate-300 border-slate-600';
    }
  };

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
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        position: 'absolute',
        left: `${x}px`,
        top: `${y}px`,
        width: `${width}px`,
        height: `${height}px`,
        opacity: isDimmed ? 0.3 : 1.0
      }}
      className={`group rounded-xl border transition-all duration-200 cursor-pointer shadow-lg backdrop-blur-md overflow-hidden flex flex-col justify-between ${
        isSimActive
          ? 'bg-cyan-500/30 border-cyan-300 shadow-glow-cyan scale-[1.06] z-40 ring-2 ring-cyan-400 animate-pulse'
          : isSelected
          ? 'bg-slate-800/98 border-cyan-400 shadow-glow-cyan scale-[1.03] z-30'
          : isCaller
          ? 'bg-slate-800/90 border-violet-400 shadow-glow-violet z-20'
          : isCallee
          ? 'bg-slate-800/90 border-emerald-400 shadow-glow-emerald z-20'
          : isEntry
          ? 'bg-slate-900/90 border-cyan-500/50 hover:border-cyan-400 hover:shadow-glow-cyan'
          : isLeaf
          ? 'bg-slate-900/80 border-slate-700/60 hover:border-slate-500'
          : 'bg-slate-900/85 border-white/[0.08] hover:border-white/20'
      }`}
    >
      {/* ヘッダーバー */}
      <div className="h-6 px-2.5 flex items-center justify-between bg-slate-950/60 border-b border-white/[0.04]">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] uppercase font-mono font-bold text-slate-400">
            {symbol.kind}
          </span>
          <span className="text-[9.5px] font-mono text-slate-500">
            L{symbol.startLine}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {symbol.bigO && (
            <span className={`text-[8.5px] font-mono px-1 py-0.1 rounded border font-bold ${getBigOBadgeStyle(symbol.bigO)}`}>
              {symbol.bigO}
            </span>
          )}
          {symbol.architectureRole === 'orchestrator' && (
            <span className="text-[8.5px] px-1 py-0.1 rounded bg-amber-500/20 text-amber-300 font-mono">
              👑
            </span>
          )}
          {symbol.architectureRole === 'pure_logic' && (
            <span className="text-[8.5px] px-1 py-0.1 rounded bg-emerald-500/20 text-emerald-300 font-mono">
              ⚡
            </span>
          )}
        </div>
      </div>

      {/* シンボル名 */}
      <div className="px-2.5 py-1">
        <div className="text-xs font-mono font-bold text-slate-100 truncate group-hover:text-cyan-300 transition-colors">
          {symbol.name}
        </div>
      </div>

      {/* タグ一覧 */}
      <div className="px-2.5 pb-1.5 flex items-center gap-1 overflow-hidden">
        {symbol.tags.length > 0 ? (
          symbol.tags.slice(0, 3).map(tag => (
            <span
              key={tag}
              className={`text-[8.5px] px-1 py-0.2 rounded-full border font-mono ${getTagBadgeStyle(tag)}`}
            >
              {tag}
            </span>
          ))
        ) : (
          <span className="text-[9px] text-slate-600 font-mono">-</span>
        )}
      </div>
    </div>
  );
};
