import React, { useState } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  Info,
  CheckCircle,
  TrendingDown,
  Cpu,
  Brain,
  Layers,
  Wand2,
  Lock,
  ArrowRight
} from 'lucide-react';
import { CodeMetrics, RefactorSuggestion } from '../types';

interface QualityPanelProps {
  metrics: CodeMetrics;
  refactorSuggestions: RefactorSuggestion[];
  onSelectLine: (line: number) => void;
  onApplyRefactor?: (codeBefore?: string, codeAfter?: string) => void;
}

export const QualityPanel: React.FC<QualityPanelProps> = ({
  metrics,
  refactorSuggestions,
  onSelectLine,
  onApplyRefactor
}) => {
  const [tab, setTab] = useState<'issues' | 'security' | 'refactor'>('issues');

  const securityIssues = metrics.securityIssues || [];
  const issues = metrics.issues || [];

  return (
    <div className="flex flex-col h-full bg-[#0D1322] border-r border-white/[0.08] select-none">
      {/* メトリクス概要 */}
      <div className="p-3 border-b border-white/[0.06] bg-slate-900/60 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-300">コード品質 & セキュリティ指標</span>
          <span
            className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full border ${
              metrics.healthScore >= 80
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
            }`}
          >
            総合: {metrics.healthScore}/100
          </span>
        </div>

        {/* グリッドメトリクス */}
        <div className="grid grid-cols-2 gap-2 text-xs font-mono">
          <div className="p-2 rounded-lg bg-slate-950/60 border border-white/[0.04]">
            <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              <span>循環複雑度</span>
            </div>
            <div className="text-base font-bold text-slate-100 mt-1">
              {metrics.cyclomaticComplexity}
            </div>
          </div>

          <div className="p-2 rounded-lg bg-slate-950/60 border border-white/[0.04]">
            <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
              <Brain className="w-3.5 h-3.5 text-violet-400" />
              <span>認知複雑度</span>
            </div>
            <div className="text-base font-bold text-slate-100 mt-1">
              {metrics.cognitiveComplexity}
            </div>
          </div>

          <div className="p-2 rounded-lg bg-slate-950/60 border border-white/[0.04]">
            <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              <span>セキュリティ</span>
            </div>
            <div className="text-base font-bold text-slate-100 mt-1">
              {metrics.securityScore}/100
            </div>
          </div>

          <div className="p-2 rounded-lg bg-slate-950/60 border border-white/[0.04]">
            <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <span>保守性 (MI)</span>
            </div>
            <div className="text-base font-bold text-slate-100 mt-1">
              {metrics.maintainabilityIndex}/100
            </div>
          </div>
        </div>
      </div>

      {/* タブ切り替え */}
      <div className="flex items-center border-b border-white/[0.06] bg-slate-900/40 p-1 gap-1">
        <button
          onClick={() => setTab('issues')}
          className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${
            tab === 'issues'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          課題 ({issues.length})
        </button>
        <button
          onClick={() => setTab('security')}
          className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${
            tab === 'security'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          セキュリティ ({securityIssues.length})
        </button>
        <button
          onClick={() => setTab('refactor')}
          className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${
            tab === 'refactor'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          リファクタ ({refactorSuggestions.length})
        </button>
      </div>

      {/* コンテンツ */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2 select-text">
        {tab === 'issues' && (
          issues.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-500">
              問題は検出されませんでした ✨
            </div>
          ) : (
            issues.map(iss => (
              <div
                key={iss.id}
                onClick={() => onSelectLine(iss.line)}
                className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-amber-500/40 transition-all cursor-pointer space-y-1"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-amber-300 font-bold">
                    L{iss.line}: {iss.rule}
                  </span>
                  <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
                    {iss.severity}
                  </span>
                </div>
                <div className="text-xs text-slate-300">
                  {iss.message}
                </div>
                {iss.suggestion && (
                  <div className="text-[11px] text-slate-400 font-mono pt-1">
                    💡 {iss.suggestion}
                  </div>
                )}
              </div>
            ))
          )
        )}

        {tab === 'security' && (
          securityIssues.length === 0 ? (
            <div className="text-center py-8 text-xs text-emerald-400">
              セキュリティ脆弱性は検出されませんでした 🛡️
            </div>
          ) : (
            securityIssues.map(sec => (
              <div
                key={sec.id}
                onClick={() => onSelectLine(sec.line)}
                className="p-2.5 rounded-xl bg-rose-500/[0.03] border border-rose-500/30 hover:border-rose-500/60 transition-all cursor-pointer space-y-1.5"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-rose-300 font-bold">
                    L{sec.line}: {sec.type}
                  </span>
                  <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 font-mono">
                    {sec.severity}
                  </span>
                </div>
                <div className="text-xs text-slate-200">
                  {sec.message}
                </div>
                <div className="p-2 rounded bg-slate-950/80 border border-rose-500/20 text-[10.5px] text-emerald-300 font-mono">
                  対策: {sec.remediation}
                </div>
              </div>
            ))
          )
        )}

        {tab === 'refactor' && (
          refactorSuggestions.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-500">
              リファクタリング提案はありません ✨
            </div>
          ) : (
            refactorSuggestions.map(sug => (
              <div
                key={sug.id}
                className="p-2.5 rounded-xl bg-slate-900/90 border border-cyan-500/30 shadow-lg space-y-2"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-cyan-300">
                    💡 {sug.title}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {sug.codeBefore && sug.codeAfter && onApplyRefactor && (
                      <button
                        onClick={() => onApplyRefactor(sug.codeBefore, sug.codeAfter)}
                        className="flex items-center gap-1 px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[10px] font-mono hover:bg-cyan-500/30 transition-all"
                        title="コードにリファクタを直接適用"
                      >
                        <Wand2 className="w-3 h-3" />
                        <span>適用</span>
                      </button>
                    )}
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-mono">
                      {sug.impact}
                    </span>
                  </div>
                </div>

                <div className="text-xs text-slate-300">
                  {sug.description}
                </div>

                {sug.codeBefore && sug.codeAfter && (
                  <div className="space-y-1 font-mono text-[9.5px]">
                    <div className="p-1.5 rounded bg-rose-950/30 border border-rose-500/20 text-rose-300 overflow-x-auto whitespace-pre">
                      - {sug.codeBefore}
                    </div>
                    <div className="p-1.5 rounded bg-emerald-950/30 border border-emerald-500/20 text-emerald-300 overflow-x-auto whitespace-pre">
                      + {sug.codeAfter}
                    </div>
                  </div>
                )}
              </div>
            ))
          )
        )}
      </div>
    </div>
  );
};
