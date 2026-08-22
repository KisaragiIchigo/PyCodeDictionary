import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  X,
  ChevronDown,
  ChevronUp,
  ZoomIn,
  ZoomOut,
  Play,
  BookOpen,
  Lightbulb,
  ExternalLink,
  Code,
  Box
} from 'lucide-react';
import { SupportedLanguage, DictEntry, SymbolNode } from '../types';
import { findDictEntryForWord } from '../core/dictionary/dictionaryResolver';

interface CodeViewerProps {
  code: string;
  language: SupportedLanguage;
  symbols?: SymbolNode[];
  masterProjectDictionary?: DictEntry[];
  targetLine?: number | null;
  onCodeChange: (newCode: string) => void;
  onReanalyze: () => void;
  onSelectLine?: (line: number) => void;
}

export const CodeViewer: React.FC<CodeViewerProps> = ({
  code,
  language,
  symbols = [],
  masterProjectDictionary,
  targetLine,
  onCodeChange,
  onReanalyze,
  onSelectLine
}) => {
  const [fontSize, setFontSize] = useState<number>(13);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchMatches, setSearchMatches] = useState<number[]>([]);
  const [currentMatchIndex, setCurrentMatchIndex] = useState<number>(-1);
  const [showSearch, setShowSearch] = useState<boolean>(false);
  const [isDirty, setIsDirty] = useState<boolean>(false);

  // 選択中シンボルのスマートハイライト
  const [selectedWord, setSelectedWord] = useState<string | null>(null);

  // ホバーインライン辞書ポップオーバー
  const [hoveredDict, setHoveredDict] = useState<DictEntry | null>(null);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const hoverTimerRef = useRef<NodeJS.Timeout | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const lineRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const searchInputRef = useRef<HTMLInputElement>(null);

  const lines = code.split('\n');

  // シンボル定義行のマップ
  const symbolLineMap = new Map<number, SymbolNode>();
  for (const s of symbols) {
    symbolLineMap.set(s.startLine, s);
  }

  // targetLineが指定されたらスクロール
  useEffect(() => {
    if (targetLine && targetLine > 0) {
      const el = lineRefs.current.get(targetLine);
      if (el && containerRef.current) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [targetLine]);

  // ショートカットキー (Ctrl+F)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        setShowSearch(true);
        setTimeout(() => searchInputRef.current?.focus(), 50);
      } else if (e.key === 'Escape' && showSearch) {
        setShowSearch(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showSearch]);

  // 検索ヒットの更新
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchMatches([]);
      setCurrentMatchIndex(-1);
      return;
    }
    const q = searchQuery.toLowerCase();
    const matches: number[] = [];
    lines.forEach((line, idx) => {
      if (line.toLowerCase().includes(q)) {
        matches.push(idx + 1);
      }
    });
    setSearchMatches(matches);
    setCurrentMatchIndex(matches.length > 0 ? 0 : -1);
    if (matches.length > 0) {
      const el = lineRefs.current.get(matches[0]);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [searchQuery, code]);

  const handleNextMatch = () => {
    if (searchMatches.length === 0) return;
    const nextIdx = (currentMatchIndex + 1) % searchMatches.length;
    setCurrentMatchIndex(nextIdx);
    const lineNum = searchMatches[nextIdx];
    const el = lineRefs.current.get(lineNum);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const handlePrevMatch = () => {
    if (searchMatches.length === 0) return;
    const prevIdx = (currentMatchIndex - 1 + searchMatches.length) % searchMatches.length;
    setCurrentMatchIndex(prevIdx);
    const lineNum = searchMatches[prevIdx];
    const el = lineRefs.current.get(lineNum);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  // 単語ホバーハンドラ
  const handleWordMouseEnter = (word: string, e: React.MouseEvent) => {
    if (!word || word.length < 2 || /^\s+$/.test(word)) return;

    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);

    const clientX = e.clientX;
    const clientY = e.clientY;

    hoverTimerRef.current = setTimeout(() => {
      const entry = findDictEntryForWord(word, language, masterProjectDictionary);
      if (entry) {
        setHoveredDict(entry);
        setHoverPos({ x: clientX, y: clientY });
      }
    }, 220);
  };

  const handleWordMouseLeave = () => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    setHoveredDict(null);
  };

  // トークンレンダラー
  const renderHighlightedLine = (text: string, lineNum: number) => {
    if (!text) return ' ';

    if (text.trim().startsWith('#') || text.trim().startsWith('//') || text.trim().startsWith('/*')) {
      return <span className="text-slate-500 italic">{text}</span>;
    }

    const tokens = text.split(/(\s+|[(){}[\].,:;=+\-*/<>!&|"'`])/);

    const kwSet = new Set([
      'def', 'class', 'async', 'await', 'return', 'if', 'else', 'elif', 'for', 'while', 'import', 'from', 'with', 'yield',
      'function', 'const', 'let', 'var', 'interface', 'type', 'export', 'public', 'private', 'readonly',
      'fn', 'struct', 'enum', 'impl', 'pub', 'mut', 'use', 'match',
      'func', 'package', 'defer', 'go', 'select', 'chan'
    ]);

    const typeSet = new Set([
      'str', 'int', 'float', 'bool', 'list', 'dict', 'set', 'tuple', 'Optional', 'List', 'Dict',
      'string', 'number', 'boolean', 'void', 'any', 'Promise', 'Record',
      'String', 'Vec', 'Result', 'Option', 'u32', 'i32', 'f64',
      'error', 'byte'
    ]);

    return tokens.map((token, i) => {
      const isSelectedToken = selectedWord && token === selectedWord;
      const isSearchHit = searchQuery.trim() && token.toLowerCase() === searchQuery.toLowerCase();

      let tokenClass = 'hover:underline cursor-pointer transition-colors';
      let colorClass = 'text-slate-300';

      if (kwSet.has(token)) {
        colorClass = 'text-cyan-400 font-semibold';
      } else if (typeSet.has(token)) {
        colorClass = 'text-emerald-400 font-medium';
      } else if (token.startsWith('"') || token.startsWith("'") || token.startsWith('`')) {
        colorClass = 'text-amber-300';
      } else if (/^\d+(\.\d+)?$/.test(token)) {
        colorClass = 'text-violet-300';
      }

      if (isSelectedToken) {
        tokenClass += ' bg-cyan-400/30 text-cyan-200 font-bold px-0.5 rounded shadow-glow-cyan';
      } else if (isSearchHit) {
        tokenClass += ' bg-amber-400/40 text-amber-200 font-bold px-0.5 rounded';
      }

      return (
        <span
          key={i}
          onClick={(e) => {
            e.stopPropagation();
            if (token.trim().length > 1) {
              setSelectedWord(prev => (prev === token ? null : token));
            }
          }}
          onMouseEnter={(e) => handleWordMouseEnter(token, e)}
          onMouseLeave={handleWordMouseLeave}
          className={`${colorClass} ${tokenClass}`}
        >
          {token}
        </span>
      );
    });
  };

  return (
    <div className="relative flex flex-col h-full bg-[#0B0F19] select-text">
      {/* ツールバー */}
      <div className="h-9 px-3 flex items-center justify-between border-b border-white/[0.06] bg-slate-900/60 select-none">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-medium text-slate-400">エディタ</span>
          <span className="text-[11px] text-slate-500 font-mono">({lines.length} 行)</span>
          {selectedWord && (
            <div className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              <span>選択: {selectedWord}</span>
              <button
                onClick={() => setSelectedWord(null)}
                className="hover:text-white ml-0.5"
              >
                ×
              </button>
            </div>
          )}
          {isDirty && (
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
              未再解析
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {isDirty && (
            <button
              onClick={() => {
                onReanalyze();
                setIsDirty(false);
              }}
              className="flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30 transition-all shadow-sm animate-pulse"
            >
              <Play className="w-3 h-3" />
              <span>再解析</span>
            </button>
          )}

          <button
            onClick={() => setShowSearch(!showSearch)}
            className={`p-1 rounded text-xs transition-colors ${
              showSearch ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-slate-200'
            }`}
            title="コード内検索 (Ctrl+F)"
          >
            <Search className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setFontSize(prev => Math.min(20, prev + 1))}
            className="p-1 text-slate-400 hover:text-slate-200 rounded"
            title="文字サイズ拡大"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setFontSize(prev => Math.max(10, prev - 1))}
            className="p-1 text-slate-400 hover:text-slate-200 rounded"
            title="文字サイズ縮小"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* インライン辞書ポップオーバー */}
      {hoveredDict && (
        <div
          style={{
            position: 'fixed',
            left: `${Math.min(window.innerWidth - 360, hoverPos.x + 10)}px`,
            top: `${Math.min(window.innerHeight - 280, hoverPos.y + 18)}px`
          }}
          className="z-50 w-80 p-3.5 rounded-2xl bg-slate-900/98 border border-cyan-500/50 shadow-2xl backdrop-blur-xl pointer-events-none space-y-2 select-text animate-in fade-in zoom-in-95 duration-150"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
              <span className="font-mono font-bold text-sm text-cyan-300">
                {hoveredDict.term}
              </span>
            </div>
            <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-mono">
              {hoveredDict.category}
            </span>
          </div>

          <div className="text-xs font-semibold text-slate-200">
            {hoveredDict.summary}
          </div>

          <div className="text-[11px] text-slate-400 leading-relaxed">
            {hoveredDict.detailedExplanation}
          </div>

          {hoveredDict.example && (
            <div className="p-2 rounded-lg bg-slate-950/80 border border-white/[0.04] font-mono text-[9.5px] text-amber-200 whitespace-pre overflow-x-auto">
              {hoveredDict.example}
            </div>
          )}

          {hoveredDict.bestPractice && (
            <div className="flex items-start gap-1 p-1.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-[10px] text-emerald-300">
              <Lightbulb className="w-3 h-3 shrink-0 mt-0.5" />
              <span>{hoveredDict.bestPractice}</span>
            </div>
          )}
        </div>
      )}

      {/* 検索バー */}
      {showSearch && (
        <div className="absolute top-10 right-4 z-20 flex items-center gap-2 p-1.5 rounded-lg bg-slate-900/95 border border-cyan-500/40 shadow-xl backdrop-blur-md">
          <Search className="w-3.5 h-3.5 text-cyan-400 ml-1" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                if (e.shiftKey) handlePrevMatch();
                else handleNextMatch();
              }
            }}
            placeholder="検索ワード..."
            className="bg-transparent text-xs text-slate-200 focus:outline-none w-36 font-mono"
          />
          <span className="text-[10px] text-slate-400 font-mono">
            {searchMatches.length > 0 ? `${currentMatchIndex + 1}/${searchMatches.length}` : '0件'}
          </span>
          <button onClick={handlePrevMatch} className="p-0.5 text-slate-400 hover:text-slate-200">
            <ChevronUp className="w-3.5 h-3.5" />
          </button>
          <button onClick={handleNextMatch} className="p-0.5 text-slate-400 hover:text-slate-200">
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setShowSearch(false)} className="p-0.5 text-slate-400 hover:text-slate-200">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* コード表示エリア */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto font-mono leading-relaxed"
        style={{ fontSize: `${fontSize}px` }}
      >
        <div className="min-w-full inline-block">
          {lines.map((line, idx) => {
            const lineNum = idx + 1;
            const isTarget = targetLine === lineNum;
            const isMatch = searchMatches.includes(lineNum);
            const isCurrentMatch = searchMatches[currentMatchIndex] === lineNum;
            const symbolAtLine = symbolLineMap.get(lineNum);

            return (
              <div
                key={lineNum}
                ref={(el) => {
                  if (el) lineRefs.current.set(lineNum, el);
                  else lineRefs.current.delete(lineNum);
                }}
                className={`flex items-start transition-colors duration-150 ${
                  isTarget
                    ? 'bg-cyan-500/20 border-l-4 border-cyan-400 shadow-glow-cyan'
                    : isCurrentMatch
                    ? 'bg-amber-500/15 border-l-4 border-amber-400'
                    : 'hover:bg-white/[0.02]'
                }`}
              >
                {/* 行番号 & シンボル定義アイコン */}
                <div className="w-14 px-2 py-0.5 text-right text-slate-600 select-none bg-slate-950/50 border-r border-white/[0.04] text-[11px] flex items-center justify-end gap-1 shrink-0">
                  {symbolAtLine && (
                    <span
                      title={`${symbolAtLine.kind}: ${symbolAtLine.name}`}
                      className="text-cyan-400 cursor-pointer"
                    >
                      {symbolAtLine.kind === 'class' ? 'C' : 'f'}
                    </span>
                  )}
                  <span>{lineNum}</span>
                </div>

                {/* コード本文 */}
                <div className="flex-1 px-3 py-0.5 whitespace-pre overflow-visible text-slate-300">
                  {renderHighlightedLine(line, lineNum)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
