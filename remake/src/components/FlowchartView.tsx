import React, { useState, useMemo } from 'react';
import { Compass, Activity } from 'lucide-react';
import { SymbolNode, CallEdge } from '../types';
import { computeGraphLayout } from '../core/graph/layoutEngine';
import { useCanvasNavigation } from '../hooks/useCanvasNavigation';
import { useSimulationPlayer } from '../hooks/useSimulationPlayer';
import { usePathTracer } from '../hooks/usePathTracer';

import { FlowchartToolbar } from './flowchart/FlowchartToolbar';
import { FlowchartNode } from './flowchart/FlowchartNode';
import { FlowchartEdge } from './flowchart/FlowchartEdge';
import { FlowchartMinimap } from './flowchart/FlowchartMinimap';
import { FlowchartTooltip } from './flowchart/FlowchartTooltip';

interface FlowchartViewProps {
  symbols: SymbolNode[];
  callEdges: CallEdge[];
  onSelectLine: (line: number) => void;
  externalSimulating?: boolean;
  onToggleSimulate?: () => void;
}

export const FlowchartView: React.FC<FlowchartViewProps> = ({
  symbols,
  callEdges,
  onSelectLine,
  externalSimulating,
  onToggleSimulate
}) => {
  const [selectedNodeName, setSelectedNodeName] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<SymbolNode | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [showClusters, setShowClusters] = useState<boolean>(true);
  const [filterRole, setFilterRole] = useState<string>('all');
  const [mapSearchQuery, setMapSearchQuery] = useState<string>('');

  const layout = useMemo(() => computeGraphLayout(symbols, callEdges), [symbols, callEdges]);

  // フックオーケストレーション
  const nav = useCanvasNavigation(layout);
  const sim = useSimulationPlayer(layout, externalSimulating, onToggleSimulate);
  const activePath = usePathTracer(selectedNodeName, sim.activeSimNode, callEdges);

  if (layout.nodes.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#0B0F19]">
        <Compass className="w-12 h-12 text-slate-600 mb-3 animate-pulse-subtle" />
        <p className="text-sm font-medium text-slate-400">表示可能なノードがありません</p>
      </div>
    );
  }

  const filteredNodes = layout.nodes.filter(n => {
    const matchesFilter = filterRole === 'all' || n.symbol.architectureRole === filterRole;
    const matchesSearch = !mapSearchQuery || n.symbol.name.toLowerCase().includes(mapSearchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div
      ref={nav.containerRef}
      onMouseDown={nav.handleMouseDown}
      onMouseMove={nav.handleMouseMove}
      onMouseUp={nav.handleMouseUp}
      onWheel={nav.handleWheel}
      className="relative flex-1 h-full overflow-hidden bg-[#0B0F19] cursor-grab active:cursor-grabbing select-none"
    >
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`,
          backgroundSize: '24px 24px'
        }}
      />

      {/* ツールバー */}
      <FlowchartToolbar
        isSimulating={sim.isSimulating}
        onToggleSimulate={sim.toggleSimulate}
        mapSearchQuery={mapSearchQuery}
        onSearchChange={setMapSearchQuery}
        filterRole={filterRole}
        onFilterChange={setFilterRole}
        showClusters={showClusters}
        onToggleClusters={() => setShowClusters(!showClusters)}
        onZoomIn={() => nav.setScale(s => Math.min(2.5, s * 1.2))}
        onZoomOut={() => nav.setScale(s => Math.max(0.25, s / 1.2))}
        onFit={nav.handleFit}
      />

      {/* シミュレーション / パストレース インジケータ */}
      {(activePath || sim.isSimulating) && (
        <div className="absolute bottom-4 left-4 z-20 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/95 border border-cyan-500/50 backdrop-blur-md shadow-2xl text-xs font-mono">
          <Activity className="w-4 h-4 text-cyan-400 animate-pulse" />
          <span className="text-slate-300">
            {sim.isSimulating ? '実行中: ' : 'フォーカス: '}
            <strong className="text-cyan-300">{activePath?.selected}</strong>
          </span>
          {!sim.isSimulating && (
            <button
              onClick={() => setSelectedNodeName(null)}
              className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-slate-300 hover:text-white"
            >
              解除
            </button>
          )}
        </div>
      )}

      {/* ホバーツールチップ */}
      {hoveredNode && <FlowchartTooltip hoveredNode={hoveredNode} tooltipPos={tooltipPos} />}

      {/* ミニマップ */}
      <FlowchartMinimap layout={layout} selectedNodeName={selectedNodeName} activeSimNode={sim.activeSimNode} />

      {/* キャンバス */}
      <div
        className="absolute transition-transform duration-75 origin-top-left"
        style={{
          transform: `translate(${nav.pan.x}px, ${nav.pan.y}px) scale(${nav.scale})`,
          width: `${layout.width}px`,
          height: `${layout.height}px`
        }}
      >
        {/* クラスタ枠 */}
        {showClusters &&
          layout.clusters.map(c => (
            <div
              key={c.id}
              style={{
                position: 'absolute',
                left: `${c.x}px`,
                top: `${c.y}px`,
                width: `${c.width}px`,
                height: `${c.height}px`
              }}
              className="rounded-2xl border-2 border-dashed border-cyan-500/20 bg-cyan-500/[0.015] pointer-events-none"
            >
              <div className="px-2.5 py-0.5 rounded-br-lg rounded-tl-xl bg-cyan-500/20 text-cyan-300 text-[10px] font-mono font-bold inline-block border-r border-b border-cyan-500/30">
                class {c.name}
              </div>
            </div>
          ))}

        {/* SVG エッジ */}
        <svg className="absolute inset-0 pointer-events-none overflow-visible" width={layout.width} height={layout.height}>
          <defs>
            <marker id="flow-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#06B6D4" />
            </marker>
            <marker id="flow-arrow-dim" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#334155" />
            </marker>
          </defs>

          {layout.edges.map(e => (
            <FlowchartEdge
              key={e.id}
              edgeLayout={e}
              isActive={!!activePath?.activeEdges.has(e.id)}
              isDimmed={!!activePath && !activePath.activeEdges.has(e.id)}
            />
          ))}
        </svg>

        {/* ノード */}
        {filteredNodes.map(n => {
          const isSimActive = sim.activeSimNode === n.symbol.name;
          const isSelected = selectedNodeName === n.symbol.name || isSimActive;
          const isCaller = !!activePath?.callers.has(n.symbol.name);
          const isCallee = !!activePath?.callees.has(n.symbol.name);
          const isRelated = isSelected || isCaller || isCallee;

          return (
            <FlowchartNode
              key={n.id}
              node={n}
              isSelected={isSelected}
              isSimActive={isSimActive}
              isCaller={isCaller}
              isCallee={isCallee}
              isDimmed={!!activePath && !isRelated}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedNodeName(prev => (prev === n.symbol.name ? null : n.symbol.name));
                onSelectLine(n.symbol.startLine);
              }}
              onMouseEnter={(e) => {
                setHoveredNode(n.symbol);
                setTooltipPos({ x: e.clientX, y: e.clientY });
              }}
              onMouseLeave={() => setHoveredNode(null)}
            />
          );
        })}
      </div>
    </div>
  );
};
