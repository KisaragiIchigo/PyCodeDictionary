import React, { useState } from 'react';
import { Activity, Clock, Zap, ArrowRight, CheckCircle, RefreshCw } from 'lucide-react';
import { VisualConceptData } from '../../types';

interface VisualConceptSimProps {
  concept: VisualConceptData;
}

export const VisualConceptSim: React.FC<VisualConceptSimProps> = ({ concept }) => {
  const [activeMode, setActiveMode] = useState<string>(
    concept.defaultMode || concept.modes?.[0]?.id || 'default'
  );

  const renderSimulationView = () => {
    switch (concept.type) {
      case 'async_timeline':
        return (
          <div className="space-y-3 p-3 rounded-lg bg-[#0B0F19] border border-white/[0.06]">
            <div className="text-[11px] text-slate-400 font-medium">
              非同期タスク実行タイムライン比較:
            </div>

            {activeMode === 'serial' ? (
              <div className="space-y-2 font-mono text-[10px]">
                <div>
                  <div className="flex justify-between text-slate-400 mb-0.5">
                    <span>Task A (API通信 1.0s)</span>
                    <span>1.0s</span>
                  </div>
                  <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-cyan-500 w-[55%] rounded-full animate-pulse" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-slate-400 mb-0.5">
                    <span>Task B (DB取得 0.8s)</span>
                    <span>0.8s (Task A終了後に開始)</span>
                  </div>
                  <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden flex">
                    <div className="h-full w-[55%] bg-transparent" />
                    <div className="h-full bg-violet-500 w-[45%] rounded-full animate-pulse" />
                  </div>
                </div>

                <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-rose-300 font-bold text-xs">
                  <span>合計所要時間 (直列):</span>
                  <span>1.8 秒 (ブロッキング待機)</span>
                </div>
              </div>
            ) : (
              <div className="space-y-2 font-mono text-[10px]">
                <div>
                  <div className="flex justify-between text-slate-400 mb-0.5">
                    <span>Task A (API通信 1.0s)</span>
                    <span>1.0s [並行]</span>
                  </div>
                  <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-cyan-500 w-[100%] rounded-full shadow-[0_0_10px_#06b6d4]" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-slate-400 mb-0.5">
                    <span>Task B (DB取得 0.8s)</span>
                    <span>0.8s [並行]</span>
                  </div>
                  <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 w-[80%] rounded-full shadow-[0_0_10px_#10b981]" />
                  </div>
                </div>

                <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-emerald-300 font-bold text-xs">
                  <span>合計所要時間 (Promise.all / gather):</span>
                  <span>1.0 秒 (最長タスク時間のみ！)</span>
                </div>
              </div>
            )}
          </div>
        );

      case 'with_lifecycle':
        return (
          <div className="p-3 rounded-lg bg-[#0B0F19] border border-white/[0.06] space-y-3">
            <div className="text-[11px] text-slate-400 font-medium">
              コンテキストマネージャ 状態遷移フロー:
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-mono">
              <div className="p-2 rounded bg-cyan-500/15 border border-cyan-500/30 text-cyan-300">
                <div className="font-bold text-xs mb-1">1. __enter__</div>
                <div className="text-[9px] text-slate-400">リソース確保 & ロック取得</div>
              </div>

              <div className={`p-2 rounded border ${
                activeMode === 'exception'
                  ? 'bg-rose-500/15 border-rose-500/30 text-rose-300'
                  : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
              }`}>
                <div className="font-bold text-xs mb-1">2. ユーザー処理</div>
                <div className="text-[9px] text-slate-400">
                  {activeMode === 'exception' ? '※例外 (Exception) 発生' : 'ブロック内コード正常実行'}
                </div>
              </div>

              <div className="p-2 rounded bg-violet-500/15 border border-violet-500/30 text-violet-300">
                <div className="font-bold text-xs mb-1">3. __exit__</div>
                <div className="text-[9px] text-slate-400">
                  {activeMode === 'exception' ? '確実にクリーンアップ & ロールバック' : '自動クローズ & リソース解放'}
                </div>
              </div>
            </div>

            <div className="p-2 rounded bg-slate-900 text-xs text-slate-300 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>
                {activeMode === 'exception'
                  ? '例外が発生しても __exit__ の実行が保証されるため、メモリリークや接続の放置を防ぎます。'
                  : '正常終了時も確実にクローズ処理が呼ばれるため、close() の書き忘れが一切起きません。'}
              </span>
            </div>
          </div>
        );

      default:
        return (
          <div className="p-3 rounded-lg bg-[#0B0F19] border border-white/[0.06] space-y-2">
            <div className="text-xs text-slate-300 font-medium">
              {concept.modes?.find(m => m.id === activeMode)?.description}
            </div>
          </div>
        );
    }
  };

  return (
    <div className="p-3.5 rounded-xl bg-slate-950/80 border border-white/[0.08] space-y-3">
      {/* ヘッダー */}
      <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
        <div className="flex items-center gap-1.5">
          <Activity className="w-4 h-4 text-violet-400" />
          <span className="font-semibold text-xs text-slate-100">{concept.title}</span>
        </div>
      </div>

      <p className="text-[11px] text-slate-400 leading-relaxed">
        {concept.description}
      </p>

      {/* モード切り替えタブ */}
      {concept.modes && concept.modes.length > 0 && (
        <div className="flex items-center gap-1.5 p-1 rounded-lg bg-slate-900 border border-white/[0.04]">
          {concept.modes.map((mode) => (
            <button
              key={mode.id}
              onClick={() => setActiveMode(mode.id)}
              className={`flex-1 py-1 px-2 rounded text-xs font-medium transition-all ${
                activeMode === mode.id
                  ? 'bg-violet-500/25 text-violet-200 border border-violet-500/40 shadow-[0_0_10px_rgba(139,92,246,0.3)]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>
      )}

      {/* シミュレーションビュー */}
      {renderSimulationView()}
    </div>
  );
};
