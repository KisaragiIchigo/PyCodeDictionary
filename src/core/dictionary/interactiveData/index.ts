import { DictEntry, SupportedLanguage, InteractiveExplanation } from '../../../types';
import { pythonInteractiveMap } from './pythonInteractive';
import { jsTsInteractiveMap } from './jsTsInteractive';

export function resolveInteractiveExplanation(entry: DictEntry): InteractiveExplanation | undefined {
  if (entry.interactive) {
    return entry.interactive;
  }

  const term = entry.term.toLowerCase();
  const lang = entry.language;

  if (lang === 'python' || lang === 'all') {
    if (pythonInteractiveMap[term]) return pythonInteractiveMap[term];
  }

  if (lang === 'typescript' || lang === 'javascript' || lang === 'all') {
    if (jsTsInteractiveMap[term]) return jsTsInteractiveMap[term];
  }

  // デフォルトのフォールバック生成（未登録のカスタム用語やビルトイン用）
  if (entry.example) {
    return generateFallbackInteractive(entry);
  }

  return undefined;
}

function generateFallbackInteractive(entry: DictEntry): InteractiveExplanation {
  const exampleCode = entry.example || `${entry.term}()`;
  const firstLine = exampleCode.split('\n')[0] || entry.term;

  return {
    anatomy: {
      title: `${entry.term} の構文構造`,
      description: entry.summary,
      codeTemplate: firstLine,
      tokens: [
        { text: entry.term, role: `${entry.category} シンボル`, explanation: entry.summary, type: 'keyword' },
        { text: '...', role: 'パラメータ / 構文ブロック', explanation: entry.detailedExplanation, type: 'param' }
      ]
    },
    playgroundDefaultCode: exampleCode,
    quiz: {
      question: `「${entry.term}」の主な用途として最も適切なものは？`,
      options: [
        { id: '1', text: entry.summary, isCorrect: true, explanation: `正解！${entry.detailedExplanation}` },
        { id: '2', text: '不要なリソースの消費を増大させるための構文', isCorrect: false, explanation: '誤りです。' },
        { id: '3', text: 'コンパイルエラーを強制発生させるテスト専用キーワード', isCorrect: false, explanation: '誤りです。' }
      ]
    }
  };
}
