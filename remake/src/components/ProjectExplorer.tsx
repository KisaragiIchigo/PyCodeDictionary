import React from 'react';
import {
  FolderTree,
  FileCode,
  Layers,
  Activity,
  ShieldCheck,
  Code2,
  ChevronRight
} from 'lucide-react';
import { ProjectAnalysisResult, ProjectFileEntry } from '../types';

interface ProjectExplorerProps {
  project: ProjectAnalysisResult;
  selectedFilePath: string | null;
  onSelectFile: (file: ProjectFileEntry) => void;
  onSelectAllProject: () => void;
  isProjectMode: boolean;
}

export const ProjectExplorer: React.FC<ProjectExplorerProps> = ({
  project,
  selectedFilePath,
  onSelectFile,
  onSelectAllProject,
  isProjectMode
}) => {
  return (
    <div className="flex flex-col h-full bg-[#0D1322] border-r border-white/[0.08] p-2 space-y-3 select-none overflow-y-auto">
      {/* プロジェクト全体マップボタン */}
      <button
        onClick={onSelectAllProject}
        className={`w-full p-2.5 rounded-xl border flex items-center justify-between transition-all ${
          isProjectMode
            ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300 shadow-sm'
            : 'bg-white/[0.02] border-white/[0.06] text-slate-300 hover:bg-white/[0.04]'
        }`}
      >
        <div className="flex items-center gap-2">
          <FolderTree className="w-4 h-4 text-cyan-400" />
          <div className="text-left">
            <div className="text-xs font-bold font-mono truncate">{project.projectName}</div>
            <div className="text-[10px] text-slate-400">全体依存MAP & マスター辞書</div>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-slate-500" />
      </button>

      {/* プロジェクト統計 */}
      <div className="p-2.5 rounded-xl bg-slate-950/60 border border-white/[0.04] grid grid-cols-2 gap-2 text-[10px] font-mono">
        <div>
          <div className="text-slate-500">ファイル数</div>
          <div className="text-sm font-bold text-slate-200">{project.totalMetrics.fileCount} 件</div>
        </div>
        <div>
          <div className="text-slate-500">総コード行</div>
          <div className="text-sm font-bold text-cyan-300">{project.totalMetrics.codeLines} 行</div>
        </div>
        <div>
          <div className="text-slate-500">総定義シンボル</div>
          <div className="text-sm font-bold text-emerald-300">{project.totalMetrics.symbolCount} 個</div>
        </div>
        <div>
          <div className="text-slate-500">平均ヘルス</div>
          <div className="text-sm font-bold text-amber-300">{project.totalMetrics.healthScore} / 100</div>
        </div>
      </div>

      {/* ファイル一覧 */}
      <div className="space-y-1">
        <div className="text-[10px] font-mono font-semibold text-slate-400 px-1 uppercase tracking-wider">
          ファイル一覧 ({project.files.length})
        </div>

        {project.files.map(f => {
          const isSelected = !isProjectMode && selectedFilePath === f.path;

          return (
            <div
              key={f.path}
              onClick={() => onSelectFile(f)}
              className={`p-2 rounded-lg border transition-all cursor-pointer flex items-center justify-between text-xs font-mono ${
                isSelected
                  ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300 shadow-sm'
                  : 'bg-white/[0.01] border-white/[0.04] text-slate-300 hover:bg-white/[0.04]'
              }`}
            >
              <div className="flex items-center gap-1.5 truncate">
                <FileCode className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span className="truncate">{f.name}</span>
              </div>
              <span className="text-[10px] text-slate-500 shrink-0 font-sans">
                {f.analysis.metrics.totalLines}行
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
