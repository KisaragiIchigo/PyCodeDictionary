import React, { useState } from 'react';
import { HelpCircle, CheckCircle2, XCircle, Sparkles, RotateCcw } from 'lucide-react';
import { QuizItem, QuizOption } from '../../types';

interface DictionaryQuizProps {
  quiz: QuizItem;
}

export const DictionaryQuiz: React.FC<DictionaryQuizProps> = ({ quiz }) => {
  const [selectedOption, setSelectedOption] = useState<QuizOption | null>(null);

  const handleSelect = (option: QuizOption) => {
    setSelectedOption(option);
  };

  const handleReset = () => {
    setSelectedOption(null);
  };

  return (
    <div className="p-3.5 rounded-xl bg-slate-950/80 border border-white/[0.08] space-y-3">
      {/* ヘッダー */}
      <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
        <div className="flex items-center gap-1.5">
          <HelpCircle className="w-4 h-4 text-amber-400" />
          <span className="font-semibold text-xs text-slate-100">1タップ理解度チェック</span>
        </div>
        {selectedOption && (
          <button
            onClick={handleReset}
            className="text-[10px] text-slate-400 hover:text-slate-200 flex items-center gap-1 bg-white/[0.04] px-2 py-0.5 rounded border border-white/[0.06] transition-all"
          >
            <RotateCcw className="w-3 h-3" />
            <span>もう一度解く</span>
          </button>
        )}
      </div>

      {/* 設問文 */}
      <div className="text-xs text-slate-200 font-medium leading-snug">
        {quiz.question}
      </div>

      {/* 選択肢一覧 */}
      <div className="space-y-1.5">
        {quiz.options.map((option) => {
          const isChosen = selectedOption === option;
          const isAnswered = selectedOption !== null;

          let btnStyle = 'w-full p-2.5 rounded-lg border text-left text-xs font-medium transition-all duration-150 flex items-start gap-2 ';

          if (!isAnswered) {
            btnStyle += 'bg-slate-900/80 hover:bg-slate-900 border-white/[0.06] hover:border-cyan-500/40 text-slate-300 hover:text-slate-100';
          } else if (option.isCorrect) {
            btnStyle += 'bg-emerald-500/20 border-emerald-500/60 text-emerald-200 shadow-[0_0_12px_rgba(16,185,129,0.3)]';
          } else if (isChosen && !option.isCorrect) {
            btnStyle += 'bg-rose-500/20 border-rose-500/60 text-rose-200 shadow-[0_0_12px_rgba(244,63,94,0.3)]';
          } else {
            btnStyle += 'bg-slate-950/40 border-white/[0.02] text-slate-500 opacity-60';
          }

          return (
            <button
              key={option.id}
              disabled={isAnswered}
              onClick={() => handleSelect(option)}
              className={btnStyle}
            >
              <span className="shrink-0 font-mono text-[11px] px-1.5 py-0.2 rounded bg-white/[0.06] text-slate-400">
                {option.id.toUpperCase()}
              </span>
              <span className="flex-1 leading-snug">{option.text}</span>
              {isAnswered && option.isCorrect && (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              )}
              {isAnswered && isChosen && !option.isCorrect && (
                <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
              )}
            </button>
          );
        })}
      </div>

      {/* 正誤判定と解説 */}
      {selectedOption && (
        <div className={`p-3 rounded-lg border text-xs leading-relaxed space-y-1 animate-fadeIn ${
          selectedOption.isCorrect
            ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
            : 'bg-rose-950/40 border-rose-500/40 text-rose-200'
        }`}>
          <div className="font-bold flex items-center gap-1.5">
            {selectedOption.isCorrect ? (
              <>
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>正解！素晴らしい！</span>
              </>
            ) : (
              <>
                <XCircle className="w-3.5 h-3.5 text-rose-400" />
                <span>惜しい！</span>
              </>
            )}
          </div>
          <p className="text-[11px] text-slate-300">
            {selectedOption.explanation}
          </p>
        </div>
      )}
    </div>
  );
};
