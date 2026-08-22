import React, { useState } from 'react';
import { X, Download, FileText, Code2, Image, Check, Copy } from 'lucide-react';
import { AnalysisResult, GraphLayout } from '../types';
import {
  exportAnalysisAsJson,
  exportAnalysisAsMarkdown,
  generateSvgString
} from '../core/graph/graphExporter';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  analysis: AnalysisResult;
  layout: GraphLayout;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  analysis,
  layout
}) => {
  const [copiedMd, setCopiedMd] = useState<boolean>(false);

  if (!isOpen) return null;

  const downloadFile = (content: string, fileName: string, contentType: string) => {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportSvg = () => {
    const svgStr = generateSvgString(layout, analysis);
    const base = analysis.fileName.replace(/\.[^/.]+$/, '');
    downloadFile(svgStr, `${base}_flowchart.svg`, 'image/svg+xml;charset=utf-8');
  };

  const handleExportJson = () => {
    const jsonStr = exportAnalysisAsJson(analysis);
    const base = analysis.fileName.replace(/\.[^/.]+$/, '');
    downloadFile(jsonStr, `${base}_analysis.json`, 'application/json;charset=utf-8');
  };

  const handleExportMarkdown = () => {
    const mdStr = exportAnalysisAsMarkdown(analysis);
    const base = analysis.fileName.replace(/\.[^/.]+$/, '');
    downloadFile(mdStr, `${base}_report.md`, 'text/markdown;charset=utf-8');
  };

  const handleCopyMarkdown = () => {
    const mdStr = exportAnalysisAsMarkdown(analysis);
    navigator.clipboard.writeText(mdStr);
    setCopiedMd(true);
    setTimeout(() => setCopiedMd(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm select-none">
      <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-white/10 shadow-2xl p-5 space-y-4">
        {/* モーダルヘッダー */}
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
          <div className="flex items-center gap-2">
            <Download className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-slate-100">解析データのエクスポート</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-white/[0.06]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 出力オプション一覧 */}
        <div className="grid grid-cols-1 gap-2.5">
          {/* SVG出力 */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-cyan-500/30 transition-all">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
                <Image className="w-4 h-4 text-cyan-400" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-200">SVG ベクターダイアグラム</div>
                <div className="text-[11px] text-slate-400">拡大してもボケない高解像度フローチャート画像</div>
              </div>
            </div>
            <button
              onClick={handleExportSvg}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30 transition-all"
            >
              ダウンロード
            </button>
          </div>

          {/* Markdownレポート */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-emerald-500/30 transition-all">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                <FileText className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-200">Markdown 総合レポート</div>
                <div className="text-[11px] text-slate-400">シンボル一覧・コールグラフ・改善提案を含む文書</div>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleCopyMarkdown}
                className="p-1.5 text-xs font-medium rounded-lg bg-white/[0.05] text-slate-300 hover:bg-white/[0.1] border border-white/10 transition-all"
                title="クリップボードにコピー"
              >
                {copiedMd ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={handleExportMarkdown}
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 transition-all"
              >
                保存
              </button>
            </div>
          </div>

          {/* JSON構造化データ */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-violet-500/30 transition-all">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-violet-500/10 border border-violet-500/30 flex items-center justify-center">
                <Code2 className="w-4 h-4 text-violet-400" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-200">JSON 構造化解析データ</div>
                <div className="text-[11px] text-slate-400">AST・メトリクス・辞書照合結果の完全な生データ</div>
              </div>
            </div>
            <button
              onClick={handleExportJson}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-violet-500/20 text-violet-300 border border-violet-500/40 hover:bg-violet-500/30 transition-all"
            >
              ダウンロード
            </button>
          </div>
        </div>

        {/* 閉じるボタン */}
        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium rounded-lg bg-white/[0.06] text-slate-300 hover:bg-white/[0.1] transition-all"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};
