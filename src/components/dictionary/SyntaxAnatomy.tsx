import React, { useState } from 'react';
import { Sparkles, Info, Layers, CheckCircle2 } from 'lucide-react';
import { SyntaxAnatomyData, SyntaxToken } from '../../types';

interface SyntaxAnatomyProps {
  anatomy: SyntaxAnatomyData;
}

export const SyntaxAnatomy: React.FC<SyntaxAnatomyProps> = ({ anatomy }) => {
  const [activeToken, setActiveToken] = useState<SyntaxToken | null>(
    anatomy.tokens[0] || null
  );

  const getTokenStyle = (token: SyntaxToken, isSelected: boolean) => {
    const base = 'transition-all duration-150 rounded px-1.5 py-0.5 cursor-pointer font-mono font-medium text-xs inline-block m-0.5 border';
    
    if (isSelected) {
      return `${base} bg-cyan-500/25 text-cyan-200 border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.4)] scale-105`;
    }

    switch (token.type) {
      case 'keyword':
        return `${base} bg-violet-500/15 text-violet-300 border-violet-500/30 hover:border-violet-400 hover:bg-violet-500/25`;
      case 'identifier':
        return `${base} bg-cyan-500/15 text-cyan-300 border-cyan-500/30 hover:border-cyan-400 hover:bg-cyan-500/25`;
      case 'type':
      case 'return':
        return `${base} bg-emerald-500/15 text-emerald-300 border-emerald-500/30 hover:border-emerald-400 hover:bg-emerald-500/25`;
      case 'param':
        return `${base} bg-amber-500/15 text-amber-300 border-amber-500/30 hover:border-amber-400 hover:bg-amber-500/25`;
      default:
        return `${base} bg-slate-800/60 text-slate-300 border-slate-700 hover:border-slate-500`;
    }
  };

  return (
    <div className="p-3.5 rounded-xl bg-slate-950/80 border border-white/[0.08] space-y-3">
      {/* タイトルと説明 */}
      <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
        <div className="flex items-center gap-1.5">
          <Layers className="w-4 h-4 text-cyan-400" />
          <span className="font-semibold text-xs text-slate-100">{anatomy.title}</span>
        </div>
        <span className="text-[10px] text-cyan-400/80 font-mono bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-800/40">
          トークンをクリックして解剖
        </span>
      </div>

      <p className="text-[11px] text-slate-400 leading-relaxed">
        {anatomy.description}
      </p>

      {/* インタラクティブ構文コード */}
      <div className="p-2.5 rounded-lg bg-[#0B0F19] border border-white/[0.06] flex flex-wrap items-center">
        {anatomy.tokens.map((token, idx) => {
          const isSelected = activeToken === token;
          return (
            <button
              key={idx}
              onClick={() => setActiveToken(token)}
              onMouseEnter={() => setActiveToken(token)}
              className={getTokenStyle(token, isSelected)}
            >
              {token.text}
            </button>
          );
        })}
      </div>

      {/* 選択されたトークンの詳細解説インスペクタ */}
      {activeToken && (
        <div className="p-3 rounded-lg bg-slate-900/90 border border-cyan-500/30 space-y-1.5 transition-all animate-fadeIn">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-xs text-cyan-300 px-1.5 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/40">
                {activeToken.text}
              </span>
              <span className="text-xs font-semibold text-slate-200">
                {activeToken.role}
              </span>
            </div>
            <span className="text-[9px] px-1.5 py-0.5 rounded uppercase font-mono bg-white/[0.04] text-slate-400 border border-white/[0.06]">
              {activeToken.type || 'token'}
            </span>
          </div>

          <p className="text-[11px] text-slate-300 leading-relaxed pt-1">
            {activeToken.explanation}
          </p>
        </div>
      )}
    </div>
  );
};
