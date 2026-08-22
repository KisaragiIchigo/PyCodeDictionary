import React, { useState } from 'react';
import { Sparkles, Layers, Terminal, Activity, HelpCircle, X, ArrowUpRight } from 'lucide-react';
import { DictEntry, SupportedLanguage } from '../../types';
import { resolveInteractiveExplanation } from '../../core/dictionary/interactiveData';
import { SyntaxAnatomy } from './SyntaxAnatomy';
import { LivePlayground } from './LivePlayground';
import { VisualConceptSim } from './VisualConceptSim';
import { DictionaryQuiz } from './DictionaryQuiz';

interface InteractiveExplainerProps {
  entry: DictEntry;
  language: SupportedLanguage;
  onClose?: () => void;
  onInsertCode?: (code: string) => void;
}

export const InteractiveExplainer: React.FC<InteractiveExplainerProps> = ({
  entry,
  language,
  onClose,
  onInsertCode
}) => {
  const interactive = resolveInteractiveExplanation(entry);

  const availableTabs: { id: 'anatomy' | 'playground' | 'sim' | 'quiz'; label: string; icon: React.FC<any> }[] = [];

  if (interactive?.anatomy) {
    availableTabs.push({ id: 'anatomy', label: '構文解剖', icon: Layers });
  }
  if (interactive?.playgroundDefaultCode || entry.example) {
    availableTabs.push({ id: 'playground', label: 'ライブラボ', icon: Terminal });
  }
  if (interactive?.conceptSim) {
    availableTabs.push({ id: 'sim', label: '概念シミュレータ', icon: Activity });
  }
  if (interactive?.quiz) {
    availableTabs.push({ id: 'quiz', label: '理解度クイズ', icon: HelpCircle });
  }

  const [currentTab, setCurrentTab] = useState<'anatomy' | 'playground' | 'sim' | 'quiz'>(
    availableTabs[0]?.id || 'playground'
  );

  if (!interactive && !entry.example) {
    return (
      <div className="p-4 rounded-xl bg-slate-900 border border-white/10 text-center text-xs text-slate-400">
        この用語のインタラクティブ解説は準備中です
      </div>
    );
  }

  const initialCode = interactive?.playgroundDefaultCode || entry.example || `${entry.term}()`;

  return (
    <div className="rounded-xl bg-[#0E1526] border border-cyan-500/30 shadow-2xl shadow-cyan-950/50 overflow-hidden flex flex-col space-y-3 p-3 select-none animate-fadeIn">
      {/* ヘッダー */}
      <div className="flex items-center justify-between border-b border-white/[0.08] pb-2.5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-sm text-cyan-200">
                {entry.term}
              </span>
              <span className="text-[9.5px] px-1.5 py-0.2 rounded-full font-mono bg-cyan-950/60 text-cyan-300 border border-cyan-500/30">
                インタラクティブ解説
              </span>
            </div>
            <p className="text-[10.5px] text-slate-400 font-sans line-clamp-1">
              {entry.summary}
            </p>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-200 hover:bg-white/[0.06] transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* サブタブバー */}
      {availableTabs.length > 1 && (
        <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-950/80 border border-white/[0.04]">
          {availableTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setCurrentTab(tab.id)}
                className={`flex-1 py-1.5 px-2 rounded-md text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
                  isActive
                    ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/40 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.02]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* タブコンテンツ */}
      <div className="select-text">
        {currentTab === 'anatomy' && interactive?.anatomy && (
          <SyntaxAnatomy anatomy={interactive.anatomy} />
        )}

        {currentTab === 'playground' && (
          <LivePlayground
            initialCode={initialCode}
            language={entry.language === 'all' ? language : entry.language}
            onInsertCode={onInsertCode}
          />
        )}

        {currentTab === 'sim' && interactive?.conceptSim && (
          <VisualConceptSim concept={interactive.conceptSim} />
        )}

        {currentTab === 'quiz' && interactive?.quiz && (
          <DictionaryQuiz quiz={interactive.quiz} />
        )}
      </div>
    </div>
  );
};
