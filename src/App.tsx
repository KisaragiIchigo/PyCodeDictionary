import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Code,
  Layers,
  BookOpen,
  ShieldCheck,
  SplitSquareHorizontal,
  SplitSquareVertical,
  Maximize2,
  FileCode,
  UploadCloud,
  FolderTree,
  Sparkles,
  Layout,
  Compass,
  Columns,
  GripVertical,
  GripHorizontal
} from 'lucide-react';
import { SupportedLanguage, AnalysisResult, ProjectAnalysisResult, ProjectFileEntry } from './types';
import { runFullAnalysis } from './core/analyzer';
import { analyzeProject, isCodeFile, isIgnoredPath } from './core/multiFile/projectScanner';
import { sampleCodePresets } from './core/presets/sampleCodes';
import { computeGraphLayout } from './core/graph/layoutEngine';

import { Header } from './components/Header';
import { CodeViewer } from './components/CodeViewer';
import { FlowchartView } from './components/FlowchartView';
import { SymbolTree } from './components/SymbolTree';
import { DictionaryPanel } from './components/DictionaryPanel';
import { QualityPanel } from './components/QualityPanel';
import { ArchitecturePanel } from './components/ArchitecturePanel';
import { ProjectExplorer } from './components/ProjectExplorer';
import { ProjectMapView } from './components/ProjectMapView';
import { ExportModal } from './components/ExportModal';
import { HelpModal } from './components/HelpModal';

export const App: React.FC = () => {
  const defaultPreset = sampleCodePresets[0];

  const [fileName, setFileName] = useState<string>(defaultPreset.fileName);
  const [filePath, setFilePath] = useState<string>(defaultPreset.fileName);
  const [language, setLanguage] = useState<SupportedLanguage>(defaultPreset.language);
  const [code, setCode] = useState<string>(defaultPreset.code);
  const [targetLine, setTargetLine] = useState<number | null>(null);

  // 1. サイドバー幅（ドラッグリサイズ用）
  const [sidebarWidth, setSidebarWidth] = useState<number>(320);
  const isResizingSidebarRef = useRef<boolean>(false);

  // 2. エディタ vs MAP の分割比率 (0.2 ~ 0.8、デフォルト 0.5 = 50%)
  const [splitRatio, setSplitRatio] = useState<number>(0.5);
  const isResizingMainSplitRef = useRef<boolean>(false);
  const mainWorkspaceRef = useRef<HTMLDivElement>(null);

  // プロジェクト全体状態
  const [projectData, setProjectData] = useState<ProjectAnalysisResult | null>(() => {
    return analyzeProject('Sample Project', [
      { path: defaultPreset.fileName, name: defaultPreset.fileName, content: defaultPreset.code },
      { path: sampleCodePresets[1].fileName, name: sampleCodePresets[1].fileName, content: sampleCodePresets[1].code },
      { path: sampleCodePresets[2].fileName, name: sampleCodePresets[2].fileName, content: sampleCodePresets[2].code },
      { path: sampleCodePresets[3].fileName, name: sampleCodePresets[3].fileName, content: sampleCodePresets[3].code }
    ]);
  });

  const [isProjectMode, setIsProjectMode] = useState<boolean>(false);

  // サイドバータブ ('project' | 'architecture' | 'symbols' | 'dict' | 'quality')
  const [sidebarTab, setSidebarTab] = useState<'project' | 'architecture' | 'symbols' | 'dict' | 'quality'>('dict');

  // 表示モード ('split' | 'code-only' | 'map-only')
  const [viewLayout, setViewLayout] = useState<'split' | 'code-only' | 'map-only'>('split');
  const [splitOrientation, setSplitOrientation] = useState<'horizontal' | 'vertical'>('horizontal');

  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);

  const [analysis, setAnalysis] = useState<AnalysisResult>(() =>
    runFullAnalysis(defaultPreset.code, defaultPreset.fileName, defaultPreset.language)
  );

  const executeAnalysis = useCallback((sourceCode: string, name: string, lang?: SupportedLanguage) => {
    const res = runFullAnalysis(sourceCode, name, lang);
    setAnalysis(res);
    setLanguage(res.language);
  }, []);

  const handleLoadPreset = (presetId: string) => {
    const preset = sampleCodePresets.find(p => p.id === presetId);
    if (preset) {
      setFileName(preset.fileName);
      setFilePath(preset.fileName);
      setLanguage(preset.language);
      setCode(preset.code);
      setTargetLine(null);
      setIsProjectMode(false);
      executeAnalysis(preset.code, preset.fileName, preset.language);
    }
  };

  const handleLanguageChange = (newLang: SupportedLanguage) => {
    setLanguage(newLang);
    executeAnalysis(code, fileName, newLang);
  };

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (text !== undefined) {
        setFileName(file.name);
        setFilePath(file.name);
        setCode(text);
        setTargetLine(null);
        setIsProjectMode(false);
        executeAnalysis(text, file.name);
      }
    };
    reader.readAsText(file);
  };

  // フォルダ一括読込ハンドラ
  const handleFolderSelect = async (files: FileList) => {
    const rawFiles: { path: string; name: string; content: string }[] = [];
    const readPromises: Promise<void>[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const relPath = file.webkitRelativePath || file.name;

      if (isCodeFile(file.name) && !isIgnoredPath(relPath)) {
        const p = new Promise<void>((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            const content = e.target?.result as string;
            if (content !== undefined) {
              rawFiles.push({
                path: relPath,
                name: file.name,
                content
              });
            }
            resolve();
          };
          reader.readAsText(file);
        });
        readPromises.push(p);
      }
    }

    await Promise.all(readPromises);

    if (rawFiles.length > 0) {
      const folderName = rawFiles[0].path.split(/[/\\]/)[0] || 'Project';
      const projResult = analyzeProject(folderName, rawFiles);
      setProjectData(projResult);
      setIsProjectMode(true);

      const firstFile = projResult.files[0];
      setFileName(firstFile.name);
      setFilePath(firstFile.path);
      setLanguage(firstFile.language);
      setCode(firstFile.code);
      setAnalysis(firstFile.analysis);
      setSidebarTab('project');
    }
  };

  const handleSelectProjectFile = (file: ProjectFileEntry) => {
    setFileName(file.name);
    setFilePath(file.path);
    setLanguage(file.language);
    setCode(file.code);
    setTargetLine(null);
    setAnalysis(file.analysis);
    setIsProjectMode(false);
  };

  const handleSelectLine = (line: number) => {
    setTargetLine(line);
  };

  const handleSelectSymbol = (symbolName: string) => {
    const sym = analysis.symbols.find(s => s.name === symbolName);
    if (sym) {
      setTargetLine(sym.startLine);
    }
  };

  // --- サイドバー ドラッグリサイズ ---
  const handleMouseDownSidebarResize = (e: React.MouseEvent) => {
    e.preventDefault();
    isResizingSidebarRef.current = true;
    document.addEventListener('mousemove', handleMouseMoveSidebarResize);
    document.addEventListener('mouseup', handleMouseUpSidebarResize);
  };

  const handleMouseMoveSidebarResize = (e: MouseEvent) => {
    if (!isResizingSidebarRef.current) return;
    const newWidth = Math.min(650, Math.max(220, e.clientX));
    setSidebarWidth(newWidth);
  };

  const handleMouseUpSidebarResize = () => {
    isResizingSidebarRef.current = false;
    document.removeEventListener('mousemove', handleMouseMoveSidebarResize);
    document.removeEventListener('mouseup', handleMouseUpSidebarResize);
  };

  // --- エディタ vs MAP ドラッグリサイズ ---
  const handleMouseDownMainSplitResize = (e: React.MouseEvent) => {
    e.preventDefault();
    isResizingMainSplitRef.current = true;
    document.addEventListener('mousemove', handleMouseMoveMainSplitResize);
    document.addEventListener('mouseup', handleMouseUpMainSplitResize);
  };

  const handleMouseMoveMainSplitResize = (e: MouseEvent) => {
    if (!isResizingMainSplitRef.current || !mainWorkspaceRef.current) return;
    const rect = mainWorkspaceRef.current.getBoundingClientRect();

    if (splitOrientation === 'horizontal') {
      const offsetX = e.clientX - rect.left;
      const ratio = offsetX / rect.width;
      setSplitRatio(Math.min(0.85, Math.max(0.15, ratio)));
    } else {
      const offsetY = e.clientY - rect.top;
      const ratio = offsetY / rect.height;
      setSplitRatio(Math.min(0.85, Math.max(0.15, ratio)));
    }
  };

  const handleMouseUpMainSplitResize = () => {
    isResizingMainSplitRef.current = false;
    document.removeEventListener('mousemove', handleMouseMoveMainSplitResize);
    document.removeEventListener('mouseup', handleMouseUpMainSplitResize);
  };

  // 全体ドラッグ＆ドロップ
  const handleGlobalDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleGlobalDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleGlobalDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      if (files.length > 1) {
        handleFolderSelect(files);
      } else {
        handleFile(files[0]);
      }
    }
  };

  const graphLayout = useMemo(() => {
    return computeGraphLayout(analysis.symbols, analysis.callEdges);
  }, [analysis.symbols, analysis.callEdges]);

  // 辞書からエディタへのコード挿入ハンドラ
  const handleInsertCode = (insertSnippet: string) => {
    const updatedCode = code.trim() ? `${code}\n\n# --- 辞書から挿入されたコード ---\n${insertSnippet}\n` : insertSnippet;
    setCode(updatedCode);
    executeAnalysis(updatedCode, fileName, language);
  };

  return (
    <div
      onDragOver={handleGlobalDragOver}
      onDragLeave={handleGlobalDragLeave}
      onDrop={handleGlobalDrop}
      className="flex flex-col h-screen w-screen bg-[#0B0F19] text-[#F1F5F9] overflow-hidden select-none"
    >
      {/* ドラッグ＆ドロップオーバーレイ */}
      {isDragOver && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/85 backdrop-blur-md border-2 border-dashed border-cyan-400 m-4 rounded-2xl pointer-events-none">
          <UploadCloud className="w-16 h-16 text-cyan-400 animate-bounce mb-3" />
          <p className="text-base font-bold text-slate-100">コードファイルまたはフォルダをドロップ</p>
          <p className="text-xs text-slate-400 mt-1">フォルダ内の全コードを一括検知してマップ＆辞書化します</p>
        </div>
      )}

      {/* ヘッダー */}
      <Header
        fileName={isProjectMode ? `[全体MAP] ${projectData?.projectName}` : fileName}
        language={language}
        onLanguageChange={handleLanguageChange}
        onLoadPreset={handleLoadPreset}
        onFileSelect={handleFile}
        onFolderSelect={handleFolderSelect}
        onOpenExportModal={() => setIsExportOpen(true)}
        onOpenHelpModal={() => setIsHelpOpen(true)}
        healthScore={isProjectMode ? (projectData?.totalMetrics.healthScore || 100) : analysis.metrics.healthScore}
      />

      {/* メインワークスペース */}
      <div className="flex-1 flex overflow-hidden">
        {/* 左サイドバー */}
        <div
          style={{ width: `${sidebarWidth}px` }}
          className="flex flex-col border-r border-white/[0.08] bg-[#0D1322] shrink-0 relative"
        >
          {/* サイドバータブセレクタ */}
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
                onSelectFile={handleSelectProjectFile}
                onSelectAllProject={() => setIsProjectMode(true)}
                isProjectMode={isProjectMode}
              />
            )}
            {sidebarTab === 'dict' && (
              <DictionaryPanel
                matchedEntries={analysis.matchedDictEntries}
                language={language}
                masterProjectDictionary={projectData?.masterDictionary}
                isProjectMode={isProjectMode}
                onSelectLine={handleSelectLine}
                onInsertCode={handleInsertCode}
              />
            )}
            {sidebarTab === 'architecture' && (
              <ArchitecturePanel
                diagnoses={analysis.architectureDiagnoses}
                blueprints={analysis.blueprints}
                onSelectSymbol={handleSelectSymbol}
              />
            )}
            {sidebarTab === 'symbols' && (
              <SymbolTree
                symbols={analysis.symbols}
                callEdges={analysis.callEdges}
                onSelectLine={handleSelectLine}
              />
            )}
            {sidebarTab === 'quality' && (
              <QualityPanel
                metrics={analysis.metrics}
                refactorSuggestions={analysis.refactorSuggestions}
                onSelectLine={handleSelectLine}
              />
            )}
          </div>

          {/* サイドバー リサイズハンドル */}
          <div
            onMouseDown={handleMouseDownSidebarResize}
            onDoubleClick={() => setSidebarWidth(320)}
            className="absolute top-0 -right-1 w-2.5 h-full cursor-col-resize hover:bg-cyan-500/50 transition-colors z-20 group flex items-center justify-center"
            title="ドラッグでサイドバー幅を変更（ダブルクリックでリセット）"
          >
            <div className="w-[1px] h-8 bg-white/20 group-hover:bg-cyan-300" />
          </div>
        </div>

        {/* 右メイン領域 */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          {/* プロジェクト全体マップモード時 */}
          {isProjectMode && projectData ? (
            <ProjectMapView
              project={projectData}
              onSelectFile={handleSelectProjectFile}
            />
          ) : (
            <>
              {/* レイアウト切り替えバー */}
              <div className="h-8 px-3 flex items-center justify-between border-b border-white/[0.06] bg-[#0E1524]/60 text-xs">
                <div className="flex items-center gap-2 text-slate-400 font-mono text-[11px]">
                  <span>司令塔: {analysis.metrics.orchestratorCount || 0}</span>
                  <span>•</span>
                  <span>Pure計算: {analysis.metrics.pureLogicCount || 0}</span>
                  <span>•</span>
                  <span>I/O通信: {analysis.metrics.ioEffectCount || 0}</span>
                  <span>•</span>
                  <span className={analysis.metrics.mixedCount ? 'text-amber-400' : 'text-slate-400'}>
                    要分割: {analysis.metrics.mixedCount || 0}
                  </span>
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

              {/* ビューポート分割表示（ドラッグリサイズ対応） */}
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
                      onCodeChange={(newCode) => setCode(newCode)}
                      onReanalyze={() => executeAnalysis(code, fileName, language)}
                      onSelectLine={handleSelectLine}
                    />
                  </div>
                )}

                {/* スプリッター（ドラッグリサイズ境界線） */}
                {viewLayout === 'split' && (
                  <div
                    onMouseDown={handleMouseDownMainSplitResize}
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

                {/* フローチャート（MAP）領域 */}
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
                      targetLine={targetLine}
                      onSelectLine={handleSelectLine}
                    />
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* エクスポートモーダル */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        analysis={analysis}
        layout={graphLayout}
      />

      {/* ヘルプモーダル */}
      <HelpModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
      />
    </div>
  );
};
export default App;
