import React from 'react';
import {
  Code,
  FolderTree,
  GitFork,
  BookOpen,
  Sparkles,
  ShieldCheck,
  SplitSquareHorizontal,
  SplitSquareVertical,
  GripVertical,
  GripHorizontal,
  Play,
  Square
} from 'lucide-react';
import { AnalysisResult, ProjectAnalysisResult, ProjectFileEntry, SupportedLanguage } from '../../types';

import { CodeViewer } from '../CodeViewer';
import { FlowchartView } from '../FlowchartView';
import { SymbolTree } from '../SymbolTree';
import { ASTExplorer } from '../ASTExplorer';
import { DictionaryPanel } from '../DictionaryPanel';
import { QualityPanel } from '../QualityPanel';
import { ArchitecturePanel } from '../ArchitecturePanel';
import { ProjectExplorer } from '../ProjectExplorer';
import { ProjectMapView } from '../ProjectMapView';

interface WorkspaceLayoutProps {
  // 状態 & フック
  analysis: AnalysisResult;
  projectData: ProjectAnalysisResult | null;
  isProjectMode: boolean;
  setIsProjectMode: (mode: boolean) => void;
  fileName: string;
  filePath: string;
  language: SupportedLanguage;
  code: string;
  setCode: (code: string) => void;
  targetLine: number | null;
  setTargetLine: (line: number | null) => void;
  isSimulating: boolean;
  setIsSimulating: (sim: boolean) => void;

  // レイアウト
  sidebarWidth: number;
  setSidebarWidth: (w: number) => void;
  splitRatio: number;
  setSplitRatio: (r: number) => void;
  sidebarTab: 'project' | 'ast' | 'dict' | 'architecture' | 'symbols' | 'quality';
  setSidebarTab: (tab: 'project' | 'ast' | 'dict' | 'architecture' | 'symbols' | 'quality') => void;
  viewLayout: 'split' | 'code-only' | 'map-only';
  setViewLayout: (v: 'split' | 'code-only' | 'map-only') => void;
  splitOrientation: 'horizontal' | 'vertical';
  setSplitOrientation: (o: 'horizontal' | 'vertical') => void;
  mainWorkspaceRef: React.RefObject<HTMLDivElement>;

  // ハンドラ
  onSelectProjectFile: (file: ProjectFileEntry) => void;
  onSelectLine: (line: number) => void;
  onSelectSymbol: (symbolName: string) => void;
  onApplyRefactor: (newCodeOrBefore?: string, codeAfter?: string) => void;
  onReanalyze: () => void;
  onMouseDownSidebarResize: (e: React.MouseEvent) => void;
  onMouseDownMainSplitResize: (e: React.MouseEvent) => void;
}

export const WorkspaceLayout: React.FC<WorkspaceLayoutProps> = (props) => {
  const {
    analysis,
    projectData,
    isProjectMode,
    setIsProjectMode,
    fileName,
    filePath,
    language,
    code,
    setCode,
    targetLine,
    isSimulating,
    setIsSimulating,
    sidebarWidth,
    setSidebarWidth,
    splitRatio,
    setSplitRatio,
    sidebarTab,
    setSidebarTab,
    viewLayout,
    setViewLayout,
    splitOrientation,
    setSplitOrientation,
    mainWorkspaceRef,
    onSelectProjectFile,
    onSelectLine,
    onSelectSymbol,
    onApplyRefactor,
    onReanalyze,
    onMouseDownSidebarResize,
    onMouseDownMainSplitResize
  } = props;

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* 左サイドバー */}
      <div
        style={{ width: `${sidebarWidth}px` }}
        className="flex flex-col border-r border-white/[0.08] bg-[#0D1322] shrink-0 relative"
      >
        {/* タブセレクタ */}
        <div className="h-10 px-1.5 flex items-center border-b border-white/[0.06] bg-slate-900/80 gap-1 overflow-x-auto">
          {projectData && (
            <button
              onClick={() => setSidebarTab('project')}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all shrink-0 ${
                sidebarTab === 'project'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FolderTree className="w-3.5 h-3.5" />
              <span>フォルダ</span>
            </button>
          )}

          <button
            onClick={() => setSidebarTab('ast')}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all shrink-0 ${
              sidebarTab === 'ast'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <GitFork className="w-3.5 h-3.5 text-cyan-400" />
            <span>AST構文木</span>
          </button>

          <button
            onClick={() => setSidebarTab('dict')}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all shrink-0 ${
              sidebarTab === 'dict'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>コード辞書</span>
          </button>

          <button
            onClick={() => setSidebarTab('architecture')}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all shrink-0 ${
              sidebarTab === 'architecture'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>設計 & 責務</span>
          </button>

          <button
            onClick={() => setSidebarTab('symbols')}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all shrink-0 ${
              sidebarTab === 'symbols'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>ツリー</span>
          </button>

          <button
            onClick={() => setSidebarTab('quality')}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all shrink-0 ${
              sidebarTab === 'quality'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>品質</span>
          </button>
        </div>

        {/* サイドバーコンテンツ */}
        <div className="flex-1 overflow-hidden">
          {sidebarTab === 'project' && projectData && (
            <ProjectExplorer
              project={projectData}
              selectedFilePath={filePath}
              onSelectFile={onSelectProjectFile}
              onSelectAllProject={() => setIsProjectMode(true)}
              isProjectMode={isProjectMode}
            />
          )}
          {sidebarTab === 'ast' && (
            <ASTExplorer rootNode={analysis.astRoot} onSelectLine={onSelectLine} />
          )}
          {sidebarTab === 'dict' && (
            <DictionaryPanel
              matchedEntries={analysis.matchedDictEntries}
              language={language}
              masterProjectDictionary={projectData?.masterDictionary}
              isProjectMode={isProjectMode}
              onSelectLine={onSelectLine}
            />
          )}
          {sidebarTab === 'architecture' && (
            <ArchitecturePanel
              diagnoses={analysis.architectureDiagnoses}
              blueprints={analysis.blueprints}
              onSelectSymbol={onSelectSymbol}
              onApplyRefactor={onApplyRefactor}
            />
          )}
          {sidebarTab === 'symbols' && (
            <SymbolTree
              symbols={analysis.symbols}
              callEdges={analysis.callEdges}
              onSelectLine={onSelectLine}
            />
          )}
          {sidebarTab === 'quality' && (
            <QualityPanel
              metrics={analysis.metrics}
              refactorSuggestions={analysis.refactorSuggestions}
              onSelectLine={onSelectLine}
              onApplyRefactor={onApplyRefactor}
            />
          )}
        </div>

        {/* サイドバー リサイズハンドル */}
        <div
          onMouseDown={onMouseDownSidebarResize}
          onDoubleClick={() => setSidebarWidth(320)}
          className="absolute top-0 -right-1 w-2.5 h-full cursor-col-resize hover:bg-cyan-500/50 transition-colors z-20 group flex items-center justify-center"
          title="ドラッグでサイドバー幅を変更（ダブルクリックでリセット）"
        >
          <div className="w-[1px] h-8 bg-white/20 group-hover:bg-cyan-300" />
        </div>
      </div>

      {/* 右メイン領域 */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {isProjectMode && projectData ? (
          <ProjectMapView project={projectData} onSelectFile={onSelectProjectFile} />
        ) : (
          <>
            {/* レイアウト切り替えバー */}
            <div className="h-9 px-3 flex items-center justify-between border-b border-white/[0.06] bg-[#0E1524]/80 text-xs select-none">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsSimulating(!isSimulating)}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold font-mono transition-all shadow-md ${
                    isSimulating
                      ? 'bg-rose-500 text-white shadow-glow-rose animate-pulse'
                      : 'bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 hover:opacity-90 shadow-glow-cyan'
                  }`}
                >
                  {isSimulating ? <Square className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                  <span>{isSimulating ? 'シミュレーション停止' : '▶ 実行シミュレーション'}</span>
                </button>

                <div className="h-4 w-[1px] bg-white/10" />

                <div className="flex items-center gap-2 text-slate-400 font-mono text-[11px]">
                  <span>AST: {analysis.astRoot.type}</span>
                  <span>•</span>
                  <span>司令塔: {analysis.metrics.orchestratorCount || 0}</span>
                  <span>•</span>
                  <span>Pure計算: {analysis.metrics.pureLogicCount || 0}</span>
                  <span>•</span>
                  <span className={analysis.metrics.mixedCount ? 'text-amber-400' : 'text-slate-400'}>
                    要分割: {analysis.metrics.mixedCount || 0}
                  </span>
                </div>
              </div>

              {/* 比率クイックプリセット & ビュー切り替え */}
              <div className="flex items-center gap-1">
                {viewLayout === 'split' && (
                  <div className="flex items-center gap-0.5 bg-slate-950/60 p-0.5 rounded-lg border border-white/10 text-[10px] font-mono mr-1">
                    <button
                      onClick={() => setSplitRatio(0.3)}
                      className={`px-1.5 py-0.2 rounded transition-colors ${
                        splitRatio <= 0.35 ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-400 hover:text-white'
                      }`}
                      title="エディタ 30% : MAP 70%"
                    >
                      3:7
                    </button>
                    <button
                      onClick={() => setSplitRatio(0.5)}
                      className={`px-1.5 py-0.2 rounded transition-colors ${
                        splitRatio > 0.35 && splitRatio < 0.65 ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-400 hover:text-white'
                      }`}
                      title="エディタ 50% : MAP 50%"
                    >
                      5:5
                    </button>
                    <button
                      onClick={() => setSplitRatio(0.7)}
                      className={`px-1.5 py-0.2 rounded transition-colors ${
                        splitRatio >= 0.65 ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-400 hover:text-white'
                      }`}
                      title="エディタ 70% : MAP 30%"
                    >
                      7:3
                    </button>
                  </div>
                )}

                <button
                  onClick={() => setViewLayout('split')}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                    viewLayout === 'split' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  分割ビュー
                </button>
                <button
                  onClick={() => setViewLayout('code-only')}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                    viewLayout === 'code-only' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  コードのみ
                </button>
                <button
                  onClick={() => setViewLayout('map-only')}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                    viewLayout === 'map-only' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  MAPのみ
                </button>

                <div className="w-[1px] h-3.5 bg-white/10 mx-1" />

                {viewLayout === 'split' && (
                  <>
                    <button
                      onClick={() => setSplitOrientation('horizontal')}
                      className={`p-1 rounded transition-colors ${
                        splitOrientation === 'horizontal' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-500 hover:text-slate-300'
                      }`}
                      title="左右分割"
                    >
                      <SplitSquareHorizontal className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setSplitOrientation('vertical')}
                      className={`p-1 rounded transition-colors ${
                        splitOrientation === 'vertical' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-500 hover:text-slate-300'
                      }`}
                      title="上下分割"
                    >
                      <SplitSquareVertical className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* ビューポート分割表示 */}
            <div
              ref={mainWorkspaceRef}
              className={`flex-1 flex overflow-hidden relative ${
                splitOrientation === 'vertical' && viewLayout === 'split' ? 'flex-col' : 'flex-row'
              }`}
            >
              {/* エディタ領域 */}
              {(viewLayout === 'split' || viewLayout === 'code-only') && (
                <div
                  style={
                    viewLayout === 'split'
                      ? splitOrientation === 'horizontal'
                        ? { width: `${splitRatio * 100}%` }
                        : { height: `${splitRatio * 100}%` }
                      : { flex: 1 }
                  }
                  className="overflow-hidden relative"
                >
                  <CodeViewer
                    code={code}
                    language={language}
                    symbols={analysis.symbols}
                    masterProjectDictionary={projectData?.masterDictionary}
                    targetLine={targetLine}
                    onCodeChange={setCode}
                    onReanalyze={onReanalyze}
                    onSelectLine={onSelectLine}
                  />
                </div>
              )}

              {/* スプリッター */}
              {viewLayout === 'split' && (
                <div
                  onMouseDown={onMouseDownMainSplitResize}
                  onDoubleClick={() => setSplitRatio(0.5)}
                  className={`relative z-20 group flex items-center justify-center transition-colors ${
                    splitOrientation === 'horizontal'
                      ? 'w-2 cursor-col-resize bg-white/[0.04] hover:bg-cyan-500/40'
                      : 'h-2 cursor-row-resize bg-white/[0.04] hover:bg-cyan-500/40'
                  }`}
                  title="ドラッグでエディタ/MAPのサイズを変更（ダブルクリックで5:5リセット）"
                >
                  {splitOrientation === 'horizontal' ? (
                    <GripVertical className="w-3 h-3 text-slate-600 group-hover:text-cyan-300" />
                  ) : (
                    <GripHorizontal className="w-3 h-3 text-slate-600 group-hover:text-cyan-300" />
                  )}
                </div>
              )}

              {/* フローチャート領域 */}
              {(viewLayout === 'split' || viewLayout === 'map-only') && (
                <div
                  style={
                    viewLayout === 'split'
                      ? splitOrientation === 'horizontal'
                        ? { width: `${(1 - splitRatio) * 100}%` }
                        : { height: `${(1 - splitRatio) * 100}%` }
                      : { flex: 1 }
                  }
                  className="overflow-hidden relative"
                >
                  <FlowchartView
                    symbols={analysis.symbols}
                    callEdges={analysis.callEdges}
                    onSelectLine={onSelectLine}
                    externalSimulating={isSimulating}
                    onToggleSimulate={() => setIsSimulating(!isSimulating)}
                  />
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
