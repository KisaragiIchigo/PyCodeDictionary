import React, { useState } from 'react';
import {
  Crown,
  Zap,
  Globe,
  ShieldCheck,
  AlertTriangle,
  Layers,
  Sparkles,
  Copy,
  Check,
  ArrowRight,
  SplitSquareVertical
} from 'lucide-react';
import { ArchitectureDiagnosis, OrchestrationBlueprint } from '../types';

interface ArchitecturePanelProps {
  diagnoses: ArchitectureDiagnosis[];
  blueprints: OrchestrationBlueprint[];
  onSelectSymbol: (symbolName: string) => void;
}

export const ArchitecturePanel: React.FC<ArchitecturePanelProps> = ({
  diagnoses,
  blueprints,
  onSelectSymbol
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const orchestrators = diagnoses.filter(d => d.role === 'orchestrator');
  const pureLogics = diagnoses.filter(d => d.role === 'pure_logic');
  const ioEffects = diagnoses.filter(d => d.role === 'io_effect');
  const validators = diagnoses.filter(d => d.role === 'validator');
  const mixedList = diagnoses.filter(d => d.role === 'mixed');

  const total = diagnoses.length || 1;

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-[#0D1322] border-r border-white/[0.08] p-3 overflow-y-auto space-y-4 select-none">
      {/* 設計サマリカード */}
      <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.08] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-bold text-slate-100">アーキテクチャ & 責務設計診断</span>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-mono">
            {mixedList.length === 0 ? '✨ 適切な責務分離' : `⚠️ 要分割: ${mixedList.length}件`}
          </span>
        </div>

        {/* 役割別比率バー */}
        <div className="space-y-1.5 pt-1">
          <div className="h-2 rounded-full overflow-hidden flex bg-slate-800">
            <div
              style={{ width: `${(orchestrators.length / total) * 100}%` }}
              className="bg-amber-400"
              title={`Orchestrator: ${orchestrators.length}`}
            />
            <div
              style={{ width: `${(pureLogics.length / total) * 100}%` }}
              className="bg-emerald-400"
              title={`Pure Logic: ${pureLogics.length}`}
            />
            <div
              style={{ width: `${(ioEffects.length / total) * 100}%` }}
              className="bg-cyan-400"
              title={`I/O Effect: ${ioEffects.length}`}
            />
            <div
              style={{ width: `${(validators.length / total) * 100}%` }}
              className="bg-violet-400"
              title={`Validator: ${validators.length}`}
            />
            <div
              style={{ width: `${(mixedList.length / total) * 100}%` }}
              className="bg-rose-400"
              title={`Mixed: ${mixedList.length}`}
            />
          </div>

          {/* 凡例バッジ */}
          <div className="grid grid-cols-2 gap-1.5 text-[10px] font-mono pt-1">
            <div className="flex items-center gap-1.5 text-amber-300">
              <Crown className="w-3 h-3" />
              <span>司令塔 (Orchestrator): {orchestrators.length}</span>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-300">
              <Zap className="w-3 h-3" />
              <span>計算層 (Pure Logic): {pureLogics.length}</span>
            </div>
            <div className="flex items-center gap-1.5 text-cyan-300">
              <Globe className="w-3 h-3" />
              <span>通信・I/O (Effect): {ioEffects.length}</span>
            </div>
            <div className="flex items-center gap-1.5 text-violet-300">
              <ShieldCheck className="w-3 h-3" />
              <span>検証層 (Validator): {validators.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* オーケストレーション・ブループリント（リファクタ雛形） */}
      {blueprints.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-200">
            <div className="flex items-center gap-1.5">
              <SplitSquareVertical className="w-3.5 h-3.5 text-amber-400" />
              <span>オーケストレーション分解設計 ({blueprints.length})</span>
            </div>
          </div>

          {blueprints.map((bp, idx) => (
            <div
              key={idx}
              className="p-3 rounded-xl bg-slate-900/90 border border-amber-500/40 shadow-xl space-y-3 select-text"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-amber-300">
                  🎯 {bp.targetSymbol}
                </span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 font-mono">
                  責務混在を検知
                </span>
              </div>

              <p className="text-[11px] text-slate-300 leading-relaxed">
                {bp.explanation}
              </p>

              {/* オーケストレータ本体コード */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                  <span>👑 オーケストレータ（司令塔）</span>
                  <button
                    onClick={() => handleCopy(bp.orchestratorCode, `orch-${idx}`)}
                    className="p-1 hover:text-cyan-300 transition-colors"
                    title="コードをコピー"
                  >
                    {copiedId === `orch-${idx}` ? (
                      <Check className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-950/90 border border-white/[0.06] font-mono text-[10px] text-amber-200 overflow-x-auto whitespace-pre leading-relaxed">
                  {bp.orchestratorCode}
                </div>
              </div>

              {/* 分割された各ステップ関数群 */}
              <div className="space-y-1.5 pt-1">
                <div className="text-[10px] font-semibold text-slate-300">
                  ✂️ 切り出された独立ステップ関数群:
                </div>
                {bp.extractedStepCodes.map((step, sIdx) => (
                  <div
                    key={sIdx}
                    className="p-2 rounded-lg bg-slate-950/60 border border-white/[0.04] space-y-1"
                  >
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-mono font-bold text-cyan-300">
                        {step.role} : {step.name}
                      </span>
                      <button
                        onClick={() => handleCopy(step.code, `step-${idx}-${sIdx}`)}
                        className="p-0.5 text-slate-400 hover:text-cyan-300"
                        title="コピー"
                      >
                        {copiedId === `step-${idx}-${sIdx}` ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                    <div className="font-mono text-[9.5px] text-slate-300 whitespace-pre overflow-x-auto">
                      {step.code}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 全関数の責務・役割リスト */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
          <Layers className="w-3.5 h-3.5 text-cyan-400" />
          <span>全関数のアーキテクチャ診断 ({diagnoses.length})</span>
        </div>

        {diagnoses.map((diag, i) => (
          <div
            key={i}
            onClick={() => onSelectSymbol(diag.symbolName)}
            className={`p-2.5 rounded-xl border transition-all cursor-pointer space-y-1.5 select-text ${
              diag.role === 'mixed'
                ? 'bg-rose-500/[0.03] border-rose-500/30 hover:border-rose-500/60'
                : diag.role === 'orchestrator'
                ? 'bg-amber-500/[0.03] border-amber-500/30 hover:border-amber-500/60'
                : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04]'
            }`}
          >
            <div className="flex items-center justify-between text-xs">
              <span className="font-mono font-bold text-slate-100 truncate">
                {diag.symbolName}
              </span>
              <span
                className={`text-[9px] px-1.5 py-0.2 rounded-full border font-mono font-bold uppercase ${
                  diag.role === 'orchestrator'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : diag.role === 'pure_logic'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : diag.role === 'io_effect'
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                    : diag.role === 'validator'
                    ? 'bg-violet-500/20 text-violet-300 border-violet-500/40'
                    : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                }`}
              >
                {diag.role}
              </span>
            </div>

            <div className="flex flex-wrap gap-1">
              {diag.detectedResponsibilities.map((resp, rIdx) => (
                <span
                  key={rIdx}
                  className="text-[9px] px-1.5 py-0.2 rounded bg-white/[0.04] text-slate-400 border border-white/[0.06]"
                >
                  {resp}
                </span>
              ))}
            </div>

            <div className="text-[10.5px] text-slate-400 leading-relaxed">
              {diag.refactorAdvice}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
