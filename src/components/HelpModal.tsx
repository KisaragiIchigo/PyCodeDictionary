import React from 'react';
import { X, HelpCircle, Command, Layers, Sparkles, BookOpen, GitFork } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm select-none">
      <div className="w-full max-w-xl max-h-[85vh] rounded-2xl bg-slate-900 border border-white/10 shadow-2xl p-6 flex flex-col space-y-4 overflow-hidden">
        {/* モーダルヘッダー */}
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] shrink-0">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-slate-100">CodeDictionary Studio の使い方</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-white/[0.06]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* コンテンツ */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs text-slate-300 select-text">
          {/* 概要 */}
          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-1.5">
            <div className="font-bold text-slate-200 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>ツール概要</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              Python・TypeScript・Rust・Go・C++等のソースコードを読み込み、関数/クラスの定義位置、
              関数呼び出し関係（Call Graph）、コード品質メトリクス、言語別インテリジェント辞書をまとめて解析・可視化する総合コードスタジオです。
              外部のGraphviz等のインストールは一切不要で、ブラウザ内で完結して高速動作します。
            </p>
          </div>

          {/* ショートカットキー */}
          <div className="space-y-2">
            <div className="font-bold text-slate-200 flex items-center gap-1.5">
              <Command className="w-3.5 h-3.5 text-emerald-400" />
              <span>主なショートカットキー & 操作</span>
            </div>
            <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
              <div className="p-2 rounded-lg bg-slate-950/60 border border-white/[0.04] flex items-center justify-between">
                <span className="text-slate-400 font-sans">コード内検索</span>
                <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-cyan-300">Ctrl + F</kbd>
              </div>
              <div className="p-2 rounded-lg bg-slate-950/60 border border-white/[0.04] flex items-center justify-between">
                <span className="text-slate-400 font-sans">検索ヒット次へ</span>
                <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-cyan-300">Enter</kbd>
              </div>
              <div className="p-2 rounded-lg bg-slate-950/60 border border-white/[0.04] flex items-center justify-between">
                <span className="text-slate-400 font-sans">グラフのパン</span>
                <span className="text-slate-300 font-sans">ドラッグ移動</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-950/60 border border-white/[0.04] flex items-center justify-between">
                <span className="text-slate-400 font-sans">グラフのズーム</span>
                <span className="text-slate-300 font-sans">マウスホイール</span>
              </div>
            </div>
          </div>

          {/* 各機能パネルの説明 */}
          <div className="space-y-2">
            <div className="font-bold text-slate-200 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-violet-400" />
              <span>パネル機能</span>
            </div>
            <ul className="space-y-1.5 text-slate-400 list-disc list-inside">
              <li>
                <strong className="text-slate-200">シンボルツリー</strong>: クラス・メソッド・関数の階層や呼び出し関係を一覧化。クリックでエディタへ直ジャンプ。
              </li>
              <li>
                <strong className="text-slate-200">コード辞書</strong>: コード内で使われているキーワード・ビルトイン関数・構文を検出し、日本語で詳細解説・ベストプラクティスを提示。
              </li>
              <li>
                <strong className="text-slate-200">品質 & 改善</strong>: 循環的複雑度やヘルススコアを診断し、早期リターン化などのリファクタリング提案を出力。
              </li>
              <li>
                <strong className="text-slate-200">フローチャート</strong>: 関数呼び出しを自律型DAGグラフとして描画。ノードクリックで該当コード行にフォーカス。
              </li>
            </ul>
          </div>
        </div>

        {/* フッター */}
        <div className="pt-2 border-t border-white/[0.08] flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30 transition-all"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};
