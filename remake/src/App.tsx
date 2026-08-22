import React, { useState, useMemo } from 'react';
import { UploadCloud } from 'lucide-react';
import { computeGraphLayout } from './core/graph/layoutEngine';
import { useProjectState } from './hooks/useProjectState';
import { useLayoutState } from './hooks/useLayoutState';

import { Header } from './components/Header';
import { WorkspaceLayout } from './components/layout/WorkspaceLayout';
import { ExportModal } from './components/ExportModal';
import { HelpModal } from './components/HelpModal';

export const App: React.FC = () => {
  // 1. プロジェクト & 解析ステートフック
  const project = useProjectState();

  // 2. レイアウト & スプリッターステートフック
  const layout = useLayoutState();

  // 3. モーダル & UIステート
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  // 4. ドラッグ＆ドロップハンドラ
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
        project.handleFolderSelect(files);
      } else {
        project.handleFile(files[0]);
      }
    }
  };

  const graphLayout = useMemo(() => {
    return computeGraphLayout(project.analysis.symbols, project.analysis.callEdges);
  }, [project.analysis.symbols, project.analysis.callEdges]);

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

      {/* ヘッダーオーケストレーション */}
      <Header
        fileName={project.isProjectMode ? `[全体MAP] ${project.projectData?.projectName}` : project.fileName}
        language={project.language}
        onLanguageChange={project.handleLanguageChange}
        onLoadPreset={project.handleLoadPreset}
        onFileSelect={project.handleFile}
        onFolderSelect={project.handleFolderSelect}
        onOpenExportModal={() => setIsExportOpen(true)}
        onOpenHelpModal={() => setIsHelpOpen(true)}
        healthScore={project.isProjectMode ? (project.projectData?.totalMetrics.healthScore || 100) : project.analysis.metrics.healthScore}
      />

      {/* ワークスペースオーケストレーション */}
      <WorkspaceLayout
        analysis={project.analysis}
        projectData={project.projectData}
        isProjectMode={project.isProjectMode}
        setIsProjectMode={project.setIsProjectMode}
        fileName={project.fileName}
        filePath={project.filePath}
        language={project.language}
        code={project.code}
        setCode={project.setCode}
        targetLine={project.targetLine}
        setTargetLine={project.setTargetLine}
        isSimulating={isSimulating}
        setIsSimulating={setIsSimulating}
        sidebarWidth={layout.sidebarWidth}
        setSidebarWidth={layout.setSidebarWidth}
        splitRatio={layout.splitRatio}
        setSplitRatio={layout.setSplitRatio}
        sidebarTab={layout.sidebarTab}
        setSidebarTab={layout.setSidebarTab}
        viewLayout={layout.viewLayout}
        setViewLayout={layout.setViewLayout}
        splitOrientation={layout.splitOrientation}
        setSplitOrientation={layout.setSplitOrientation}
        mainWorkspaceRef={layout.mainWorkspaceRef}
        onSelectProjectFile={project.handleSelectProjectFile}
        onSelectLine={(line) => project.setTargetLine(line)}
        onSelectSymbol={(symName) => {
          const sym = project.analysis.symbols.find(s => s.name === symName);
          if (sym) project.setTargetLine(sym.startLine);
        }}
        onApplyRefactor={project.handleApplyRefactor}
        onReanalyze={() => project.executeAnalysis(project.code, project.fileName, project.language)}
        onMouseDownSidebarResize={layout.handleMouseDownSidebarResize}
        onMouseDownMainSplitResize={layout.handleMouseDownMainSplitResize}
      />

      {/* モーダル */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        analysis={project.analysis}
        layout={graphLayout}
      />

      <HelpModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
      />
    </div>
  );
};
export default App;
