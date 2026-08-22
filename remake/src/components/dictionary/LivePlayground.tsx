import React, { useState } from 'react';
import { Play, RotateCcw, Copy, Check, Terminal, Clock, ArrowUpRight } from 'lucide-react';
import { SupportedLanguage } from '../../types';
import { executePlaygroundCode, ExecutionResult } from '../../core/dictionary/interactiveRunner';

interface LivePlaygroundProps {
  initialCode: string;
  language: SupportedLanguage;
  onInsertCode?: (code: string) => void;
}

export const LivePlayground: React.FC<LivePlaygroundProps> = ({
  initialCode,
  language,
  onInsertCode
}) => {
  const [code, setCode] = useState<string>(initialCode);
  const [result, setResult] = useState<ExecutionResult | null>(null);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const handleRun = () => {
    setIsRunning(true);
    setTimeout(() => {
      const res = executePlaygroundCode(code, language);
      setResult(res);
      setIsRunning(false);
    }, 80);
  };

  const handleReset = () => {
    setCode(initialCode);
    setResult(null);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-3.5 rounded-xl bg-slate-950/80 border border-white/[0.08] space-y-3">
      {/* ツールバー */}
      <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
        <div className="flex items-center gap-1.5">
          <Terminal className="w-4 h-4 text-emerald-400" />
          <span className="font-semibold text-xs text-slate-100">ライブ・プレイグラウンド</span>
          <span className="text-[10px] text-slate-500 font-mono">({language})</span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleReset}
            title="初期コードに戻す"
            className="p-1 rounded bg-white/[0.04] hover:bg-white/[0.08] text-slate-400 hover:text-slate-200 text-[10px] flex items-center gap-1 px-2 border border-white/[0.06] transition-all"
          >
            <RotateCcw className="w-3 h-3" />
            <span>リセット</span>
          </button>

          <button
            onClick={handleCopy}
            title="コードをコピー"
            className="p-1 rounded bg-white/[0.04] hover:bg-white/[0.08] text-slate-400 hover:text-slate-200 text-[10px] flex items-center gap-1 px-2 border border-white/[0.06] transition-all"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span>{copied ? 'コピー完了' : 'コピー'}</span>
          </button>

          {onInsertCode && (
            <button
              onClick={() => onInsertCode(code)}
              title="エディタにこのコードを挿入"
              className="p-1 rounded bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-[10px] flex items-center gap-1 px-2.5 border border-cyan-500/40 transition-all font-medium"
            >
              <ArrowUpRight className="w-3 h-3" />
              <span>エディタへ挿入</span>
            </button>
          )}

          <button
            onClick={handleRun}
            disabled={isRunning}
            className="py-1 px-3 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 hover:text-emerald-200 border border-emerald-500/40 text-xs font-semibold flex items-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all active:scale-95"
          >
            <Play className="w-3 h-3 fill-emerald-300" />
            <span>{isRunning ? '実行中...' : '実行'}</span>
          </button>
        </div>
      </div>

      {/* 編集可能コードエディタ */}
      <div className="relative rounded-lg overflow-hidden border border-white/[0.06] bg-[#0A0D14]">
        <div className="absolute top-1.5 right-2 text-[9px] font-mono text-slate-600 select-none">
          Live Editable
        </div>
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          spellCheck={false}
          className="w-full h-40 p-3 bg-transparent font-mono text-xs text-slate-200 leading-relaxed focus:outline-none resize-y border-none"
        />
      </div>

      {/* 実行結果 & コンソール出力パネル */}
      {result && (
        <div className="p-3 rounded-lg bg-[#060910] border border-white/[0.06] space-y-2">
          <div className="flex items-center justify-between text-[10px] border-b border-white/[0.04] pb-1.5">
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${result.success ? 'bg-emerald-400 shadow-[0_0_8px_#10b981]' : 'bg-rose-500 shadow-[0_0_8px_#f43f5e]'}`} />
              <span className="font-mono font-medium text-slate-300">
                {result.success ? 'Execution Successful' : 'Execution Error'}
              </span>
            </div>
            <div className="flex items-center gap-1 text-slate-500 font-mono text-[9px]">
              <Clock className="w-2.5 h-2.5" />
              <span>{result.executionTimeMs} ms</span>
            </div>
          </div>

          {result.error ? (
            <div className="text-xs font-mono text-rose-400 bg-rose-950/30 p-2 rounded border border-rose-800/40 whitespace-pre-wrap">
              {result.error}
            </div>
          ) : (
            <div className="space-y-1 font-mono text-xs text-slate-300 max-h-36 overflow-y-auto">
              {result.logs.map((log, lIdx) => (
                <div key={lIdx} className="flex items-start gap-1.5 text-emerald-300/90 leading-tight">
                  <span className="text-slate-600 select-none">&gt;</span>
                  <span className="whitespace-pre-wrap">{log}</span>
                </div>
              ))}
              {result.returnValue && (
                <div className="pt-1 text-[10.5px] text-cyan-300/80 border-t border-white/[0.04]">
                  Return: {result.returnValue}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
