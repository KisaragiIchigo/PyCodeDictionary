import React, { useState } from 'react';
import {
  FolderTree,
  ChevronRight,
  ChevronDown,
  Search,
  Code,
  Box,
  Layers,
  Sparkles,
  Info,
  Sliders
} from 'lucide-react';
import { ASTNode } from '../types/ast';
import { astNodeDictionary } from '../core/ast/astDictionary';

interface ASTExplorerProps {
  rootNode: ASTNode;
  onSelectLine: (line: number) => void;
}

export const ASTExplorer: React.FC<ASTExplorerProps> = ({
  rootNode,
  onSelectLine
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedNode, setSelectedNode] = useState<ASTNode>(rootNode);
  const [collapsedMap, setCollapsedMap] = useState<Record<string, boolean>>({});

  const toggleCollapse = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCollapsedMap(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleNodeClick = (node: ASTNode) => {
    setSelectedNode(node);
    if (node.loc?.start?.line) {
      onSelectLine(node.loc.start.line);
    }
  };

  // カテゴリ別バッジ
  const getCategoryBadge = (cat: ASTNode['category']) => {
    switch (cat) {
      case 'module':
        return 'bg-violet-500/20 text-violet-300 border-violet-500/40';
      case 'declaration':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
      case 'statement':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'expression':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      default:
        return 'bg-slate-700/50 text-slate-400 border-slate-600';
    }
  };

  // ノード型に対応する辞書解説の検索
  const matchedDict = astNodeDictionary.find(d =>
    d.term.toLowerCase().includes(selectedNode.type.toLowerCase())
  );

  // 再帰ツリーレンダラー
  const renderTreeNode = (node: ASTNode, depth = 0) => {
    const isCollapsed = !!collapsedMap[node.id];
    const hasChildren = node.children && node.children.length > 0;
    const isSelected = selectedNode.id === node.id;

    const matchesSearch =
      !searchQuery ||
      node.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      node.label.toLowerCase().includes(searchQuery.toLowerCase());

    return (
      <div key={node.id} className="select-none">
        <div
          onClick={() => handleNodeClick(node)}
          style={{ paddingLeft: `${depth * 14 + 6}px` }}
          className={`flex items-center justify-between py-1 px-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer group ${
            isSelected
              ? 'bg-cyan-500/25 border border-cyan-500/50 text-cyan-200 shadow-sm'
              : matchesSearch
              ? 'hover:bg-white/[0.04] text-slate-300'
              : 'opacity-40 hover:opacity-80 text-slate-400'
          }`}
        >
          <div className="flex items-center gap-1.5 truncate">
            {hasChildren ? (
              <button
                onClick={(e) => toggleCollapse(node.id, e)}
                className="p-0.5 hover:text-cyan-300 text-slate-500"
              >
                {isCollapsed ? (
                  <ChevronRight className="w-3 h-3" />
                ) : (
                  <ChevronDown className="w-3 h-3" />
                )}
              </button>
            ) : (
              <span className="w-3" />
            )}

            <span className="font-bold truncate">{node.type}</span>
            {node.attributes?.name && (
              <span className="text-cyan-400 font-semibold truncate">
                "{node.attributes.name}"
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <span className="text-[9.5px] text-slate-500 font-sans">
              L{node.loc.start.line}
            </span>
            <span
              className={`text-[8.5px] px-1 py-0.2 rounded border uppercase font-mono ${getCategoryBadge(
                node.category
              )}`}
            >
              {node.category.slice(0, 4)}
            </span>
          </div>
        </div>

        {hasChildren && !isCollapsed && (
          <div className="border-l border-white/[0.04] ml-2.5">
            {node.children.map(child => renderTreeNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-[#0D1322] border-r border-white/[0.08] select-none">
      {/* 検索バー */}
      <div className="p-2 border-b border-white/[0.06] bg-slate-900/80 space-y-1.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <FolderTree className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-bold text-slate-100">AST 抽象構文木エクスプローラー</span>
          </div>
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-mono">
            {rootNode.type}
          </span>
        </div>

        <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-950/60 border border-white/10">
          <Search className="w-3 h-3 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ASTノードを検索..."
            className="w-full bg-transparent text-xs text-slate-200 focus:outline-none font-mono"
          />
        </div>
      </div>

      {/* 構文木ツリーエリア */}
      <div className="flex-1 overflow-y-auto p-2 space-y-0.5 border-b border-white/[0.06]">
        {renderTreeNode(rootNode)}
      </div>

      {/* 選択ノード・プロパティインスペクター */}
      <div className="h-56 bg-slate-950/80 p-2.5 overflow-y-auto space-y-2 border-t border-white/[0.08]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-300 font-mono">
            <Sliders className="w-3.5 h-3.5" />
            <span>ノード詳細: {selectedNode.type}</span>
          </div>
          <span className="text-[10px] font-mono text-slate-400">
            L{selectedNode.loc.start.line} Col {selectedNode.loc.start.column}
          </span>
        </div>

        {/* 辞書解説 */}
        {matchedDict && (
          <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-[10.5px] space-y-1">
            <div className="font-semibold text-cyan-300 flex items-center gap-1">
              <Info className="w-3 h-3" />
              <span>{matchedDict.summary}</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              {matchedDict.detailedExplanation}
            </p>
          </div>
        )}

        {/* 属性プロパティ表 */}
        <div className="space-y-1 font-mono text-[10.5px]">
          <div className="flex items-center justify-between text-slate-400 py-0.5 border-b border-white/[0.04]">
            <span className="text-slate-500">category:</span>
            <span className="text-emerald-300 font-bold">{selectedNode.category}</span>
          </div>

          {Object.entries(selectedNode.attributes).map(([key, val]) => (
            <div
              key={key}
              className="flex items-start justify-between py-0.5 border-b border-white/[0.04] gap-2"
            >
              <span className="text-slate-500 shrink-0">{key}:</span>
              <span className="text-slate-200 text-right truncate">
                {typeof val === 'object' ? JSON.stringify(val) : String(val)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
