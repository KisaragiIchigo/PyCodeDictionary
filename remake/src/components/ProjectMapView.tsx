import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import {
  Maximize2,
  ZoomIn,
  ZoomOut,
  FolderTree,
  FileCode,
  ArrowRight,
  Sparkles,
  Layers,
  Search,
  Grid
} from 'lucide-react';
import { ProjectAnalysisResult, ProjectFileEntry } from '../types';

interface ProjectMapViewProps {
  project: ProjectAnalysisResult;
  onSelectFile: (file: ProjectFileEntry) => void;
}

interface FileNodeLayout {
  id: string;
  file: ProjectFileEntry;
  x: number;
  y: number;
  width: number;
  height: number;
}

export const ProjectMapView: React.FC<ProjectMapViewProps> = ({
  project,
  onSelectFile
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showGrid, setShowGrid] = useState<boolean>(true);

  // ファイルノードの自動グリッド/階層レイアウト計算
  const layout = useMemo(() => {
    const files = project.files;
    if (files.length === 0) return { nodes: [], width: 600, height: 400 };

    const NODE_W = 240;
    const NODE_H = 90;
    const GAP_X = 80;
    const GAP_Y = 80;
    const COLS = Math.max(2, Math.ceil(Math.sqrt(files.length * 1.5)));

    const nodes: FileNodeLayout[] = [];

    files.forEach((f, i) => {
      const col = i % COLS;
      const row = Math.floor(i / COLS);
      nodes.push({
        id: f.path,
        file: f,
        x: 80 + col * (NODE_W + GAP_X),
        y: 80 + row * (NODE_H + GAP_Y),
        width: NODE_W,
        height: NODE_H
      });
    });

    const maxW = 80 + COLS * (NODE_W + GAP_X) + 80;
    const maxH = 80 + (Math.floor(files.length / COLS) + 1) * (NODE_H + GAP_Y) + 80;

    return { nodes, width: maxW, height: maxH };
  }, [project.files]);

  const handleFit = useCallback(() => {
    if (!containerRef.current || layout.nodes.length === 0) return;
    const { clientWidth, clientHeight } = containerRef.current;
    const padding = 100;
    const scaleX = (clientWidth - padding) / Math.max(100, layout.width);
    const scaleY = (clientHeight - padding) / Math.max(100, layout.height);
    const newScale = Math.min(1.2, Math.max(0.2, Math.min(scaleX, scaleY)));
    const offsetX = (clientWidth - layout.width * newScale) / 2;
    const offsetY = (clientHeight - layout.height * newScale) / 2;
    setScale(newScale);
    setPan({ x: offsetX, y: offsetY });
  }, [layout]);

  useEffect(() => {
    handleFit();
  }, [handleFit]);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
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

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
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

  const handleSetExactScale = (target: number) => {
    if (!containerRef.current) return;
    const { clientWidth, clientHeight } = containerRef.current;
    const centerX = clientWidth / 2;
    const centerY = clientHeight / 2;
    setPan({
      x: centerX - (centerX - pan.x) * (target / scale),
      y: centerY - (centerY - pan.y) * (target / scale)
    });
    setScale(target);
  };

  const filteredNodes = layout.nodes.filter(n => {
    return !searchQuery || n.file.name.toLowerCase().includes(searchQuery.toLowerCase()) || n.file.path.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
      className="relative flex-1 h-full overflow-hidden bg-[#070A12] cursor-grab active:cursor-grabbing select-none"
    >
      {/* ドットグリッド背景 */}
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

      {/* ツールバー */}
      <div className="absolute top-3 left-3 right-3 z-30 flex items-center justify-between pointer-events-none gap-2">
        <div className="flex items-center gap-2 p-1.5 rounded-xl bg-slate-950/85 border border-white/10 backdrop-blur-md shadow-2xl pointer-events-auto">
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900/90 border border-white/10">
            <Search className="w-3.5 h-3.5 text-cyan-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ファイル検索..."
              className="w-32 bg-transparent text-xs text-slate-200 focus:outline-none font-mono"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="text-slate-500 hover:text-white text-xs">
                ×
              </button>
            )}
          </div>
          <span className="text-xs font-mono text-slate-400 px-2">
            プロジェクト: <strong className="text-cyan-300">{project.projectName}</strong> ({project.files.length} ファイル)
          </span>
        </div>

        <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-950/85 border border-white/10 backdrop-blur-md shadow-2xl pointer-events-auto font-mono text-xs">
          <div className="flex items-center gap-0.5 bg-slate-900/90 px-1.5 py-0.5 rounded-lg border border-white/10 text-[11px] mr-1">
            <button
              onClick={() => handleSetExactScale(0.5)}
              className={`px-1 rounded hover:text-cyan-300 ${scale === 0.5 ? 'text-cyan-300 font-bold' : 'text-slate-400'}`}
            >
              50%
            </button>
            <span className="text-slate-600">|</span>
            <button
              onClick={() => handleSetExactScale(1.0)}
              className={`px-1 rounded hover:text-cyan-300 ${Math.abs(scale - 1.0) < 0.05 ? 'text-cyan-300 font-bold' : 'text-slate-400'}`}
            >
              100%
            </button>
            <span className="text-cyan-400 font-bold ml-1 min-w-[36px] text-right">
              {Math.round(scale * 100)}%
            </span>
          </div>

          <button
            onClick={() => setScale(s => Math.max(0.15, s / 1.25))}
            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-white/[0.06] rounded-lg transition-all"
            title="ズームアウト"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={() => setScale(s => Math.min(3.5, s * 1.25))}
            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-white/[0.06] rounded-lg transition-all"
            title="ズームイン"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={handleFit}
            className="p-1.5 text-slate-400 hover:text-cyan-300 hover:bg-cyan-500/20 rounded-lg transition-all"
            title="全体フィット"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowGrid(!showGrid)}
            className={`p-1.5 rounded-lg transition-colors ${
              showGrid ? 'text-cyan-300 bg-cyan-500/20' : 'text-slate-500 hover:text-slate-300'
            }`}
            title="グリッド切り替え"
          >
            <Grid className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* メインキャンバス */}
      <div
        className="absolute origin-top-left will-change-transform transition-[transform] duration-75"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
          width: `${layout.width}px`,
          height: `${layout.height}px`
        }}
      >
        {filteredNodes.map(n => {
          const isSelected = selectedFileName === n.file.path;
          return (
            <div
              key={n.id}
              onClick={() => {
                setSelectedFileName(n.file.path);
                onSelectFile(n.file);
              }}
              style={{
                position: 'absolute',
                left: `${n.x}px`,
                top: `${n.y}px`,
                width: `${n.width}px`,
                height: `${n.height}px`
              }}
              className={`group rounded-2xl border transition-all duration-200 cursor-pointer shadow-xl backdrop-blur-xl p-3 flex flex-col justify-between ${
                isSelected
                  ? 'bg-slate-900/98 border-cyan-400 shadow-[0_0_25px_rgba(6,182,212,0.6)] scale-[1.04] z-30'
                  : 'bg-slate-900/85 border-white/[0.08] hover:border-cyan-500/40 hover:shadow-lg'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 min-w-0">
                  <FileCode className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span className="font-mono font-bold text-xs text-slate-100 truncate group-hover:text-cyan-300">
                    {n.file.name}
                  </span>
                </div>
                <span className="text-[9.5px] px-1.5 py-0.2 rounded font-mono bg-cyan-950/60 text-cyan-300 border border-cyan-500/30 shrink-0">
                  {n.file.language}
                </span>
              </div>

              <div className="text-[10px] font-mono text-slate-400 truncate">
                {n.file.path}
              </div>

              <div className="flex items-center justify-between text-[9.5px] font-mono text-slate-500 border-t border-white/[0.04] pt-1.5">
                <span>{n.file.analysis.symbols.length} シンボル</span>
                <span>{n.file.analysis.metrics.totalLines} 行</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
