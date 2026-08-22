import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import {
  Maximize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Compass,
  GitBranch,
  Layers,
  FileText,
  Search,
  Eye,
  EyeOff,
  Crown,
  Zap,
  Globe,
  ShieldCheck,
  AlertTriangle,
  MapPin,
  Filter,
  Sparkles,
  Grid,
  Crosshair,
  Activity,
  Locate
} from 'lucide-react';
import { SymbolNode, CallEdge, PatternTag, ArchitectureRole, GraphNodeLayout } from '../types';
import { computeGraphLayout } from '../core/graph/layoutEngine';

interface FlowchartViewProps {
  symbols: SymbolNode[];
  callEdges: CallEdge[];
  targetLine?: number | null;
  onSelectLine: (line: number) => void;
}

// 超滑らかなApple/Framer風イージング (Ease-Out Quart: 最初素早く動き、目標位置に吸い付くようにピタッと収まる)
function easeOutQuart(x: number): number {
  return 1 - Math.pow(1 - x, 4);
}

export const FlowchartView: React.FC<FlowchartViewProps> = ({
  symbols,
  callEdges,
  targetLine,
  onSelectLine
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // カメラ・Transform状態
  const [scale, setScale] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // アニメーション制御用Ref
  const animFrameIdRef = useRef<number | null>(null);
  const currentScaleRef = useRef<number>(1);
  const currentPanRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // 最新の値をRefに同期
  useEffect(() => {
    currentScaleRef.current = scale;
  }, [scale]);

  useEffect(() => {
    currentPanRef.current = pan;
  }, [pan]);

  // 選択・フォーカス状態
  const [selectedNodeName, setSelectedNodeName] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<SymbolNode | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // 表示オプション
  const [showClusters, setShowClusters] = useState<boolean>(true);
  const [showMinimap, setShowMinimap] = useState<boolean>(true);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [showParticles, setShowParticles] = useState<boolean>(true);

  // フィルタと検索
  const [filterRole, setFilterRole] = useState<string>('all');
  const [mapSearchQuery, setMapSearchQuery] = useState<string>('');

  // レイアウト計算
  const layout = useMemo(() => {
    return computeGraphLayout(symbols, callEdges);
  }, [symbols, callEdges]);

  // パストレース計算
  const activePath = useMemo(() => {
    if (!selectedNodeName) return null;

    const callers = new Set<string>();
    const callees = new Set<string>();
    const activeEdges = new Set<string>();

    for (const e of callEdges) {
      if (e.targetName === selectedNodeName) {
        callers.add(e.sourceName);
        activeEdges.add(e.id);
      }
      if (e.sourceName === selectedNodeName) {
        callees.add(e.targetName);
        activeEdges.add(e.id);
      }
    }

    return {
      selected: selectedNodeName,
      callers,
      callees,
      activeEdges
    };
  }, [selectedNodeName, callEdges]);

  // アニメーションのキャンセル
  const stopAnimation = useCallback(() => {
    if (animFrameIdRef.current !== null) {
      cancelAnimationFrame(animFrameIdRef.current);
      animFrameIdRef.current = null;
    }
  }, []);

  // 🎯 カメラを目標位置・倍率へ「ぐーっ」とスムーズに補間移動（Tween）するコアエンジン
  const animateCameraTo = useCallback((
    targetPan: { x: number; y: number },
    targetScale: number,
    durationMs: number = 480
  ) => {
    stopAnimation();

    const startPan = { ...currentPanRef.current };
    const startScale = currentScaleRef.current;
    const startTime = performance.now();

    const frame = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / durationMs);
      const ease = easeOutQuart(progress);

      const nextScale = startScale + (targetScale - startScale) * ease;
      const nextPanX = startPan.x + (targetPan.x - startPan.x) * ease;
      const nextPanY = startPan.y + (targetPan.y - startPan.y) * ease;

      setScale(nextScale);
      setPan({ x: nextPanX, y: nextPanY });

      if (progress < 1) {
        animFrameIdRef.current = requestAnimationFrame(frame);
      } else {
        animFrameIdRef.current = null;
      }
    };

    animFrameIdRef.current = requestAnimationFrame(frame);
  }, [stopAnimation]);

  // 🎯 特定のノードへ「ぐーっ」と寄る（ズーム＆センタリング）
  const zoomToNode = useCallback((node: GraphNodeLayout, smooth: boolean = true) => {
    if (!containerRef.current) return;
    const { clientWidth, clientHeight } = containerRef.current;

    // ノードがしっかり見やすく周辺も把握できる最適な倍率（1.35倍〜1.5倍）
    const targetScale = Math.max(1.3, Math.min(1.6, currentScaleRef.current < 0.9 ? 1.35 : currentScaleRef.current));
    const nodeCenterX = node.x + node.width / 2;
    const nodeCenterY = node.y + node.height / 2;

    const targetPanX = clientWidth / 2 - nodeCenterX * targetScale;
    const targetPanY = clientHeight / 2 - nodeCenterY * targetScale;

    if (smooth) {
      animateCameraTo({ x: targetPanX, y: targetPanY }, targetScale, 480);
    } else {
      setScale(targetScale);
      setPan({ x: targetPanX, y: targetPanY });
    }
  }, [animateCameraTo]);

  // 全体フィット（画面いっぱいに収まるようスムーズにズームアウト）
  const handleFit = useCallback((smooth: boolean = true) => {
    if (!containerRef.current || layout.nodes.length === 0) return;
    const { clientWidth, clientHeight } = containerRef.current;
    const padding = 100;
    const scaleX = (clientWidth - padding) / Math.max(100, layout.width);
    const scaleY = (clientHeight - padding) / Math.max(100, layout.height);
    const targetScale = Math.min(1.2, Math.max(0.2, Math.min(scaleX, scaleY)));
    const targetPanX = (clientWidth - layout.width * targetScale) / 2;
    const targetPanY = (clientHeight - layout.height * targetScale) / 2;

    if (smooth) {
      animateCameraTo({ x: targetPanX, y: targetPanY }, targetScale, 450);
    } else {
      setScale(targetScale);
      setPan({ x: targetPanX, y: targetPanY });
    }
  }, [layout, animateCameraTo]);

  // 初期ロード時のフィット
  useEffect(() => {
    handleFit(false);
  }, [layout]);

  // 外部からの targetLine 変更に連動して自動でそのタイルへ「ぐーっ」と寄る
  useEffect(() => {
    if (targetLine === null || targetLine === undefined) return;
    const matchedNode = layout.nodes.find(n =>
      targetLine >= n.symbol.startLine && targetLine <= n.symbol.endLine
    );
    if (matchedNode) {
      setSelectedNodeName(matchedNode.symbol.name);
      zoomToNode(matchedNode, true);
    }
  }, [targetLine, layout.nodes, zoomToNode]);

  // タイルクリック時のハンドラ（フォーカス＋「ぐーっ」とズームイン＋コード行ジャンプ）
  const handleNodeClick = (e: React.MouseEvent, node: GraphNodeLayout) => {
    e.stopPropagation();
    setSelectedNodeName(node.symbol.name);
    zoomToNode(node, true);
    onSelectLine(node.symbol.startLine);
  };

  // 背景クリック時のハンドラ（選択解除＋全体へスムーズに引き戻し）
  const handleBackgroundClick = (e: React.MouseEvent) => {
    if (isDragging) return;
    setSelectedNodeName(null);
    handleFit(true);
  };

  // マウスホイールによるカーソル中心ズーム
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    stopAnimation();

    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87;
    const newScale = Math.min(3.5, Math.max(0.15, scale * zoomFactor));

    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    setPan({
      x: mouseX - (mouseX - pan.x) * (newScale / scale),
      y: mouseY - (mouseY - pan.y) * (newScale / scale)
    });
    setScale(newScale);
  };

  // パン操作（ドラッグ）
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    stopAnimation();
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // ズームボタン操作（スムーズ補間付き）
  const handleZoomIn = () => {
    if (!containerRef.current) return;
    const { clientWidth, clientHeight } = containerRef.current;
    const targetScale = Math.min(3.5, scale * 1.3);
    const centerX = clientWidth / 2;
    const centerY = clientHeight / 2;
    const targetPanX = centerX - (centerX - pan.x) * (targetScale / scale);
    const targetPanY = centerY - (centerY - pan.y) * (targetScale / scale);
    animateCameraTo({ x: targetPanX, y: targetPanY }, targetScale, 350);
  };

  const handleZoomOut = () => {
    if (!containerRef.current) return;
    const { clientWidth, clientHeight } = containerRef.current;
    const targetScale = Math.max(0.15, scale / 1.3);
    const centerX = clientWidth / 2;
    const centerY = clientHeight / 2;
    const targetPanX = centerX - (centerX - pan.x) * (targetScale / scale);
    const targetPanY = centerY - (centerY - pan.y) * (targetScale / scale);
    animateCameraTo({ x: targetPanX, y: targetPanY }, targetScale, 350);
  };

  const handleSetExactScale = (target: number) => {
    if (!containerRef.current) return;
    const { clientWidth, clientHeight } = containerRef.current;
    const centerX = clientWidth / 2;
    const centerY = clientHeight / 2;
    const targetPanX = centerX - (centerX - pan.x) * (target / scale);
    const targetPanY = centerY - (centerY - pan.y) * (target / scale);
    animateCameraTo({ x: targetPanX, y: targetPanY }, target, 380);
  };

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
        return 'bg-slate-800/80 text-slate-300 border-slate-700';
    }
  };

  if (layout.nodes.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#0B0F19]">
        <Compass className="w-12 h-12 text-slate-600 mb-3 animate-pulse" />
        <p className="text-sm font-medium text-slate-400">表示可能な関数・メソッドのノードがありません</p>
        <p className="text-xs text-slate-600 mt-1">上部の「サンプル読込」からコードを試すか、コードを開いてください</p>
      </div>
    );
  }

  // フィルタリングされたノード
  const filteredNodes = layout.nodes.filter(n => {
    const matchesFilter = filterRole === 'all' || n.symbol.architectureRole === filterRole;
    const matchesSearch = !mapSearchQuery || n.symbol.name.toLowerCase().includes(mapSearchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
      onClick={handleBackgroundClick}
      className="relative flex-1 h-full overflow-hidden bg-[#070A12] cursor-grab active:cursor-grabbing select-none"
    >
      {/* ハイセンスなドットグリッド背景 */}
      {showGrid && (
        <div
          className="absolute inset-0 pointer-events-none transition-opacity duration-300"
          style={{
            backgroundImage: `radial-gradient(circle, rgba(255, 255, 255, 0.08) 1px, transparent 1px)`,
            backgroundSize: `${Math.max(16, 28 * scale)}px ${Math.max(16, 28 * scale)}px`,
            backgroundPosition: `${pan.x}px ${pan.y}px`
          }}
        />
      )}

      {/* トップツールバー: 検索 & フィルタ & ズームコントローラー */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="absolute top-3 left-3 right-3 z-30 flex items-center justify-between pointer-events-none gap-2"
      >
        {/* 左側: 検索 & 役割フィルタ */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-950/85 border border-white/10 backdrop-blur-md shadow-2xl pointer-events-auto">
          <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-900/90 border border-white/10">
            <Search className="w-3.5 h-3.5 text-cyan-400" />
            <input
              type="text"
              value={mapSearchQuery}
              onChange={(e) => setMapSearchQuery(e.target.value)}
              placeholder="ノード検索..."
              className="w-28 bg-transparent text-xs text-slate-200 focus:outline-none font-mono"
            />
            {mapSearchQuery && (
              <button onClick={() => setMapSearchQuery('')} className="text-slate-500 hover:text-white text-xs">
                ×
              </button>
            )}
          </div>

          <div className="h-4 w-[1px] bg-white/10 mx-0.5" />

          {/* 役割トグル */}
          <div className="flex items-center gap-0.5">
            {[
              { id: 'all', label: 'すべて' },
              { id: 'orchestrator', label: '👑 司令塔' },
              { id: 'pure_logic', label: '⚡ 計算' },
              { id: 'io_effect', label: '🌐 I/O' },
              { id: 'mixed', label: '⚠️ 混在' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setFilterRole(tab.id)}
                className={`px-2 py-1 rounded-lg text-[10.5px] font-mono transition-all ${
                  filterRole === tab.id
                    ? 'bg-cyan-500/25 text-cyan-200 border border-cyan-400/50 shadow-[0_0_10px_rgba(6,182,212,0.3)] font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* 右側: ズーム & 表示コントローラー */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-950/85 border border-white/10 backdrop-blur-md shadow-2xl pointer-events-auto font-mono text-xs">
          {/* ズーム倍率クイックセレクター */}
          <div className="flex items-center gap-0.5 bg-slate-900/90 px-1.5 py-0.5 rounded-lg border border-white/10 text-[11px] mr-1">
            <button
              onClick={() => handleSetExactScale(0.5)}
              className={`px-1 rounded hover:text-cyan-300 ${scale === 0.5 ? 'text-cyan-300 font-bold' : 'text-slate-400'}`}
              title="50% 表示"
            >
              50%
            </button>
            <span className="text-slate-600">|</span>
            <button
              onClick={() => handleSetExactScale(1.0)}
              className={`px-1 rounded hover:text-cyan-300 ${Math.abs(scale - 1.0) < 0.05 ? 'text-cyan-300 font-bold' : 'text-slate-400'}`}
              title="100% 等倍表示"
            >
              100%
            </button>
            <span className="text-slate-600">|</span>
            <button
              onClick={() => handleSetExactScale(1.4)}
              className={`px-1 rounded hover:text-cyan-300 ${Math.abs(scale - 1.4) < 0.05 ? 'text-cyan-300 font-bold' : 'text-slate-400'}`}
              title="140% 拡大表示"
            >
              140%
            </button>
            <span className="text-cyan-400 font-bold ml-1 min-w-[36px] text-right">
              {Math.round(scale * 100)}%
            </span>
          </div>

          <button
            onClick={handleZoomOut}
            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-white/[0.06] rounded-lg transition-all"
            title="ズームアウト"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={handleZoomIn}
            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-white/[0.06] rounded-lg transition-all"
            title="ズームイン"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleFit(true)}
            className="p-1.5 text-slate-400 hover:text-cyan-300 hover:bg-cyan-500/20 rounded-lg transition-all"
            title="全体を画面にスムーズフィット"
          >
            <Maximize2 className="w-4 h-4" />
          </button>

          <div className="w-[1px] h-4 bg-white/10 mx-0.5" />

          {/* 表示オプション */}
          <button
            onClick={() => setShowParticles(!showParticles)}
            className={`p-1.5 rounded-lg transition-colors ${
              showParticles ? 'text-cyan-300 bg-cyan-500/20' : 'text-slate-500 hover:text-slate-300'
            }`}
            title="データフロー光粒子の表示/非表示"
          >
            <Activity className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowClusters(!showClusters)}
            className={`p-1.5 rounded-lg transition-colors ${
              showClusters ? 'text-cyan-300 bg-cyan-500/20' : 'text-slate-500 hover:text-slate-300'
            }`}
            title="クラスクラスタ枠の表示/非表示"
          >
            {showClusters ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setShowGrid(!showGrid)}
            className={`p-1.5 rounded-lg transition-colors ${
              showGrid ? 'text-cyan-300 bg-cyan-500/20' : 'text-slate-500 hover:text-slate-300'
            }`}
            title="背景グリッドの表示/非表示"
          >
            <Grid className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* パストレース中インジケータ */}
      {selectedNodeName && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute bottom-4 left-4 z-30 flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-950/95 border border-cyan-500/60 backdrop-blur-xl shadow-2xl text-xs font-mono animate-fadeIn"
        >
          <GitBranch className="w-4 h-4 text-cyan-400" />
          <span className="text-slate-300">
            フォーカス中: <strong className="text-cyan-300 font-bold">{selectedNodeName}</strong>
          </span>
          <span className="text-[10.5px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-white/10">
            上流呼び出し: <span className="text-violet-300 font-bold">{activePath?.callers.size || 0}</span> / 下流先: <span className="text-emerald-300 font-bold">{activePath?.callees.size || 0}</span>
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedNodeName(null);
              handleFit(true);
            }}
            className="ml-2 text-[10px] px-2 py-0.5 rounded bg-white/10 hover:bg-rose-500/30 text-slate-300 hover:text-rose-200 border border-white/10 transition-all"
          >
            全体に戻る
          </button>
        </div>
      )}

      {/* ホバー詳細カード */}
      {hoveredNode && (
        <div
          style={{
            position: 'absolute',
            left: `${Math.min(window.innerWidth - 380, tooltipPos.x + 16)}px`,
            top: `${Math.min(window.innerHeight - 300, tooltipPos.y + 16)}px`
          }}
          className="z-40 w-84 p-4 rounded-2xl bg-slate-950/95 border border-cyan-500/60 shadow-2xl backdrop-blur-2xl pointer-events-none space-y-2.5 select-text animate-fadeIn"
        >
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-1.5">
            <span className="text-[10px] uppercase font-mono font-bold text-cyan-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              {hoveredNode.kind}
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              L{hoveredNode.startLine} - L{hoveredNode.endLine}
            </span>
          </div>

          <div className="font-mono font-bold text-sm text-slate-100 truncate">
            {hoveredNode.name}
          </div>

          {hoveredNode.parameters && hoveredNode.parameters.length > 0 && (
            <div className="text-[10px] font-mono text-slate-300 bg-slate-900/90 p-2 rounded-lg border border-white/[0.06] overflow-x-auto">
              ({hoveredNode.parameters.join(', ')})
              {hoveredNode.returnType && <span className="text-emerald-400"> -&gt; {hoveredNode.returnType}</span>}
            </div>
          )}

          {hoveredNode.docstring && (
            <div className="text-[11px] text-slate-300 italic bg-white/[0.02] p-2 rounded-lg border border-white/[0.04] leading-relaxed">
              "{hoveredNode.docstring}"
            </div>
          )}

          <div className="text-[9.5px] text-cyan-400/80 font-mono text-right flex items-center justify-end gap-1">
            <Locate className="w-3 h-3" />
            <span>クリックで「ぐーっ」と寄る</span>
          </div>
        </div>
      )}

      {/* インタラクティブ・レーダーミニマップ */}
      {showMinimap && layout.nodes.length > 0 && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute bottom-4 right-4 z-30 w-52 h-36 rounded-2xl bg-slate-950/90 border border-white/15 shadow-2xl backdrop-blur-xl overflow-hidden p-2 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-[9px] font-mono text-slate-400 border-b border-white/[0.06] pb-1 mb-1">
            <span className="flex items-center gap-1">
              <Compass className="w-3 h-3 text-cyan-400" />
              レーダーMAP
            </span>
            <span className="text-slate-500">{layout.nodes.length} ノード</span>
          </div>

          <svg
            viewBox={`0 0 ${layout.width} ${layout.height}`}
            className="w-full flex-1 opacity-75"
          >
            {layout.edges.map(e => (
              <line
                key={e.id}
                x1={e.points[0].x}
                y1={e.points[0].y}
                x2={e.points[1].x}
                y2={e.points[1].y}
                stroke="#06B6D4"
                strokeWidth="10"
                opacity="0.35"
              />
            ))}
            {layout.nodes.map(n => (
              <rect
                key={n.id}
                x={n.x}
                y={n.y}
                width={n.width}
                height={n.height}
                rx="10"
                fill={
                  selectedNodeName === n.symbol.name
                    ? '#06B6D4'
                    : n.symbol.architectureRole === 'orchestrator'
                    ? '#F59E0B'
                    : n.symbol.architectureRole === 'pure_logic'
                    ? '#10B981'
                    : n.symbol.architectureRole === 'io_effect'
                    ? '#06B6D4'
                    : '#334155'
                }
              />
            ))}
          </svg>
        </div>
      )}

      {/* メインキャンバス */}
      <div
        className="absolute origin-top-left will-change-transform"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
          width: `${layout.width}px`,
          height: `${layout.height}px`
        }}
      >
        {/* クラスクラスタ枠 */}
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
              className="rounded-3xl border-2 border-dashed border-cyan-500/25 bg-cyan-950/[0.04] pointer-events-none transition-all"
            >
              <div className="px-3 py-1 rounded-br-xl rounded-tl-2xl bg-cyan-500/20 text-cyan-300 text-xs font-mono font-bold inline-flex items-center gap-1.5 border-r border-b border-cyan-500/30 shadow-lg">
                <Layers className="w-3 h-3 text-cyan-400" />
                class {c.name}
              </div>
            </div>
          ))}

        {/* SVG エッジ & フロー矢印 & 光る粒子アニメーション */}
        <svg
          className="absolute inset-0 pointer-events-none overflow-visible"
          width={layout.width}
          height={layout.height}
        >
          <defs>
            <marker
              id="flow-arrow-active"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#06B6D4" />
            </marker>
            <marker
              id="flow-arrow-standard"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#06B6D4" opacity="0.6" />
            </marker>
            <marker
              id="flow-arrow-dim"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#334155" opacity="0.3" />
            </marker>
          </defs>

          {layout.edges.map(e => {
            const [start, end] = e.points;
            const dy = (end.y - start.y) / 2;
            const pathD = `M ${start.x} ${start.y} C ${start.x} ${start.y + dy}, ${end.x} ${end.y - dy}, ${end.x} ${end.y}`;

            const isEdgeActive = activePath?.activeEdges.has(e.id);
            const isDimmed = activePath && !isEdgeActive;
            const strokeWidth = Math.min(6, 1.8 + e.edge.count * 0.8);

            return (
              <g key={e.id}>
                {/* 背景エッジ */}
                <path
                  d={pathD}
                  fill="none"
                  stroke={
                    isEdgeActive
                      ? '#06B6D4'
                      : isDimmed
                      ? 'rgba(51, 65, 85, 0.2)'
                      : 'rgba(6, 182, 212, 0.4)'
                  }
                  strokeWidth={isEdgeActive ? strokeWidth + 2.5 : strokeWidth}
                  markerEnd={
                    isEdgeActive
                      ? 'url(#flow-arrow-active)'
                      : isDimmed
                      ? 'url(#flow-arrow-dim)'
                      : 'url(#flow-arrow-standard)'
                  }
                  strokeLinecap="round"
                  className="transition-all duration-200"
                />

                {/* 動的データフロー光粒子アニメーション */}
                {showParticles && !isDimmed && (
                  <path
                    d={pathD}
                    fill="none"
                    stroke={isEdgeActive ? '#67E8F9' : '#06B6D4'}
                    strokeWidth={isEdgeActive ? 3.5 : 2}
                    strokeDasharray="6, 18"
                    strokeLinecap="round"
                    className="animate-flow-dash"
                  />
                )}

                {/* 呼び出し回数バッジ */}
                {e.edge.count > 1 && (
                  <g transform={`translate(${(start.x + end.x) / 2}, ${(start.y + end.y) / 2})`}>
                    <circle
                      r="10"
                      fill="#0B0F19"
                      stroke={isEdgeActive ? '#06B6D4' : isDimmed ? '#334155' : '#06B6D4'}
                      strokeWidth="1.8"
                      className="shadow-lg"
                    />
                    <text
                      y="3.5"
                      fontSize="9.5"
                      fill={isEdgeActive ? '#67E8F9' : isDimmed ? '#64748B' : '#67E8F9'}
                      textAnchor="middle"
                      fontWeight="bold"
                      fontFamily="'JetBrains Mono', monospace"
                    >
                      {e.edge.count}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>

        {/* ノード一覧 */}
        {filteredNodes.map(n => {
          const isSelected = selectedNodeName === n.symbol.name;
          const isCaller = activePath?.callers.has(n.symbol.name);
          const isCallee = activePath?.callees.has(n.symbol.name);
          const isRelated = isSelected || isCaller || isCallee;
          const isDimmed = activePath && !isRelated;

          const isEntry = n.isEntry;
          const isLeaf = n.isLeaf;

          return (
            <div
              key={n.id}
              onClick={(e) => handleNodeClick(e, n)}
              onMouseEnter={(e) => {
                setHoveredNode(n.symbol);
                setTooltipPos({ x: e.clientX, y: e.clientY });
              }}
              onMouseLeave={() => setHoveredNode(null)}
              style={{
                position: 'absolute',
                left: `${n.x}px`,
                top: `${n.y}px`,
                width: `${n.width}px`,
                height: `${n.height}px`,
                opacity: isDimmed ? 0.25 : 1.0
              }}
              className={`group rounded-2xl border transition-all duration-200 cursor-pointer shadow-xl backdrop-blur-xl overflow-hidden flex flex-col justify-between ${
                isSelected
                  ? 'bg-slate-900/98 border-cyan-400 shadow-[0_0_30px_rgba(6,182,212,0.7)] scale-[1.05] z-30 ring-2 ring-cyan-400/50'
                  : isCaller
                  ? 'bg-slate-900/95 border-violet-400 shadow-[0_0_20px_rgba(139,92,246,0.5)] z-20'
                  : isCallee
                  ? 'bg-slate-900/95 border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.5)] z-20'
                  : isEntry
                  ? 'bg-slate-900/90 border-cyan-500/50 hover:border-cyan-400 hover:shadow-[0_0_18px_rgba(6,182,212,0.4)]'
                  : isLeaf
                  ? 'bg-slate-900/80 border-slate-700/60 hover:border-slate-500'
                  : 'bg-slate-900/85 border-white/[0.08] hover:border-cyan-500/40 hover:shadow-lg'
              }`}
            >
              {/* ノードヘッダーバー */}
              <div className="h-6 px-3 flex items-center justify-between bg-slate-950/70 border-b border-white/[0.06]">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] uppercase font-mono font-bold text-slate-400">
                    {n.symbol.kind}
                  </span>
                  <span className="text-[9.5px] font-mono text-slate-500">
                    L{n.symbol.startLine}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  {n.symbol.architectureRole === 'orchestrator' && (
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono font-semibold">
                      👑 司令塔
                    </span>
                  )}
                  {n.symbol.architectureRole === 'pure_logic' && (
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono font-semibold">
                      ⚡ PURE
                    </span>
                  )}
                  {n.symbol.architectureRole === 'io_effect' && (
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-mono font-semibold">
                      🌐 I/O
                    </span>
                  )}
                  {n.symbol.architectureRole === 'mixed' && (
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 font-mono font-semibold animate-pulse">
                      ⚠️ MIXED
                    </span>
                  )}
                </div>
              </div>

              {/* ノードボディ: シンボル名 */}
              <div className="px-3 py-1">
                <div className="text-xs font-mono font-bold text-slate-100 truncate group-hover:text-cyan-300 transition-colors">
                  {n.symbol.name}
                </div>
              </div>

              {/* ノードフッター: タグ一覧 */}
              <div className="px-3 pb-2 flex items-center gap-1 overflow-hidden">
                {n.symbol.tags.length > 0 ? (
                  n.symbol.tags.slice(0, 3).map(tag => (
                    <span
                      key={tag}
                      className={`text-[8.5px] px-1.5 py-0.2 rounded-full border font-mono ${getTagBadgeStyle(
                        tag
                      )}`}
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
        })}
      </div>
    </div>
  );
};
