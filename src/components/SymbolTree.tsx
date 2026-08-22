import React, { useState } from 'react';
import {
  Code,
  Box,
  Layers,
  ArrowUpRight,
  Search,
  ChevronRight,
  ChevronDown,
  Sparkles,
  Tag
} from 'lucide-react';
import { SymbolNode, CallEdge, SymbolKind } from '../types';

interface SymbolTreeProps {
  symbols: SymbolNode[];
  callEdges: CallEdge[];
  onSelectLine: (line: number) => void;
}

export const SymbolTree: React.FC<SymbolTreeProps> = ({
  symbols,
  callEdges,
  onSelectLine
}) => {
  const [activeTab, setActiveTab] = useState<'symbols' | 'calls'>('symbols');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedClasses, setExpandedClasses] = useState<Set<string>>(new Set());

  const toggleClass = (className: string) => {
    setExpandedClasses(prev => {
      const next = new Set(prev);
      if (next.has(className)) next.delete(className);
      else next.add(className);
      return next;
    });
  };

  // クラスとそれ以外のトップレベル関数の階層構造
  const classes = symbols.filter(s => s.kind === 'class' || s.kind === 'struct' || s.kind === 'interface');
  const topLevelFuncs = symbols.filter(s => (s.kind === 'function' || s.kind === 'variable' || s.kind === 'type') && !s.parentName);

  const getSymbolIcon = (kind: SymbolKind) => {
    switch (kind) {
      case 'class':
      case 'struct':
        return <Box className="w-3.5 h-3.5 text-cyan-400" />;
      case 'interface':
      case 'type':
        return <Layers className="w-3.5 h-3.5 text-emerald-400" />;
      case 'function':
      case 'method':
        return <Code className="w-3.5 h-3.5 text-violet-400" />;
      default:
        return <Tag className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  const filteredSymbols = symbols.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredEdges = callEdges.filter(
    e =>
      e.sourceName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.targetName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-[#0D1322] border-r border-white/[0.08] select-none">
      {/* タブ切り替え */}
      <div className="flex items-center border-b border-white/[0.06] bg-slate-900/60 p-1 gap-1">
        <button
          onClick={() => setActiveTab('symbols')}
          className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${
            activeTab === 'symbols'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          定義 ({symbols.length})
        </button>
        <button
          onClick={() => setActiveTab('calls')}
          className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${
            activeTab === 'calls'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          呼び出し ({callEdges.length})
        </button>
      </div>

      {/* 検索入力 */}
      <div className="p-2 border-b border-white/[0.04]">
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-950/60 border border-white/10">
          <Search className="w-3 h-3 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="シンボル絞り込み..."
            className="w-full bg-transparent text-xs text-slate-200 focus:outline-none font-mono"
          />
        </div>
      </div>

      {/* リスト表示領域 */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {activeTab === 'symbols' ? (
          searchQuery ? (
            // 検索結果フラット一覧
            filteredSymbols.map(sym => (
              <div
                key={sym.id}
                onClick={() => onSelectLine(sym.startLine)}
                className="flex items-center justify-between p-1.5 rounded-lg hover:bg-white/[0.04] cursor-pointer group text-xs font-mono"
              >
                <div className="flex items-center gap-2 truncate">
                  {getSymbolIcon(sym.kind)}
                  <span className="text-slate-300 group-hover:text-cyan-300 truncate">
                    {sym.name}
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 font-sans">L{sym.startLine}</span>
              </div>
            ))
          ) : (
            // 階層ツリー一覧
            <>
              {/* クラス・構造体 */}
              {classes.map(cls => {
                const methods = symbols.filter(s => s.parentName === cls.name);
                const isExpanded = expandedClasses.has(cls.name);

                return (
                  <div key={cls.id} className="space-y-0.5">
                    <div
                      onClick={() => toggleClass(cls.name)}
                      onDoubleClick={() => onSelectLine(cls.startLine)}
                      className="flex items-center justify-between p-1.5 rounded-lg hover:bg-white/[0.04] cursor-pointer group text-xs font-mono"
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        {isExpanded ? (
                          <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                        )}
                        {getSymbolIcon(cls.kind)}
                        <span className="text-slate-200 font-bold group-hover:text-cyan-300 truncate">
                          {cls.name}
                        </span>
                      </div>
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectLine(cls.startLine);
                        }}
                        className="text-[10px] text-slate-500 hover:text-cyan-400"
                      >
                        L{cls.startLine}
                      </span>
                    </div>

                    {/* メソッド一覧（展開時） */}
                    {isExpanded && (
                      <div className="pl-6 space-y-0.5 border-l border-white/[0.06] ml-3">
                        {methods.map(m => (
                          <div
                            key={m.id}
                            onClick={() => onSelectLine(m.startLine)}
                            className="flex items-center justify-between p-1 rounded hover:bg-white/[0.04] cursor-pointer group text-[11px] font-mono"
                          >
                            <div className="flex items-center gap-1.5 truncate">
                              <Code className="w-3 h-3 text-violet-400" />
                              <span className="text-slate-400 group-hover:text-cyan-300 truncate">
                                {m.name.split('.').pop()}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-600">L{m.startLine}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* トップレベル関数 */}
              {topLevelFuncs.map(fn => (
                <div
                  key={fn.id}
                  onClick={() => onSelectLine(fn.startLine)}
                  className="flex items-center justify-between p-1.5 rounded-lg hover:bg-white/[0.04] cursor-pointer group text-xs font-mono"
                >
                  <div className="flex items-center gap-2 truncate">
                    {getSymbolIcon(fn.kind)}
                    <span className="text-slate-300 group-hover:text-cyan-300 truncate">
                      {fn.name}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500">L{fn.startLine}</span>
                </div>
              ))}
            </>
          )
        ) : (
          // 呼び出し関係一覧
          filteredEdges.length === 0 ? (
            <div className="text-center py-6 text-xs text-slate-500">呼び出し関係なし</div>
          ) : (
            filteredEdges.map(edge => (
              <div
                key={edge.id}
                onClick={() => onSelectLine(edge.lines[0])}
                className="p-2 rounded-lg bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.04] cursor-pointer group space-y-1"
              >
                <div className="flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="text-cyan-300 font-semibold truncate">{edge.sourceName}</span>
                    <ArrowUpRight className="w-3 h-3 text-slate-500 shrink-0" />
                    <span className="text-emerald-300 font-semibold truncate">{edge.targetName}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 shrink-0 font-sans">
                    {edge.count}回
                  </span>
                </div>
                <div className="text-[10px] text-slate-500 font-mono">
                  行: {edge.lines.join(', ')}
                </div>
              </div>
            ))
          )
        )}
      </div>
    </div>
  );
};
