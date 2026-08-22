import React, { useRef } from 'react';
import {
  Code2,
  FolderOpen,
  FolderTree,
  Download,
  HelpCircle,
  Sparkles,
  FileCode,
  CheckCircle2
} from 'lucide-react';
import { SupportedLanguage } from '../types';
import { sampleCodePresets } from '../core/presets/sampleCodes';

interface HeaderProps {
  fileName: string;
  language: SupportedLanguage;
  onLanguageChange: (lang: SupportedLanguage) => void;
  onLoadPreset: (presetId: string) => void;
  onFileSelect: (file: File) => void;
  onFolderSelect: (files: FileList) => void;
  onOpenExportModal: () => void;
  onOpenHelpModal: () => void;
  healthScore: number;
}

const SUPPORTED_LANGUAGES: { value: SupportedLanguage; label: string }[] = [
  { value: 'python', label: 'Python (.py)' },
  { value: 'typescript', label: 'TypeScript (.ts, .tsx)' },
  { value: 'javascript', label: 'JavaScript (.js, .jsx)' },
  { value: 'rust', label: 'Rust (.rs)' },
  { value: 'go', label: 'Go (.go)' },
  { value: 'cpp', label: 'C++ (.cpp, .h)' },
  { value: 'sql', label: 'SQL (.sql)' },
  { value: 'json', label: 'JSON (.json)' },
  { value: 'html', label: 'HTML (.html)' },
  { value: 'css', label: 'CSS (.css)' },
  { value: 'shell', label: 'Shell (.sh)' }
];

export const Header: React.FC<HeaderProps> = ({
  fileName,
  language,
  onLanguageChange,
  onLoadPreset,
  onFileSelect,
  onFolderSelect,
  onOpenExportModal,
  onOpenHelpModal,
  healthScore
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onFileSelect(files[0]);
    }
  };

  const handleFolderInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onFolderSelect(files);
    }
  };

  const getHealthBadgeColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    if (score >= 60) return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
    return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
  };

  return (
    <header className="h-[52px] px-4 flex items-center justify-between border-b border-white/[0.08] bg-[#0E1524]/90 backdrop-blur-md z-30 select-none">
      {/* 左エリア */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-emerald-500 flex items-center justify-center shadow-glow-cyan">
            <Code2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm tracking-tight text-white">CodeDictionary</span>
              <span className="text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                Studio
              </span>
            </div>
          </div>
        </div>

        <div className="h-4 w-[1px] bg-white/10 mx-1" />

        <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-white/[0.04] border border-white/[0.06]">
          <FileCode className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-xs font-mono text-slate-200 font-medium truncate max-w-[200px]" title={fileName}>
            {fileName}
          </span>
        </div>

        {/* ヘルススコアバッジ */}
        <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[11px] font-medium font-mono ${getHealthBadgeColor(healthScore)}`}>
          <CheckCircle2 className="w-3 h-3" />
          <span>Score: {healthScore}</span>
        </div>
      </div>

      {/* 右エリア */}
      <div className="flex items-center gap-2">
        {/* 言語選択 */}
        <div className="flex items-center gap-1.5 bg-slate-900/80 px-2 py-1 rounded-lg border border-white/10">
          <span className="text-[11px] text-slate-400 font-medium">言語:</span>
          <select
            value={language}
            onChange={(e) => onLanguageChange(e.target.value as SupportedLanguage)}
            className="bg-transparent text-xs font-mono text-cyan-300 focus:outline-none cursor-pointer"
          >
            {SUPPORTED_LANGUAGES.map(lang => (
              <option key={lang.value} value={lang.value} className="bg-slate-900 text-slate-200">
                {lang.label}
              </option>
            ))}
          </select>
        </div>

        {/* プリセット選択 */}
        <div className="flex items-center gap-1.5 bg-slate-900/80 px-2 py-1 rounded-lg border border-white/10">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <select
            onChange={(e) => {
              if (e.target.value) {
                onLoadPreset(e.target.value);
                e.target.value = '';
              }
            }}
            defaultValue=""
            className="bg-transparent text-xs text-slate-300 focus:outline-none cursor-pointer"
          >
            <option value="" disabled className="bg-slate-900 text-slate-400">サンプル読込...</option>
            {sampleCodePresets.map(p => (
              <option key={p.id} value={p.id} className="bg-slate-900 text-slate-200">
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* ファイルを開く */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileInputChange}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/20 transition-all shadow-sm"
          title="単一ファイルを開く"
        >
          <FolderOpen className="w-3.5 h-3.5" />
          <span>ファイル</span>
        </button>

        {/* フォルダを開く (一括解析) */}
        <input
          type="file"
          ref={folderInputRef}
          onChange={handleFolderInputChange}
          // @ts-ignore
          webkitdirectory=""
          directory=""
          multiple
          className="hidden"
        />
        <button
          onClick={() => folderInputRef.current?.click()}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/20 transition-all shadow-sm"
          title="フォルダ内の全コードを一括解析"
        >
          <FolderTree className="w-3.5 h-3.5" />
          <span>フォルダ読込</span>
        </button>

        {/* エクスポートボタン */}
        <button
          onClick={onOpenExportModal}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-violet-500/10 text-violet-300 border border-violet-500/30 hover:bg-violet-500/20 transition-all shadow-sm"
        >
          <Download className="w-3.5 h-3.5" />
          <span>出力</span>
        </button>

        {/* ヘルプボタン */}
        <button
          onClick={onOpenHelpModal}
          className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-white/[0.06] rounded-lg transition-colors"
          title="使い方とショートカット"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
