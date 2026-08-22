import React, { useState } from 'react';
import {
  BookOpen,
  Search,
  Sparkles,
  CheckCircle,
  Code,
  Lightbulb,
  FileCode,
  ChevronDown,
  ChevronRight,
  ArrowRight,
  Play,
  Layers
} from 'lucide-react';
import { DictEntry, SupportedLanguage } from '../types';
import { allDictionaries } from '../core/dictionary/dictionaryResolver';
import { InteractiveExplainer } from './dictionary/InteractiveExplainer';

interface DictionaryPanelProps {
  matchedEntries: DictEntry[];
  language: SupportedLanguage;
  masterProjectDictionary?: DictEntry[];
  isProjectMode?: boolean;
  onSelectLine?: (line: number) => void;
  onInsertCode?: (code: string) => void;
}

export const DictionaryPanel: React.FC<DictionaryPanelProps> = ({
  matchedEntries,
  language,
  masterProjectDictionary,
  isProjectMode,
  onSelectLine,
  onInsertCode
}) => {
  const [tab, setTab] = useState<'current' | 'all' | 'custom'>('current');
  const [query, setQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedTerm, setExpandedTerm] = useState<string | null>(null);
  const [interactiveEntry, setInteractiveEntry] = useState<DictEntry | null>(null);

  const fullLangDict = allDictionaries[language] || [];
  const activeList = isProjectMode && masterProjectDictionary
    ? masterProjectDictionary
    : tab === 'current'
    ? matchedEntries
    : tab === 'custom'
    ? (masterProjectDictionary || matchedEntries).filter(e => e.category === 'custom_symbol')
    : fullLangDict;

  const filtered = activeList.filter(item => {
    const matchesQuery =
      !query ||
      item.term.toLowerCase().includes(query.toLowerCase()) ||
      item.summary.toLowerCase().includes(query.toLowerCase()) ||
      item.detailedExplanation.toLowerCase().includes(query.toLowerCase());

    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;

    return matchesQuery && matchesCategory;
  });

  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case 'custom_symbol':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'keyword':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
      case 'builtin':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'standard_lib':
        return 'bg-violet-500/20 text-violet-300 border-violet-500/40';
      case 'type':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
      default:
        return 'bg-slate-700/50 text-slate-300 border-slate-600';
    }
  };

  const toggleExpand = (term: string) => {
    setExpandedTerm(prev => (prev === term ? null : term));
  };

  return (
    <div className="flex flex-col h-full bg-[#0D1322] border-r border-white/[0.08] select-none">
      {/* タブ切り替え */}
      <div className="flex items-center border-b border-white/[0.06] bg-slate-900/60 p-1 gap-1">
        <button
          onClick={() => setTab('current')}
          className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${
            tab === 'current'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          検出語 ({matchedEntries.length})
        </button>
        <button
          onClick={() => setTab('custom')}
          className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${
            tab === 'custom'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          定義用語
        </button>
        <button
          onClick={() => setTab('all')}
          className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${
            tab === 'all'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          標準辞典 ({fullLangDict.length})
        </button>
      </div>

      {/* 検索 & フィルタ */}
      <div className="p-2 border-b border-white/[0.04] space-y-1.5">
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-950/60 border border-white/10">
          <Search className="w-3 h-3 text-slate-500" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="用語・関数・型を検索..."
            className="w-full bg-transparent text-xs text-slate-200 focus:outline-none font-mono"
          />
        </div>

        <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
          {['all', 'custom_symbol', 'keyword', 'builtin', 'standard_lib', 'type'].map(c => (
            <button
              key={c}
              onClick={() => setSelectedCategory(c)}
              className={`px-2 py-0.5 text-[10px] rounded-full border transition-all shrink-0 ${
                selectedCategory === c
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                  : 'bg-white/[0.02] text-slate-400 border-white/[0.06] hover:bg-white/[0.04]'
              }`}
            >
              {c === 'all' ? 'すべて' : c === 'custom_symbol' ? '定義シンボル' : c}
            </button>
          ))}
        </div>
      </div>

      {/* インタラクティブ解説モーダル/インスペクタ（上部固定またはポップアップ） */}
      {interactiveEntry && (
        <div className="p-2 border-b border-cyan-500/30 bg-cyan-950/20">
          <InteractiveExplainer
            entry={interactiveEntry}
            language={language}
            onClose={() => setInteractiveEntry(null)}
            onInsertCode={onInsertCode}
          />
        </div>
      )}

      {/* 辞書カード一覧 */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2 select-text">
        {filtered.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-500">
            該当する辞書エントリがありません
          </div>
        ) : (
          filtered.map((entry, idx) => {
            const isExpanded = expandedTerm === entry.term;
            const hasOccurrences = entry.occurrences && entry.occurrences.length > 0;
            const isCurrentlyInteractive = interactiveEntry?.term === entry.term;

            return (
              <div
                key={`${entry.term}-${idx}`}
                className={`p-3 rounded-xl bg-white/[0.02] border transition-all space-y-2 ${
                  isCurrentlyInteractive
                    ? 'border-cyan-500/60 shadow-[0_0_15px_rgba(6,182,212,0.2)] bg-cyan-950/10'
                    : 'border-white/[0.06] hover:border-cyan-500/30'
                }`}
              >
                {/* ヘッダー */}
                <div className="flex items-center justify-between group">
                  <div
                    onClick={() => toggleExpand(entry.term)}
                    className="flex items-center gap-1.5 cursor-pointer"
                  >
                    {hasOccurrences ? (
                      isExpanded ? (
                        <ChevronDown className="w-3.5 h-3.5 text-cyan-400" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400" />
                      )
                    ) : null}
                    <span className="font-mono font-bold text-sm text-cyan-300 group-hover:text-cyan-200">
                      {entry.term}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {hasOccurrences && (
                      <span className="text-[9.5px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-mono">
                        {entry.occurrences!.length}箇所
                      </span>
                    )}
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded-full border font-mono ${getCategoryBadge(
                        entry.category
                      )}`}
                    >
                      {entry.category === 'custom_symbol' ? '定義' : entry.category}
                    </span>

                    {/* ✨ インタラクティブ解説ボタン */}
                    <button
                      onClick={() => setInteractiveEntry(isCurrentlyInteractive ? null : entry)}
                      title="インタラクティブ解説を開く"
                      className={`p-1 rounded-md text-[10px] font-medium flex items-center gap-1 px-2 border transition-all ${
                        isCurrentlyInteractive
                          ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-bold'
                          : 'bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border-cyan-500/30 hover:border-cyan-400'
                      }`}
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>解説ラボ</span>
                    </button>
                  </div>
                </div>

                {entry.definedInFile && (
                  <div
                    onClick={() => entry.definedLine && onSelectLine && onSelectLine(entry.definedLine)}
                    className="flex items-center gap-1 text-[10px] font-mono text-cyan-400 hover:underline cursor-pointer"
                  >
                    <FileCode className="w-3 h-3 text-cyan-400" />
                    <span>{entry.definedInFile} (L{entry.definedLine})</span>
                  </div>
                )}

                <div className="text-xs text-slate-200 font-medium leading-snug">
                  {entry.summary}
                </div>

                <div className="text-[11px] text-slate-400 leading-relaxed">
                  {entry.detailedExplanation}
                </div>

                {/* コード内出現箇所一覧（展開時） */}
                {isExpanded && hasOccurrences && (
                  <div className="pt-1.5 space-y-1 border-t border-white/[0.06]">
                    <div className="text-[10px] font-mono text-slate-400">
                      コード内出現箇所:
                    </div>
                    <div className="space-y-1 max-h-36 overflow-y-auto">
                      {entry.occurrences!.map((occ, oIdx) => (
                        <div
                          key={oIdx}
                          onClick={() => onSelectLine && onSelectLine(occ.line)}
                          className="p-1.5 rounded-lg bg-slate-950/70 border border-white/[0.04] hover:border-cyan-500/40 cursor-pointer flex items-center justify-between text-[10px] font-mono group"
                        >
                          <span className="text-slate-400 truncate group-hover:text-cyan-300 max-w-[200px]">
                            {occ.preview}
                          </span>
                          <span className="text-cyan-400 text-[9.5px] shrink-0 font-sans ml-1">
                            L{occ.line}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {entry.example && (
                  <div className="mt-1 p-2 rounded-lg bg-slate-950/80 border border-white/[0.04] font-mono text-[9.5px] text-amber-200 whitespace-pre overflow-x-auto">
                    {entry.example}
                  </div>
                )}

                {entry.bestPractice && (
                  <div className="flex items-start gap-1.5 mt-1 p-1.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-[10px] text-emerald-300">
                    <Lightbulb className="w-3 h-3 shrink-0 mt-0.5" />
                    <span>{entry.bestPractice}</span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
