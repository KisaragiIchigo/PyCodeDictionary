import React, { useState } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  Info,
  CheckCircle2,
  TrendingUp,
  Activity,
  Layers,
  Sparkles,
  ArrowRight,
  Lightbulb,
  Lock,
  BrainCircuit
} from 'lucide-react';
import { CodeMetrics, RefactorSuggestion } from '../types';

interface QualityPanelProps {
  metrics: CodeMetrics;
  refactorSuggestions: RefactorSuggestion[];
  onSelectLine: (line: number) => void;
}

export const QualityPanel: React.FC<QualityPanelProps> = ({
  metrics,
  refactorSuggestions,
  onSelectLine
}) => {
  const [tab, setTab] = useState<'overview' | 'security' | 'refactor' | 'issues'>('overview');

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10';
    if (score >= 60) return 'text-amber-400 border-amber-500/40 bg-amber-500/10';
    return 'text-rose-400 border-rose-500/40 bg-rose-500/10';
  };

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case 'critical':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      case 'high':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'medium':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40';
      default:
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0D1322] border-r border-white/[0.08] select-none">
      {/* タブセレクタ */}
      <div className="flex items-center border-b border-white/[0.06] bg-slate-900/60 p-1 gap-1">
        <button
          onClick={() => setTab('overview')}
          className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${
            tab === 'overview'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          概要
        </button>
        <button
          onClick={() => setTab('security')}
          className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${
            tab === 'security'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          セキュリティ ({metrics.securityIssues?.length || 0})
        </button>
        <button
          onClick={() => setTab('refactor')}
          className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${
            tab === 'refactor'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          改善案 ({refactorSuggestions.length})
        </button>
      </div>

      {/* タブ別コンテンツ */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4 select-text">
        {tab === 'overview' && (
          <>
            {/* ヘルススコア & セキュリティスコア */}
            <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.08] space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-[11px] text-slate-400 font-medium">総合コードヘルス</div>
                  <div className="text-xl font-bold text-slate-100 font-mono flex items-baseline gap-1">
                    <span className={metrics.healthScore >= 80 ? 'text-emerald-400' : 'text-amber-400'}>
                      {metrics.healthScore}
                    </span>
                    <span className="text-xs text-slate-500">/ 100</span>
                  </div>
                </div>

                <div>
                  <div className="text-[11px] text-slate-400 font-medium">セキュリティスコア</div>
                  <div className="text-xl font-bold text-slate-100 font-mono flex items-baseline gap-1">
                    <span className={metrics.securityScore >= 80 ? 'text-emerald-400' : 'text-rose-400'}>
                      {metrics.securityScore}
                    </span>
                    <span className="text-xs text-slate-500">/ 100</span>
                  </div>
                </div>
              </div>

              {/* メトリクス詳細グリッド */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/[0.06]">
                <div className="p-2 rounded-lg bg-slate-950/60 border border-white/[0.04]">
                  <div className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Activity className="w-3 h-3 text-cyan-400" />
                    <span>循環的複雑度</span>
                  </div>
                  <div className="text-sm font-bold font-mono text-cyan-300 mt-0.5">
                    {metrics.cyclomaticComplexity}
                  </div>
                </div>

                <div className="p-2 rounded-lg bg-slate-950/60 border border-white/[0.04]">
                  <div className="text-[10px] text-slate-400 flex items-center gap-1">
                    <BrainCircuit className="w-3 h-3 text-violet-400" />
                    <span>認知複雑度 (Sonar)</span>
                  </div>
                  <div className="text-sm font-bold font-mono text-violet-300 mt-0.5">
                    {metrics.cognitiveComplexity}
                  </div>
                </div>

                <div className="p-2 rounded-lg bg-slate-950/60 border border-white/[0.04]">
                  <div className="text-[10px] text-slate-400">保守性指標 (MI)</div>
                  <div className="text-sm font-bold font-mono text-emerald-300 mt-0.5">
                    {metrics.maintainabilityIndex} / 100
                  </div>
                </div>

                <div className="p-2 rounded-lg bg-slate-950/60 border border-white/[0.04]">
                  <div className="text-[10px] text-slate-400">実コード行 / 総行</div>
                  <div className="text-sm font-bold font-mono text-amber-300 mt-0.5">
                    {metrics.codeLines} / {metrics.totalLines}
                  </div>
                </div>
              </div>
            </div>

            {/* スタイル & 品質警告一覧 */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                <ShieldAlert className="w-3.5 h-3.5 text-cyan-400" />
                <span>品質 & スタイル警告 ({metrics.issues.length})</span>
              </div>

              {metrics.issues.length === 0 ? (
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] text-xs text-slate-400 text-center">
                  警告はありません
                </div>
              ) : (
                metrics.issues.map(issue => (
                  <div
                    key={issue.id}
                    onClick={() => onSelectLine(issue.line)}
                    className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] cursor-pointer space-y-1 group"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 font-medium">
                        <Info className="w-3.5 h-3.5 text-cyan-400" />
                        <span className="text-slate-200 group-hover:text-cyan-300">
                          行 {issue.line}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-500">
                        {issue.rule}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 leading-relaxed">
                      {issue.message}
                    </div>
                    {issue.suggestion && (
                      <div className="text-[10px] text-cyan-400/90 pt-0.5">
                        💡 {issue.suggestion}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {tab === 'security' && (
          <div className="space-y-2.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
              <Lock className="w-3.5 h-3.5 text-rose-400" />
              <span>セキュリティ脆弱性スキャン ({metrics.securityIssues?.length || 0})</span>
            </div>

            {(!metrics.securityIssues || metrics.securityIssues.length === 0) ? (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>危険な構文やシークレットの流出リスクは検出されませんでした。</span>
              </div>
            ) : (
              metrics.securityIssues.map(sec => (
                <div
                  key={sec.id}
                  onClick={() => onSelectLine(sec.line)}
                  className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-rose-500/40 cursor-pointer space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                      <span>行 {sec.line}: {sec.type}</span>
                    </span>
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded-full border font-mono font-bold uppercase ${getSeverityBadge(
                        sec.severity
                      )}`}
                    >
                      {sec.severity}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    {sec.message}
                  </p>

                  {sec.snippet && (
                    <div className="p-2 rounded bg-slate-950/80 border border-white/[0.04] font-mono text-[10px] text-rose-300 overflow-x-auto whitespace-pre">
                      {sec.snippet}
                    </div>
                  )}

                  <div className="text-[10px] text-emerald-400 bg-emerald-500/10 p-2 rounded border border-emerald-500/20 leading-relaxed">
                    🛡️ <strong>対策</strong>: {sec.remediation}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {tab === 'refactor' && (
          <div className="space-y-2.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>リファクタリング提案 ({refactorSuggestions.length})</span>
            </div>

            {refactorSuggestions.length === 0 ? (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>特筆すべきリファクタリング箇所はありません。</span>
              </div>
            ) : (
              refactorSuggestions.map(sug => (
                <div
                  key={sug.id}
                  className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-amber-500/30 transition-all space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                      <Lightbulb className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>{sug.title}</span>
                    </div>
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded-full border font-mono shrink-0 ${
                        sug.impact === 'high'
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                          : sug.impact === 'medium'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                      }`}
                    >
                      {sug.impact.toUpperCase()}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    {sug.description}
                  </p>

                  {sug.line && (
                    <button
                      onClick={() => onSelectLine(sug.line!)}
                      className="text-[10px] font-mono text-cyan-400 hover:underline flex items-center gap-1"
                    >
                      <span>該当行 (L{sug.line}) へジャンプ</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}

                  {sug.codeBefore && sug.codeAfter && (
                    <div className="space-y-1.5 pt-1 font-mono text-[10px]">
                      <div className="p-2 rounded bg-rose-500/10 border border-rose-500/20 text-rose-300 whitespace-pre overflow-x-auto">
                        {sug.codeBefore}
                      </div>
                      <div className="p-2 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 whitespace-pre overflow-x-auto">
                        {sug.codeAfter}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
