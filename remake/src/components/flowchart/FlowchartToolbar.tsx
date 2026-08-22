import React from 'react';
import {
  Search,
  Eye,
  EyeOff,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Play,
  Square
} from 'lucide-react';

interface FlowchartToolbarProps {
  isSimulating: boolean;
  onToggleSimulate: () => void;
  mapSearchQuery: string;
  onSearchChange: (q: string) => void;
  filterRole: string;
  onFilterChange: (role: string) => void;
  showClusters: boolean;
  onToggleClusters: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFit: () => void;
}

export const FlowchartToolbar: React.FC<FlowchartToolbarProps> = ({
  isSimulating,
  onToggleSimulate,
  mapSearchQuery,
  onSearchChange,
  filterRole,
  onFilterChange,
  showClusters,
  onToggleClusters,
  onZoomIn,
  onZoomOut,
  onFit
}) => {
  return (
    <div className="absolute top-3 left-3 right-3 z-20 flex items-center justify-between pointer-events-none">
      {/* 左側: 実行シミュレータ & フィルタ */}
      <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900/95 border border-cyan-500/30 backdrop-blur-md shadow-2xl pointer-events-auto">
        <button
          onClick={onToggleSimulate}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all shadow-lg ${
            isSimulating
              ? 'bg-rose-500 text-white shadow-glow-rose animate-pulse'
              : 'bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 hover:opacity-90 shadow-glow-cyan'
          }`}
          title="コードの実行順序をフローチャート上で再生"
        >
          {isSimulating ? <Square className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
          <span>{isSimulating ? 'シミュレーション停止' : '▶ 実行シミュレーション'}</span>
        </button>

        <div className="h-5 w-[1px] bg-white/10 mx-0.5" />

        <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-950/60 border border-white/10">
          <Search className="w-3 h-3 text-slate-500" />
          <input
            type="text"
            value={mapSearchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="関数を検索..."
            className="w-20 bg-transparent text-xs text-slate-200 focus:outline-none font-mono"
          />
        </div>

        {/* 役割トグル */}
        <div className="flex items-center gap-0.5">
          {[
            { id: 'all', label: 'すべて' },
            { id: 'orchestrator', label: '👑 司令塔' },
            { id: 'pure_logic', label: '⚡ 計算' },
            { id: 'io_effect', label: '🌐 I/O' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => onFilterChange(tab.id)}
              className={`px-2 py-1 rounded-lg text-[10.5px] font-mono transition-all ${
                filterRole === tab.id
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 右側: ズーム & 全体フィット */}
      <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-900/90 border border-white/10 backdrop-blur-md shadow-xl pointer-events-auto">
        <button
          onClick={onToggleClusters}
          className={`p-1.5 rounded-lg transition-colors ${
            showClusters ? 'text-cyan-300 bg-cyan-500/20' : 'text-slate-400 hover:text-slate-200'
          }`}
          title="クラスクラスタ枠の表示/非表示"
        >
          {showClusters ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
        </button>
        <div className="w-[1px] h-4 bg-white/10 mx-0.5" />
        <button
          onClick={onZoomIn}
          className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-white/[0.06] rounded"
          title="ズームイン"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={onZoomOut}
          className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-white/[0.06] rounded"
          title="ズームアウト"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={onFit}
          className="p-1.5 text-slate-400 hover:text-cyan-300 hover:bg-white/[0.06] rounded"
          title="全体フィット"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
